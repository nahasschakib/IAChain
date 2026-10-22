import { sql } from "@/lib/db";
import { listPrestations } from "@/lib/catalogue-prestations";
import { getOrgProfile } from "@/lib/org-profile";
import type { Prestation } from "@/lib/catalogue-regle";
import type { PropositionLignes } from "@/lib/salma";

// Dossiers de la chaîne Prospect to Cash en attente de la validation des lignes de Salma.
export type DossierChaine = {
  executionId: number;
  client: string;
  runLabel: string | null;
  note: string | null;
};

export type DossierRepris =
  | {
      ok: true;
      executionId: number;
      agentRunId: number;
      client: string;
      objectif: string;
      budget: string;
      segment: string; // segment retenu par Karim s'il existe dans l'organisation, sinon chaîne vide
      proposition: PropositionLignes;
      catalogue: Prestation[];
      segments: string[];
    }
  | { ok: false; error: string };

export async function listerDossiersChaine(orgId: string): Promise<DossierChaine[]> {
  const rows = await sql`
    SELECT n.execution_id, n.note, x.client_label, x.run_label
    FROM workflow_node_runs n
    JOIN workflow_executions x ON x.id = n.execution_id AND x.org_id = n.org_id
    WHERE n.node_key = 'salma' AND n.state = 'waiting' AND n.org_id = ${orgId}
    ORDER BY n.execution_id DESC
    LIMIT 20
  `;
  return rows.map((r) => ({
    executionId: Number(r.execution_id),
    client: String(r.client_label ?? "Dossier"),
    runLabel: (r.run_label as string | null) ?? null,
    note: (r.note as string | null) ?? null,
  }));
}

export async function chargerDossierChaine(orgId: string, executionId: number): Promise<DossierRepris> {
  if (!Number.isInteger(executionId)) return { ok: false, error: "Dossier introuvable." };
  const nodes = await sql`
    SELECT agent_run_id FROM workflow_node_runs
    WHERE execution_id = ${executionId} AND node_key = 'salma' AND state = 'waiting' AND org_id = ${orgId}
    LIMIT 1
  `;
  const runId = Number(nodes[0]?.agent_run_id);
  if (!nodes[0] || !Number.isInteger(runId)) return { ok: false, error: "Ce dossier n'attend plus la validation des lignes." };

  const runs = await sql`
    SELECT input, result FROM agent_runs WHERE id = ${runId} AND org_id = ${orgId} AND status = 'ok'
  `;
  if (!runs[0]) return { ok: false, error: "La proposition de lignes de ce dossier est introuvable." };
  const input = (runs[0].input ?? {}) as Record<string, unknown>;
  const result = (runs[0].result ?? {}) as Record<string, unknown>;
  const prop = result.proposition as PropositionLignes | undefined;
  if (!prop || !Array.isArray(prop.lignes)) return { ok: false, error: "La proposition de lignes de ce dossier est illisible." };

  const org = await getOrgProfile(orgId);
  const catalogue = await listPrestations(orgId, true);

  // Segment retenu par Karim pour ce dossier : repris seulement s'il existe dans l'organisation.
  let segment = "";
  try {
    const k = await sql`
      SELECT r.result->>'segment' AS segment
      FROM workflow_node_runs kn
      JOIN agent_runs r ON r.id = kn.agent_run_id AND r.org_id = kn.org_id
      WHERE kn.execution_id = ${executionId} AND kn.node_key = 'karim' AND kn.org_id = ${orgId}
      LIMIT 1
    `;
    const s = String(k[0]?.segment ?? "");
    if (org.segments.includes(s)) segment = s;
  } catch (e) {
    console.error("chargerDossierChaine segment", e);
  }

  return {
    ok: true,
    executionId,
    agentRunId: runId,
    client: String(input.client ?? ""),
    objectif: String(input.objectif ?? ""),
    budget: String(input.budget ?? ""),
    segment,
    proposition: prop,
    catalogue,
    segments: org.segments,
  };
}