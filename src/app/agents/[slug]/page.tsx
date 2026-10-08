import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import AppShell from "@/components/AppShell";
import AgentStudio from "@/components/agent-studio/AgentStudio";
import { getTenantContext } from "@/lib/tenant";
import { getOrgProfile } from "@/lib/org-profile";
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

   const [taskFields, contractInputs, contractOutputs, contractMeta, workflowUsage, permissions, executionHistory, deliverables, realStats] = await Promise.all([
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
    sql`
      SELECT
        (SELECT COUNT(*) FROM agent_runs
           WHERE agent_id = ${agent.id} AND org_id = ${orgId}) AS runs,
        (SELECT COUNT(*) FROM agent_runs
           WHERE agent_id = ${agent.id} AND org_id = ${orgId} AND status = 'erreur') AS errors,
        (SELECT COUNT(*) FROM approvals
           WHERE agent_id = ${agent.id} AND org_id = ${orgId} AND status = 'en_attente') AS pending
    `,
  ]);

  // Compteurs de permissions : calculés depuis l'historique réel de l'organisation.
  const runs = Number(realStats[0].runs);
  const errors = Number(realStats[0].errors);
  const pending = Number(realStats[0].pending);
  const permissionsView = (permissions as unknown as Permission[]).map((p) => {
    if (p.stats_text) return p;
    if (p.mode === "AUTO") {
      return {
        ...p,
        stats_text:
          runs === 0
            ? "Aucune exécution réelle"
            : `${runs} exécution${runs > 1 ? "s" : ""} réelle${runs > 1 ? "s" : ""} · ${errors} incident${errors > 1 ? "s" : ""}`,
      };
    }
    if (p.mode === "APPROBATION_REQUISE") {
      return {
        ...p,
        stats_text:
          pending === 0 ? "Aucune demande en attente" : `${pending} en attente de décision`,
      };
    }
    return p;
  });
  

  // Karim : segment et enjeux viennent du profil commercial de l'organisation, sans pré-sélection.
  let fields = taskFields as unknown as TaskField[];
  if (slug === "karim") {
    const profile = await getOrgProfile(orgId);
    fields = fields.map((f) => {
      if (f.field_key === "segment_marche")
        return { ...f, label: `${f.label} (facultatif)`, options: profile.segments.map((label) => ({ label })) };
      if (f.field_key === "enjeux_prioritaires")
        return { ...f, label: `${f.label} (facultatif)`, options: profile.enjeux.map((label) => ({ label })) };
      return f;
    });
  }

  return (
    <AppShell>
      <AgentStudio
        agent={agent}
        taskFields={fields}
        contract={{
          inputs: contractInputs as unknown as ContractInput[],
          outputs: contractOutputs as unknown as ContractOutput[],
          meta: (contractMeta[0] as ContractMeta) ?? null,
          workflowUsage: workflowUsage as unknown as ContractWorkflowUsage[],
        }}
        permissions={permissionsView}
        executionHistory={executionHistory as unknown as ExecutionHistoryEntry[]}
        deliverables={deliverables as unknown as Deliverable[]}
      />
    </AppShell>
  );
}