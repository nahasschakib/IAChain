import { sql } from "@/lib/db";

// Étapes visibles d'un dossier de la chaîne Prospect to Cash, dans l'ordre, avec le nom lisible de chaque étape.
export const ETAPES_DOSSIER: { key: string; titre: string; agent: string }[] = [
  { key: "yasmine", titre: "Capture du prospect", agent: "Yasmine" },
  { key: "mehdi", titre: "Qualification", agent: "Mehdi" },
  { key: "karim", titre: "Plan d'approche", agent: "Karim" },
  { key: "salma", titre: "Devis", agent: "Salma" },
  { key: "nadia", titre: "Contrôle de la remise", agent: "Nadia" },
  { key: "approval", titre: "Validation du devis", agent: "Vous" },
];

export type EtapeDossier = {
  key: string;
  titre: string;
  agent: string;
  etat: "done" | "running" | "waiting" | "pending" | "failed";
  note: string | null;
};

export type ProchaineAction = { texte: string; bouton: string; href: string };

export type Dossier = {
  executionId: number;
  client: string;
  runLabel: string | null;
  statut: string; // en_cours | termine | echoue
  etapes: EtapeDossier[];
  actions: ProchaineAction[]; // actions attendues de l'utilisateur, la plus en amont d'abord
};

export type ResumeDossier = {
  executionId: number;
  client: string;
  runLabel: string | null;
  statut: string;
  etapeCourante: string;
  startedAt: string;
  horsChaine: boolean; // devis validé hors chaîne (exécution « Devis ») : une seule étape
};

// Liste des dossiers (une exécution de la chaîne = un dossier), les plus récents d'abord.
export async function listerDossiers(orgId: string): Promise<ResumeDossier[]> {
  const rows = await sql`
    SELECT x.id, x.client_label, x.run_label, x.status, x.current_step, x.started_at
    FROM workflow_executions x
    JOIN workflows w ON w.id = x.workflow_id
    WHERE x.org_id = ${orgId} AND w.slug = 'prospect-to-cash'
    ORDER BY x.id DESC
    LIMIT 50
  `;
  return rows.map((r) => ({
    executionId: Number(r.id),
    client: String(r.client_label ?? "Dossier"),
    runLabel: (r.run_label as string | null) ?? null,
    statut: String(r.status),
    etapeCourante: String(r.current_step ?? ""),
    startedAt: new Date(r.started_at as string).toISOString(),
    horsChaine: /^Devis/.test(String(r.run_label ?? "")),
  }));
}

export async function chargerDossier(orgId: string, executionId: number): Promise<Dossier | null> {
  if (!Number.isInteger(executionId) || executionId <= 0) return null;
  const ex = await sql`
    SELECT x.id, x.client_label, x.run_label, x.status
    FROM workflow_executions x
    JOIN workflows w ON w.id = x.workflow_id
    WHERE x.id = ${executionId} AND x.org_id = ${orgId} AND w.slug = 'prospect-to-cash'
  `;
  if (!ex[0]) return null;

  const nodes = await sql`
    SELECT node_key, state, note FROM workflow_node_runs
    WHERE execution_id = ${executionId} AND org_id = ${orgId}
  `;
  const parCle = new Map(nodes.map((n) => [String(n.node_key), n]));
  const etapes: EtapeDossier[] = ETAPES_DOSSIER.map((e) => {
    const n = parCle.get(e.key);
    return {
      ...e,
      etat: (n?.state as EtapeDossier["etat"] | undefined) ?? "pending",
      note: (n?.note as string | null | undefined) ?? null,
    };
  });

  // Actions humaines attendues, la plus en amont d'abord.
  const actions: ProchaineAction[] = [];
  // Go/no-go de Mehdi rattaché à ce dossier (payload.dossier_id posé par la chaîne).
  const gng = await sql`
    SELECT a.id FROM approvals a
    WHERE a.org_id = ${orgId} AND a.status = 'en_attente' AND a.tag = 'Go/no-go'
      AND a.payload->>'dossier_id' = ${String(executionId)}
    ORDER BY a.id DESC LIMIT 1
  `;
  if (gng[0]) {
    actions.push({
      texte: "Mehdi a qualifié ce prospect : décide de le transmettre à la vente ou non.",
      bouton: "Décider du go/no-go",
      href: `/approvals?id=${Number(gng[0].id)}`,
    });
  }
  const salma = etapes.find((e) => e.key === "salma");
  const appr = etapes.find((e) => e.key === "approval");
  if (salma?.etat === "waiting") {
    actions.push({
      texte: "Salma a proposé des lignes du catalogue : vérifie les quantités, puis chiffre le devis.",
      bouton: "Valider les lignes",
      href: `/agents/salma?dossier=${executionId}`,
    });
  } else if (appr?.etat === "waiting") {
    const a = await sql`
      SELECT a.id FROM approvals a
      JOIN devis_validations d ON d.id::text = a.payload->>'devis_validation_id' AND d.org_id = a.org_id
      WHERE a.org_id = ${orgId} AND a.status = 'en_attente' AND d.execution_id = ${executionId}
      ORDER BY a.id DESC LIMIT 1
    `;
    actions.push({
      texte: "Nadia a contrôlé le devis : décide s'il peut partir.",
      bouton: "Examiner le devis",
      href: a[0] ? `/approvals?id=${Number(a[0].id)}` : "/approvals",
    });
  }

  return {
    executionId,
    client: String(ex[0].client_label ?? "Dossier"),
    runLabel: (ex[0].run_label as string | null) ?? null,
    statut: String(ex[0].status),
    etapes,
    actions,
  };
}