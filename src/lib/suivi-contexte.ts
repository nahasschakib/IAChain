import { sql } from "@/lib/db";

export type ContexteSuivi = {
  destinataire: string | null; // e-mail du contact, capturé par Yasmine
  contactNom: string | null;
  devisVersion: string | null; // vN du devis validé, si l'étape concerne un devis
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Ce que le code sait du dossier au moment de rédiger le suivi : contact (fiche de Yasmine) et devis validé.
// Ne lève jamais : un contexte vide donne un message plus générique, pas une erreur.
export async function contexteSuivi(orgId: string, executionId: number): Promise<ContexteSuivi> {
  const ctx: ContexteSuivi = { destinataire: null, contactNom: null, devisVersion: null };
  try {
    const y = await sql`
      SELECT r.result->>'email' AS email, r.result->>'contact_nom' AS nom
      FROM workflow_node_runs n
      JOIN agent_runs r ON r.id = n.agent_run_id AND r.org_id = n.org_id
      WHERE n.execution_id = ${executionId} AND n.org_id = ${orgId} AND n.node_key = 'yasmine'
      LIMIT 1
    `;
    const email = String(y[0]?.email ?? "").trim();
    if (EMAIL.test(email) && email.length <= 200) ctx.destinataire = email;
    const nom = String(y[0]?.nom ?? "").replace(/\s+/g, " ").trim();
    if (nom.length >= 2 && nom.length <= 80) ctx.contactNom = nom;
  } catch (e) {
    console.error("contexteSuivi contact", e);
  }
  try {
    const d = await sql`
      SELECT a.result->>'version' AS version
      FROM devis_validations v
      JOIN agent_runs a ON a.id = v.salma_run_id AND a.org_id = v.org_id
      WHERE v.execution_id = ${executionId} AND v.org_id = ${orgId}
      ORDER BY v.id DESC LIMIT 1
    `;
    const v = String(d[0]?.version ?? "").trim();
    if (/^v\d{1,4}$/i.test(v)) ctx.devisVersion = v;
  } catch (e) {
    console.error("contexteSuivi devis", e);
  }
  return ctx;
}