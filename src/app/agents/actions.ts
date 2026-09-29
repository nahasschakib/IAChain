"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";

// SIMULATION : enregistre une exécution factice tant que le moteur IA n'est pas branché.
export async function recordRun(agentId: number): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Non authentifié" };

  const agents = await sql`
    SELECT id, name, slug, output_label, cost_estimate FROM agents WHERE id = ${agentId}
  `;
  const agent = agents[0];
  if (!agent) return { ok: false, error: "Agent introuvable" };

  const last = await sql`
    SELECT kind FROM deliverables WHERE agent_id = ${agentId} ORDER BY id DESC LIMIT 1
  `;
  const kind = (last[0]?.kind as string | undefined) ?? "doc";

  const sims = await sql`
    SELECT COUNT(*) AS n FROM deliverables
    WHERE agent_id = ${agentId} AND origin LIKE 'Simulation%'
  `;
  const version = `v${Number(sims[0].n) + 1}`;

  const rawCost = agent.cost_estimate === null ? null : Number(agent.cost_estimate);
  const cost = rawCost === null || Number.isNaN(rawCost) ? null : rawCost;

  await sql`
    INSERT INTO agent_execution_history (agent_id, exec_date, description, status)
    VALUES (${agentId}, CURRENT_DATE, ${`Simulation · ${agent.output_label} ${version}`}, 'OK')
  `;
  await sql`
    INSERT INTO deliverables (title, agent_id, kind, version, agent_label, origin, cost, currency)
    VALUES (${agent.output_label as string}, ${agentId}, ${kind}, ${version},
            ${agent.name as string}, 'Simulation · Studio agent', ${cost}, 'MAD')
  `;

  revalidatePath(`/agents/${agent.slug as string}`);
  revalidatePath("/agents");
  revalidatePath("/deliverables");
  revalidatePath("/dashboard");
  return { ok: true };
}