"use server";

import { sql } from "@/lib/db";
import { resolveTenant } from "@/lib/tenant";
import { runAiTool } from "@/lib/ai";
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

  const agents = await sql`SELECT id FROM agents WHERE slug = 'mehdi'`;
  const agentId = agents[0]?.id as number | undefined;
  if (!agentId) return { ok: false, error: "Agent introuvable." };

  const hints = { fit: input.fit, budget: input.budget, maturite: input.maturite };
  const prompt =
    `<fiche_prospect>\n${fiche}\n</fiche_prospect>\n\n` +
    `Estimation du commercial (indicative, non prouvée) : fit ICP = ${hints.fit} ; ` +
    `budget = ${hints.budget} ; maturité = ${hints.maturite}.`;

  try {
    const ai = await runAiTool({ system: MEHDI_SYSTEM, prompt, tool: MEHDI_TOOL, tier: "fast" });
    const result = scoreAssessment(parseAssessment(ai.data));
    await sql`
      INSERT INTO agent_runs (org_id, agent_id, user_id, input, result, model, input_tokens, output_tokens, status)
      VALUES (${orgId}, ${agentId}, ${userId}, ${JSON.stringify({ fiche, hints })}::jsonb,
              ${JSON.stringify(result)}::jsonb, ${ai.model}, ${ai.inputTokens}, ${ai.outputTokens}, 'ok')
    `;
    return { ok: true, result };
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