import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import AppShell from "@/components/AppShell";
import AgentStudio from "@/components/agent-studio/AgentStudio";
import { getTenantContext } from "@/lib/tenant";
import type {
  Agent,
  TaskField,
  ContractInput,
  ContractOutput,
  ContractMeta,
  ContractWorkflowUsage,
  Permission,
  ExecutionHistoryEntry,
  Deliverable,
} from "@/components/agent-studio/types";

export default async function AgentStudioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { orgId } = await getTenantContext();
  const { slug } = await params;

  const agentRows = await sql`SELECT * FROM agents WHERE slug = ${slug}`;
  const agent = agentRows[0] as Agent | undefined;
  if (!agent) notFound();

  const [taskFields, contractInputs, contractOutputs, contractMeta, workflowUsage, permissions, executionHistory, deliverables] = await Promise.all([
    sql`SELECT * FROM agent_task_fields WHERE agent_id = ${agent.id} ORDER BY sort_order`,
    sql`SELECT * FROM agent_contract_inputs WHERE agent_id = ${agent.id} ORDER BY sort_order`,
    sql`SELECT * FROM agent_contract_outputs WHERE agent_id = ${agent.id} ORDER BY sort_order`,
    sql`SELECT * FROM agent_contract_meta WHERE agent_id = ${agent.id}`,
    sql`SELECT * FROM agent_contract_workflow_usage WHERE agent_id = ${agent.id} ORDER BY sort_order`,
    sql`SELECT * FROM agent_permissions WHERE agent_id = ${agent.id} ORDER BY sort_order`,
    sql`SELECT * FROM agent_execution_history WHERE agent_id = ${agent.id} AND org_id = ${orgId} ORDER BY exec_date DESC, id DESC`,
    sql`
      SELECT d.*, d.title AS name,
        COALESCE(
          CASE a.status
            WHEN 'en_attente' THEN 'En attente'
            WHEN 'approuve'   THEN 'Approuvé'
            WHEN 'rejete'     THEN 'Rejeté'
          END,
          d.approval_status
        ) AS approval_status
      FROM deliverables d
      LEFT JOIN approvals a ON a.deliverable_id = d.id
      WHERE d.agent_id = ${agent.id} AND d.org_id = ${orgId}
      ORDER BY d.id DESC
    `,
  ]);

  return (
    <AppShell>
      <AgentStudio
        agent={agent}
        taskFields={taskFields as unknown as TaskField[]}
        contract={{
          inputs: contractInputs as unknown as ContractInput[],
          outputs: contractOutputs as unknown as ContractOutput[],
          meta: (contractMeta[0] as ContractMeta) ?? null,
          workflowUsage: workflowUsage as unknown as ContractWorkflowUsage[],
        }}
        permissions={permissions as unknown as Permission[]}
        executionHistory={executionHistory as unknown as ExecutionHistoryEntry[]}
        deliverables={deliverables as unknown as Deliverable[]}
      />
    </AppShell>
  );
}