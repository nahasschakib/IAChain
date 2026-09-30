"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { resolveTenant } from "@/lib/tenant";

// SIMULATION : enregistre une exécution factice tant que le moteur IA n'est pas branché.
export async function recordRun(agentId: number): Promise<{ ok: boolean; error?: string }> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { orgId } = t.ctx;

  const agents = await sql`
    SELECT id, name, slug, output_label, cost_estimate FROM agents WHERE id = ${agentId}
  `;
  const agent = agents[0];
  if (!agent) return { ok: false, error: "Agent introuvable" };

  const last = await sql`
    SELECT kind FROM deliverables WHERE agent_id = ${agentId} AND org_id = ${orgId} ORDER BY id DESC LIMIT 1
  `;
  const kind = (last[0]?.kind as string | undefined) ?? "doc";

  const sims = await sql`
    SELECT COUNT(*) AS n FROM deliverables
    WHERE agent_id = ${agentId} AND org_id = ${orgId} AND origin LIKE 'Simulation%'
  `;
  const version = `v${Number(sims[0].n) + 1}`;

  const rawCost = agent.cost_estimate === null ? null : Number(agent.cost_estimate);
  const cost = rawCost === null || Number.isNaN(rawCost) ? null : rawCost;

  await sql`
    INSERT INTO agent_execution_history (agent_id, exec_date, description, status, org_id)
    VALUES (${agentId}, CURRENT_DATE, ${`Simulation · ${agent.output_label} ${version}`}, 'OK', ${orgId})
  `;
  await sql`
    INSERT INTO deliverables (title, agent_id, kind, version, agent_label, origin, cost, currency, org_id)
    VALUES (${agent.output_label as string}, ${agentId}, ${kind}, ${version},
            ${agent.name as string}, 'Simulation · Studio agent', ${cost}, 'MAD', ${orgId})
  `;

  revalidatePath(`/agents/${agent.slug as string}`);
  revalidatePath("/agents");
  revalidatePath("/deliverables");
  revalidatePath("/dashboard");
  return { ok: true };
}