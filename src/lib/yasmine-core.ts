import { sql } from "@/lib/db";
import { runAiTool } from "@/lib/ai";
import { computeCost } from "@/lib/cost";
import {
  YASMINE_SYSTEM,
  YASMINE_TOOL,
  parseExtraction,
  scoreFiche,
  type YasmineOutcome,
} from "@/lib/yasmine";

export type YasmineCoreInput = {
  signal: string;
  canaux: string[];
  compteCrm: string;
};

// Cœur de l'agent Yasmine : appelé par l'écran Studio ET par le moteur de workflow.
export async function executeYasmine(
  ctx: { orgId: string; userId: string },
  input: YasmineCoreInput
): Promise<{ outcome: YasmineOutcome; agentRunId: number | null }> {
  const { orgId, userId } = ctx;

  const signal = String(input.signal ?? "").trim();
  const compteCrm = String(input.compteCrm ?? "").trim();
  const canaux = Array.isArray(input.canaux)
    ? input.canaux.filter((c): c is string => typeof c === "string").slice(0, 5)
    : [];
  if (signal.length < 20)
    return { outcome: { ok: false, error: "Signal trop court (20 caractères minimum)." }, agentRunId: null };
  if (signal.length > 8000)
    return { outcome: { ok: false, error: "Signal trop long (8000 caractères maximum)." }, agentRunId: null };
  if (compteCrm.length > 4000)
    return { outcome: { ok: false, error: "Compte CRM trop long (4000 caractères maximum)." }, agentRunId: null };

  const agents = await sql`SELECT id, name, output_label FROM agents WHERE slug = 'yasmine'`;
  const agent = agents[0];
  const agentId = agent?.id as number | undefined;
  if (!agent || !agentId) return { outcome: { ok: false, error: "Agent introuvable." }, agentRunId: null };

  const prompt =
    `<signal_brut>\n${signal}\n</signal_brut>\n\n` +
    `<compte_crm>\n${compteCrm || "(non fourni)"}\n</compte_crm>\n\n` +
    `Canal source indiqué : ${canaux.length ? canaux.join(", ") : "non précisé"}.`;

  try {
    const ai = await runAiTool({ system: YASMINE_SYSTEM, prompt, tool: YASMINE_TOOL, tier: "fast" });
    const result = scoreFiche(parseExtraction(ai.data, signal, compteCrm), canaux);
    const cost = await computeCost(ai.model, ai.inputTokens, ai.outputTokens);
    const stored = { ...result, cost_mad: cost?.mad ?? null, cost_usd: cost?.usd ?? null, usd_mad_rate: cost?.rate ?? null };

    const run = await sql`
      INSERT INTO agent_runs (org_id, agent_id, user_id, input, result, model, input_tokens, output_tokens, status)
      VALUES (${orgId}, ${agentId}, ${userId}, ${JSON.stringify({ signal, canaux, compteCrm })}::jsonb,
              ${JSON.stringify(stored)}::jsonb, ${ai.model}, ${ai.inputTokens}, ${ai.outputTokens}, 'ok')
      RETURNING id
    `;
    const agentRunId = run[0].id as number;

    // Trace métier : historique (toujours) + livrable (sauf signal insuffisant).
    try {
      const done = result.verdict !== "Signal insuffisant";
      const who = result.societe ? ` · ${result.societe}` : "";
      const description = done
        ? `Capture${who} — ${result.verdict}`
        : `Capture${who} — signal insuffisant`;
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
        const base = (agent.output_label as string) ?? "Fiche prospect";
        const title = result.societe ? `${base} — ${result.societe}` : base;
        const version = `v${Number(prev[0].n) + 1}`;
        await sql`
          INSERT INTO deliverables (title, agent_id, kind, version, agent_label, origin, currency, cost, org_id)
          VALUES (${title}, ${agentId}, 'doc', ${version},
                  ${agent.name as string}, 'Agent Studio', 'MAD', ${cost ? cost.mad.toFixed(4) : null}, ${orgId})
        `;
      }
    } catch (e) {
      console.error("executeYasmine trace", e);
    }

    return { outcome: { ok: true, result, costMad: cost?.mad }, agentRunId };
  } catch (e) {
    console.error("executeYasmine", e);
    try {
      await sql`
        INSERT INTO agent_runs (org_id, agent_id, user_id, input, status, error)
        VALUES (${orgId}, ${agentId}, ${userId}, ${JSON.stringify({ signal, canaux, compteCrm })}::jsonb,
                'erreur', ${e instanceof Error ? e.message.slice(0, 500) : "inconnue"})
      `;
    } catch {}
    return { outcome: { ok: false, error: "L'agent n'a pas pu répondre. Réessaie dans un instant." }, agentRunId: null };
  }
}