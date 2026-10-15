import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import AppShell from "@/components/AppShell";
import AgentStudio from "@/components/agent-studio/AgentStudio";
import { getTenantContext } from "@/lib/tenant";
import { getOrgProfile } from "@/lib/org-profile";
import { getSeriesReponses, getJournalAuto, getSeuilPromotion } from "@/lib/autonomie";
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
    const { orgId, isOrgAdmin, isPlatformAdmin } = await getTenantContext();
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
    // Réglages propres à l'organisation (accordés par l'Admin SOCYTAY) : remplacent le mode du catalogue.
  // Un BLOQUE au catalogue reste prioritaire (même règle que getPermissionMode).
  const reglagesOrg = await sql`
    SELECT p.action_key, o.mode
    FROM org_agent_permissions o
    JOIN agent_permissions p ON p.id = o.permission_id
    WHERE o.org_id = ${orgId} AND p.agent_id = ${agent.id}
  `;
  const modeOrg = new Map(reglagesOrg.map((r) => [r.action_key as string, r.mode as string]));
  const permissionsView = (permissions as unknown as Permission[]).map((brut) => {
    const reglage = brut.action_key ? modeOrg.get(brut.action_key) : undefined;
    // Le texte de statistiques du catalogue est global : on l'ignore quand le mode vient de l'organisation.
    const p: Permission =
      reglage && brut.mode !== "BLOQUE"
        ? { ...brut, mode: reglage as Permission["mode"], stats_text: "" }
        : brut;
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
    // Demandes de changement de mode en attente pour cette organisation (décidées par l'Admin SOCYTAY).
  const demandesEnAttente = await sql`
    SELECT r.permission_id, r.requested_mode, r.reason, r.requested_at
    FROM org_permission_requests r
    JOIN agent_permissions p ON p.id = r.permission_id
    WHERE r.org_id = ${orgId} AND p.agent_id = ${agent.id} AND r.status = 'en_attente'
  `;
  const demandeParPermission = new Map(
    demandesEnAttente.map((r) => [Number(r.permission_id), r])
  );
  const formatDemande = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    timeZone: "Africa/Casablanca",
  });
  const permissionsAvecDemande = permissionsView.map((p) => {
    const permissionId = (p as unknown as { id: number }).id;
    const attente = demandeParPermission.get(permissionId);
    return {
      ...p,
      demande: {
        permissionId,
        peutDemander: isOrgAdmin && Boolean(p.action_key),
        enAttente: attente
          ? {
              mode: attente.requested_mode as string,
              motif: (attente.reason as string | null) ?? null,
              date: formatDemande.format(new Date(attente.requested_at as string)),
            }
          : null,
      },
    };
  });
    // Imane : brouillons acceptés d'affilée sans correction, par catégorie (P4-06b).
    // Imane : brouillons acceptés d'affilée sans correction, par catégorie (P4-06b).
  const porteReponses = permissionsView.some((p) => p.action_key === "reponse_email");
  const serieReponses = porteReponses ? await getSeriesReponses(orgId, agent.id) : [];
   const seuilReponses = porteReponses
    ? await getSeuilPromotion(orgId, agent.id, "reponse_email")
    : 0;
  const journalReponses = porteReponses
    ? await getJournalAuto(orgId, agent.id, "reponse_email")
    : { recents7j: 0, entrees: [] };
   const permissionsAvecSerie = permissionsAvecDemande.map((p) =>
    p.action_key === "reponse_email"
      ? {
          ...p,
          autonomie: {
            seuil: seuilReponses,
            categories: serieReponses,
            agentId: agent.id,
            actionKey: "reponse_email",
            canal: "email",
            peutAppliquer: isPlatformAdmin,
            journal: journalReponses,
          },
        }
      : p
  );
    

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
        permissions={permissionsAvecSerie}
        executionHistory={executionHistory as unknown as ExecutionHistoryEntry[]}
        deliverables={deliverables as unknown as Deliverable[]}
      />
    </AppShell>
  );
}