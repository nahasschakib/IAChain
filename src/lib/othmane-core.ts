import { sql } from "@/lib/db";
import { runAiTool } from "@/lib/ai";
import { computeCost } from "@/lib/cost";
import {
  CANAUX,
  HORIZON_SEMAINES,
  OTHMANE_SYSTEM,
  othmaneTool,
  parsePlan,
  type OthmaneOutcome,
  type OthmaneResult,
} from "@/lib/othmane";

export type OthmaneCoreInput = {
  objectif: string;
  canaux: string[];
  budgetK: number;
};

type Veille = { opportunite: string; signaux: { titre: string; resume: string }[]; ecarts: string[] };

function rec(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
function s(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

// Dernière note de veille de Sofia pour cette organisation (tolère plusieurs formes de stockage).
async function loadLatestVeille(orgId: string): Promise<Veille | null> {
  const rows = await sql`
    SELECT r.result FROM agent_runs r
    JOIN agents a ON a.id = r.agent_id
    WHERE a.slug = 'sofia' AND r.org_id = ${orgId} AND r.status = 'ok' AND r.result IS NOT NULL
    ORDER BY r.id DESC LIMIT 1
  `;
  if (!rows[0]) return null;
   const brut = rows[0].result;
  let parsed: unknown = brut;
  if (typeof brut === "string") {
    try {
      parsed = JSON.parse(brut);
    } catch {
      return null;
    }
  }
  const root = rec(parsed);
  const a = rec(root.analysis ?? root.veille ?? root.analyse ?? root);
  const opportunite = s(a.opportunite, 800);
  const signaux = (Array.isArray(a.signaux) ? a.signaux : [])
    .map((x) => ({ titre: s(rec(x).titre, 200), resume: s(rec(x).resume, 400) }))
    .filter((x) => x.titre)
    .slice(0, 8);
  const ecarts = (Array.isArray(a.ecarts) ? a.ecarts : []).map((x) => s(x, 600)).filter(Boolean).slice(0, 5);
  if (!opportunite && signaux.length === 0) return null;
  return { opportunite, signaux, ecarts };
}

// Cœur de l'agent Othmane : plan marketing structuré, budget réparti en code.
export async function executeOthmane(
  ctx: { orgId: string; userId: string },
  input: OthmaneCoreInput,
): Promise<{ outcome: OthmaneOutcome; agentRunId: number | null }> {
  const { orgId, userId } = ctx;

  const canaux = (input.canaux ?? []).filter((c) => (CANAUX as readonly string[]).includes(c));
  if (canaux.length === 0)
    return { outcome: { ok: false, error: "Coche au moins un canal." }, agentRunId: null };
  const budgetK = Number(input.budgetK);
  if (!Number.isFinite(budgetK) || budgetK <= 0)
    return { outcome: { ok: false, error: "Budget invalide." }, agentRunId: null };

  const agents = await sql`SELECT id, name, output_label FROM agents WHERE slug = 'othmane'`;
  const agent = agents[0];
  const agentId = agent?.id as number | undefined;
  if (!agent || !agentId) return { outcome: { ok: false, error: "Agent introuvable." }, agentRunId: null };

  const veille = await loadLatestVeille(orgId);

  // Objectif : celui saisi, sinon l'opportunité identifiée par Sofia.
  let objectif = input.objectif.trim();
  let source: "saisi" | "veille" = "saisi";
  if (objectif.length < 20) {
    if (veille?.opportunite) {
      objectif = veille.opportunite;
      source = "veille";
    } else {
      return {
        outcome: {
          ok: false,
          error: "Objectif trop court (20 caractères minimum), et aucune note de veille de Sofia n'est disponible pour le compléter.",
        },
        agentRunId: null,
      };
    }
  }
  if (objectif.length > 2000)
    return { outcome: { ok: false, error: "Objectif trop long (2000 caractères maximum)." }, agentRunId: null };

  const profil = await sql`SELECT offer FROM org_profile WHERE org_id = ${orgId}`;
  const offre = s(profil[0]?.offer, 800);

  const veilleTxt = veille
    ? `<veille_marche>\nOpportunité : ${veille.opportunite || "non précisée"}\n` +
      veille.signaux.map((x, i) => `Signal ${i + 1} : ${x.titre} — ${x.resume}`).join("\n") +
      (veille.ecarts.length ? `\nÉcarts avec notre offre :\n- ${veille.ecarts.join("\n- ")}` : "") +
      `\n</veille_marche>\n\n`
    : "";

  const prompt =
    `<objectif>\n${objectif}\n</objectif>\n\n` +
    `<budget>${budgetK} k€ sur ${HORIZON_SEMAINES} semaines</budget>\n\n` +
    `<canaux_autorises>${canaux.join(", ")}</canaux_autorises>\n\n` +
    (offre ? `<offre_entreprise>\n${offre}\n</offre_entreprise>\n\n` : "") +
    veilleTxt;

  try {
    const ai = await runAiTool({ system: OTHMANE_SYSTEM, prompt, tool: othmaneTool(canaux), tier: "fast", maxTokens: 4096 });
    const plan = parsePlan(ai.data, canaux, budgetK);
    const cost = await computeCost(ai.model, ai.inputTokens, ai.outputTokens);

    if (plan.canaux.length === 0 || plan.calendrier.length === 0) {
      return {
        outcome: { ok: false, error: "Le plan produit est incomplet. Reformule l'objectif et relance." },
        agentRunId: null,
      };
    }

    const result: OthmaneResult = {
      ...plan,
      objectif,
      objectif_source: source,
      budget_k: budgetK,
      horizon_semaines: HORIZON_SEMAINES,
      veille_utilisee: Boolean(veille),
      nb_signaux_veille: veille?.signaux.length ?? 0,
    };
    const stored = { ...result, cost_mad: cost?.mad ?? null, cost_usd: cost?.usd ?? null, usd_mad_rate: cost?.rate ?? null };

    const run = await sql`
      INSERT INTO agent_runs (org_id, agent_id, user_id, input, result, model, input_tokens, output_tokens, status)
      VALUES (${orgId}, ${agentId}, ${userId}, ${JSON.stringify({ objectif, source, canaux, budgetK })}::jsonb,
              ${JSON.stringify(stored)}::jsonb, ${ai.model}, ${ai.inputTokens}, ${ai.outputTokens}, 'ok')
      RETURNING id
    `;
    const agentRunId = run[0].id as number;

    try {
      const description = `Plan marketing — ${plan.canaux.length} canaux, ${plan.calendrier.length} étapes`;
      await sql`
        INSERT INTO agent_execution_history (agent_id, exec_date, description, status, org_id)
        VALUES (${agentId}, CURRENT_DATE, ${description}, 'Terminé', ${orgId})
      `;
      const prev = await sql`
        SELECT COUNT(*) AS n FROM deliverables
        WHERE agent_id = ${agentId} AND org_id = ${orgId} AND COALESCE(origin, '') NOT LIKE 'Simulation%'
      `;
      const titre = `${(agent.output_label as string) ?? "Plan marketing"} — ${objectif.slice(0, 60)}`;
      const version = `v${Number(prev[0].n) + 1}`;
      await sql`
        INSERT INTO deliverables (title, agent_id, kind, version, agent_label, origin, currency, cost, org_id)
        VALUES (${titre}, ${agentId}, 'doc', ${version}, ${agent.name as string}, 'Agent Studio', 'MAD',
                ${cost ? cost.mad.toFixed(4) : null}, ${orgId})
      `;
    } catch (e) {
      console.error("executeOthmane trace", e);
    }

    return { outcome: { ok: true, result, costMad: cost?.mad }, agentRunId };
  } catch (e) {
    console.error("executeOthmane", e);
    try {
      await sql`
        INSERT INTO agent_runs (org_id, agent_id, user_id, input, status, error)
        VALUES (${orgId}, ${agentId}, ${userId}, ${JSON.stringify({ objectif, canaux, budgetK })}::jsonb,
                'erreur', ${e instanceof Error ? e.message.slice(0, 500) : "inconnue"})
      `;
    } catch {}
    return { outcome: { ok: false, error: "L'agent n'a pas pu répondre. Réessaie dans un instant." }, agentRunId: null };
  }
}