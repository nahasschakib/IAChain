"use server";

import { sql } from "@/lib/db";
import { resolveTenant } from "@/lib/tenant";
import { runAiTool } from "@/lib/ai";
import { computeCost } from "@/lib/cost";
import { revalidatePath } from "next/cache";
import {
  MEHDI_SYSTEM,
  MEHDI_TOOL,
  parseAssessment,
  scoreAssessment,
  type MehdiOutcome,
} from "@/lib/mehdi";


export async function runMehdi(input: {
  fiche: string;
  fit: string;
  budget: string;
  maturite: string;
}): Promise<MehdiOutcome> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { orgId, userId } = t.ctx;

  const fiche = input.fiche.trim();
  if (fiche.length < 20) return { ok: false, error: "Fiche prospect trop courte (20 caractères minimum)." };
  if (fiche.length > 8000) return { ok: false, error: "Fiche prospect trop longue (8000 caractères maximum)." };

  const agents = await sql`SELECT id, name, output_label FROM agents WHERE slug = 'mehdi'`;
  const agent = agents[0];
  const agentId = agent?.id as number | undefined;
  if (!agent || !agentId) return { ok: false, error: "Agent introuvable." };

  const hints = { fit: input.fit, budget: input.budget, maturite: input.maturite };
  const prompt =
    `<fiche_prospect>\n${fiche}\n</fiche_prospect>\n\n` +
    `Estimation du commercial (indicative, non prouvée) : fit ICP = ${hints.fit} ; ` +
    `budget = ${hints.budget} ; maturité = ${hints.maturite}.`;

  try {
    const ai = await runAiTool({ system: MEHDI_SYSTEM, prompt, tool: MEHDI_TOOL, tier: "fast" });
      const result = scoreAssessment(parseAssessment(ai.data));
    const cost = await computeCost(ai.model, ai.inputTokens, ai.outputTokens);
    const stored = { ...result, cost_mad: cost?.mad ?? null, cost_usd: cost?.usd ?? null, usd_mad_rate: cost?.rate ?? null };
    await sql`
      INSERT INTO agent_runs (org_id, agent_id, user_id, input, result, model, input_tokens, output_tokens, status)
      VALUES (${orgId}, ${agentId}, ${userId}, ${JSON.stringify({ fiche, hints })}::jsonb,
              ${JSON.stringify(stored)}::jsonb, ${ai.model}, ${ai.inputTokens}, ${ai.outputTokens}, 'ok')
    `;
        // Trace métier : historique (toujours) + livrable (sauf fiche à compléter).
    try {
      const done = result.verdict !== "À compléter";
              const who = result.prospect ? ` · ${result.prospect}` : "";
      const description = done
        ? `Qualification${who} — ${result.verdict} ${result.score}/100`
        : `Qualification${who} — fiche à compléter`;
      await sql`
        INSERT INTO agent_execution_history (agent_id, exec_date, description, status, org_id)
        VALUES (${agentId}, CURRENT_DATE, ${description}, ${done ? "Terminé" : "En attente"}, ${orgId})
      `; 
      let deliverableId: number | null = null;
      if (done) {
        const prev = await sql`
          SELECT COUNT(*) AS n FROM deliverables
          WHERE agent_id = ${agentId} AND org_id = ${orgId}
            AND COALESCE(origin, '') NOT LIKE 'Simulation%'
        `;
        const base = (agent.output_label as string) ?? "Fiche de qualification";
        const title = result.prospect ? `${base} — ${result.prospect}` : base;
        const version = `v${Number(prev[0].n) + 1}`;
        const inserted = await sql`
         INSERT INTO deliverables (title, agent_id, kind, version, agent_label, origin, currency, cost, org_id)
          VALUES (${title}, ${agentId}, 'doc', ${version},
         ${agent.name as string}, 'Agent Studio', 'MAD', ${cost ? cost.mad.toFixed(4) : null}, ${orgId})
          RETURNING id
        `;
        deliverableId = inserted[0].id as number;
        }
      if (result.verdict === "Qualifié") {
        const who = result.prospect || "prospect";
        const payload = {
          source: `Proposé par Agent ${agent.name as string} · Qualification commerciale`,
          aiReco: "Transmettre à la vente (go)",
          chips: [`Score ${result.score}/100`, `Fit ICP ${result.fit_icp}`, result.budget_estime],
          extractTitle: "Justification de l'agent",
          extract: result.justification,
          props: [
            { k: "Prospect", v: result.prospect || "non précisé" },
            { k: "Budget", v: result.budget_estime },
            { k: "Maturité", v: result.maturite_besoin },
          ],
          lineage: ["Fiche prospect", "Qualification IA", "Score calculé", "Décision go/no-go"],
        };
           await sql`
          INSERT INTO approvals (title, tag, agent_id, agent_label, payload, org_id, deliverable_id)
          VALUES (${`Go/no-go commercial · ${who}`}, 'Go/no-go', ${agentId}, ${agent.name as string},
                  ${JSON.stringify(payload)}::jsonb, ${orgId}, ${deliverableId})
        `;
      }
      revalidatePath("/agents/mehdi");
      revalidatePath("/approvals");
      revalidatePath("/agents");
      revalidatePath("/deliverables");
      revalidatePath("/dashboard");
    } catch (e) {
      console.error("runMehdi trace", e);
    }
       return { ok: true, result, costMad: cost?.mad };
  } catch (e) {
    console.error("runMehdi", e);
    try {
      await sql`
        INSERT INTO agent_runs (org_id, agent_id, user_id, input, status, error)
        VALUES (${orgId}, ${agentId}, ${userId}, ${JSON.stringify({ fiche, hints })}::jsonb,
                'erreur', ${e instanceof Error ? e.message.slice(0, 500) : "inconnue"})
      `;
    } catch {}
    return { ok: false, error: "L'agent n'a pas pu répondre. Réessaie dans un instant." };
  }
}