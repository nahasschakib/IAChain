import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import AppShell from "@/components/AppShell";
import AgentStudio from "@/components/agent-studio/AgentStudio";
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
    sql`SELECT * FROM agent_execution_history WHERE agent_id = ${agent.id} ORDER BY exec_date DESC`,
    sql`SELECT *, title AS name FROM deliverables WHERE agent_id = ${agent.id} ORDER BY id DESC`,
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