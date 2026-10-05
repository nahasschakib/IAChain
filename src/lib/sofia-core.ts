import { sql } from "@/lib/db";
import { keepMoroccoRelevant } from "./sofia-guards";
import { runAiTool } from "@/lib/ai";
import { computeCost } from "@/lib/cost";
import { getOrgProfile } from "@/lib/org-profile";
import { searchBrave, type BraveResult } from "@/lib/brave";
import {
  SOFIA_SYSTEM,
  SOFIA_TOOL,
  REGISTRES,
  parseAnalysis,
  buildQueries,
  freshnessOf,
  periodeLabel,
  zoneLabel,
  type SofiaOutcome,
  type SofiaResult,
} from "@/lib/sofia";

export type SofiaCoreInput = {
  thematique: string;
  sources: string[];
  zones: string[];
  frequences: string[];
  registre: string;
};

// Cœur de l'agent Sofia : appelé par l'écran Studio ET (plus tard) par le moteur de workflow.
export async function executeSofia(
  ctx: { orgId: string; userId: string },
  input: SofiaCoreInput
): Promise<{ outcome: SofiaOutcome; agentRunId: number | null }> {
  const { orgId, userId } = ctx;

  const thematique = String(input.thematique ?? "").trim();
  if (thematique.length < 20)
    return { outcome: { ok: false, error: "Thématique trop courte (20 caractères minimum)." }, agentRunId: null };
  if (thematique.length > 2000)
    return { outcome: { ok: false, error: "Thématique trop longue (2000 caractères maximum)." }, agentRunId: null };

  const sources = input.sources ?? [];
  const zones = input.zones ?? [];
  const registre = (REGISTRES as readonly string[]).includes(input.registre) ? input.registre : "Direct";
  const freshness = freshnessOf(input.frequences ?? []);
  const periode = periodeLabel(freshness);
  const zone = zoneLabel(zones);
  const traceInput = JSON.stringify({ thematique, sources, zones, frequences: input.frequences ?? [], registre });

  const agents = await sql`SELECT id, name, output_label FROM agents WHERE slug = 'sofia'`;
  const agent = agents[0];
  const agentId = agent?.id as number | undefined;
  if (!agent || !agentId) return { outcome: { ok: false, error: "Agent introuvable." }, agentRunId: null };

  // Offre et marchés de l'organisation : base des « écarts » et du contexte de veille.
  const org = await getOrgProfile(orgId);
  const offer = String(org.offer ?? "").slice(0, 2000);

  let raw: BraveResult[] = [];
  try {
    const queries = buildQueries(thematique, sources, zones);
    const batches = await Promise.all(queries.slice(0, 6).map((q) => searchBrave(q, 10, { freshness })));
    const byUrl = new Map<string, BraveResult>();
    for (const batch of batches) for (const r of batch) byUrl.set(r.url, r);
    raw = Array.from(byUrl.values());
  } catch (e) {
    console.error("executeSofia brave", e);
    return { outcome: { ok: false, error: "La recherche web a échoué. Réessaie dans un instant." }, agentRunId: null };
  }

  if (raw.length === 0) {
    return {
      outcome: { ok: false, error: `Aucun résultat sur les ${periode} : élargis la fréquence ou la zone.` },
      agentRunId: null,
    };
  }

  const validUrls = new Set(raw.map((r) => r.url));
  const resultsText = raw
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\nExtrait: ${r.description}`)
    .join("\n\n");

  const prompt =
    `<thematique_veille>\n${thematique}\n</thematique_veille>\n\n` +
    `Période couverte : ${periode}. Zone : ${zone}. Registre de rédaction demandé : ${registre}.\n` +
    (org.segments.length > 0 ? `Marchés suivis par l'organisation : ${org.segments.join(", ")}.\n` : "") +
    (offer ? `\n<offre_vendeur>\n${offer}\n</offre_vendeur>\n` : "\nOffre du vendeur : non fournie.\n") +
    `\n<resultats_recherche>\n${resultsText}\n</resultats_recherche>`;

  try {
    const ai = await runAiTool({ system: SOFIA_SYSTEM, prompt, tool: SOFIA_TOOL, tier: "fast", maxTokens: 4096 });
    const analysis = parseAnalysis(ai.data, validUrls);
    const result: SofiaResult = {
      ...analysis,
      thematique,
      periode,
      zone,
      registre,
      nb_sources_consultees: raw.length,
      statut: analysis.signaux.length >= 1 && analysis.opportunite ? "Veille prête" : "Veille à compléter",
    };
    const cost = await computeCost(ai.model, ai.inputTokens, ai.outputTokens);
    const stored = { ...result, cost_mad: cost?.mad ?? null, cost_usd: cost?.usd ?? null, usd_mad_rate: cost?.rate ?? null };

    const run = await sql`
      INSERT INTO agent_runs (org_id, agent_id, user_id, input, result, model, input_tokens, output_tokens, status)
      VALUES (${orgId}, ${agentId}, ${userId}, ${traceInput}::jsonb,
              ${JSON.stringify(stored)}::jsonb, ${ai.model}, ${ai.inputTokens}, ${ai.outputTokens}, 'ok')
      RETURNING id
    `;
    const agentRunId = run[0].id as number;

    // Trace métier : historique (toujours) + livrable (sauf veille à compléter). Pas d'approbation.
    try {
      const done = result.statut === "Veille prête";
      const description = `Veille — ${result.signaux.length} signal${result.signaux.length > 1 ? "aux" : ""} · ${periode}`;
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
        const base = (agent.output_label as string) ?? "Note de veille";
        const title = `${base} — ${thematique.slice(0, 60)}`;
        const version = `v${Number(prev[0].n) + 1}`;
        await sql`
          INSERT INTO deliverables (title, agent_id, kind, version, agent_label, origin, currency, cost, org_id)
          VALUES (${title}, ${agentId}, 'doc', ${version},
                  ${agent.name as string}, 'Agent Studio', 'MAD', ${cost ? cost.mad.toFixed(4) : null}, ${orgId})
        `;
      }
    } catch (e) {
      console.error("executeSofia trace", e);
    }

    return { outcome: { ok: true, result, costMad: cost?.mad }, agentRunId };
  } catch (e) {
    console.error("executeSofia", e);
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