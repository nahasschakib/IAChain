import { sql } from "@/lib/db";
import { runAiTool } from "@/lib/ai";
import { computeCost } from "@/lib/cost";
import { getOrgProfile } from "@/lib/org-profile";
import {
  KARIM_SYSTEM,
  karimTool,
  parseAnalysis,
  parseImposed,
  applyImposed,
  buildPlan,
  type KarimOutcome,
} from "@/lib/karim";

export type KarimCoreInput = {
  profil: string;
  budget: string;
  registre: string;
  segment?: string; // imposé par le commercial (facultatif)
  enjeux?: string[]; // imposés par le commercial (facultatif)
  offer?: string; // offre pour cette exécution, remplace celle de l'organisation (facultatif)
};

// Cœur de l'agent Karim : appelé par l'écran Studio ET par le moteur de workflow.
export async function executeKarim(
  ctx: { orgId: string; userId: string },
  input: KarimCoreInput
): Promise<{ outcome: KarimOutcome; agentRunId: number | null }> {
  const { orgId, userId } = ctx;

  const profil = String(input.profil ?? "").trim();
  const budget = String(input.budget ?? "").trim();
  const registre = String(input.registre ?? "").trim();
  if (profil.length < 20)
    return { outcome: { ok: false, error: "Profil trop court (20 caractères minimum)." }, agentRunId: null };
  if (profil.length > 8000)
    return { outcome: { ok: false, error: "Profil trop long (8000 caractères maximum)." }, agentRunId: null };

  const agents = await sql`SELECT id, name, output_label FROM agents WHERE slug = 'karim'`;
  const agent = agents[0];
  const agentId = agent?.id as number | undefined;
  if (!agent || !agentId) return { outcome: { ok: false, error: "Agent introuvable." }, agentRunId: null };

  // Profil commercial de l'organisation : listes autorisées et offre du vendeur.
  const org = await getOrgProfile(orgId);
  const lists = { segments: org.segments, enjeux: org.enjeux };
  const imposed = parseImposed(input.segment, input.enjeux, lists);
    const offer = (String(input.offer ?? "").trim() || org.offer).slice(0, 2000);
  const traceInput = JSON.stringify({
    profil,
    budget,
    registre,
    segment: imposed.segment,
    enjeux: imposed.enjeux,
    offre: offer || null,
  });

  const prompt =
    `<profil_qualifie>\n${profil}\n</profil_qualifie>\n\n` +
    (offer ? `<offre_vendeur>\n${offer}\n</offre_vendeur>\n\n` : "") +
    `Registre de rédaction demandé : ${registre || "Direct"}.\n` +
    `Segment imposé par le commercial : ${imposed.segment ?? "non imposé"}.\n` +
    `Enjeux imposés par le commercial : ${imposed.enjeux.length > 0 ? imposed.enjeux.join(", ") : "non imposés"}.` +
    (offer ? "" : `\nOffre du vendeur : non fournie.`);

  try {
    const ai = await runAiTool({ system: KARIM_SYSTEM, prompt, tool: karimTool(lists), tier: "fast" });
    const result = buildPlan(applyImposed(parseAnalysis(ai.data, lists), imposed), budget, registre);
    const cost = await computeCost(ai.model, ai.inputTokens, ai.outputTokens);
    const stored = { ...result, cost_mad: cost?.mad ?? null, cost_usd: cost?.usd ?? null, usd_mad_rate: cost?.rate ?? null };

    const run = await sql`
      INSERT INTO agent_runs (org_id, agent_id, user_id, input, result, model, input_tokens, output_tokens, status)
      VALUES (${orgId}, ${agentId}, ${userId}, ${traceInput}::jsonb,
              ${JSON.stringify(stored)}::jsonb, ${ai.model}, ${ai.inputTokens}, ${ai.outputTokens}, 'ok')
      RETURNING id
    `;
    const agentRunId = run[0].id as number;

    // Trace métier : historique (toujours) + livrable (sauf plan à compléter).
    try {
      const done = result.statut === "Plan prêt";
      const who = result.prospect ? ` · ${result.prospect}` : "";
      const description = `Plan d'approche${who} — ${result.statut}`;
      await sql`
        INSERT INTO agent_execution_history (agent_id, exec_date, description, status, org_id)
        VALUES (${agentId}, CURRENT_DATE, ${description}, ${done ? "Terminé" : "En attente"}, ${orgId})
      `;
      if (done) {
        const prev = await sql`
          SELECT COUNT(*) AS n FROM deliverables
          WHERE agent_id = ${agentId} AND org_id = ${orgId}
            AND COALESCE(origin, '') NOT LIKE 'Simulation%'
        `;
        const base = (agent.output_label as string) ?? "Plan d'approche";
        const title = result.prospect ? `${base} — ${result.prospect}` : base;
        const version = `v${Number(prev[0].n) + 1}`;
        await sql`
          INSERT INTO deliverables (title, agent_id, kind, version, agent_label, origin, currency, cost, org_id)
          VALUES (${title}, ${agentId}, 'doc', ${version},
                  ${agent.name as string}, 'Agent Studio', 'MAD', ${cost ? cost.mad.toFixed(4) : null}, ${orgId})
        `;
      }
    } catch (e) {
      console.error("executeKarim trace", e);
    }

    return { outcome: { ok: true, result, costMad: cost?.mad }, agentRunId };
  } catch (e) {
    console.error("executeKarim", e);
    try {
      await sql`
        INSERT INTO agent_runs (org_id, agent_id, user_id, input, status, error)
        VALUES (${orgId}, ${agentId}, ${userId}, ${traceInput}::jsonb,
                'erreur', ${e instanceof Error ? e.message.slice(0, 500) : "inconnue"})
      `;
    } catch {}
    return { outcome: { ok: false, error: "L'agent n'a pas pu répondre. Réessaie dans un instant." }, agentRunId: null };
  }
}