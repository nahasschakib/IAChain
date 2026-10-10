import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";

const LIMITE = 20;

type EmailTrie = {
  id: string;
  expediteur: string | null;
  objet: string | null;
  tri_categorie: string;
  tri_priorite: string | null;
  tri_traitement: string | null;
  tri_justification: string | null;
};

function nomExpediteur(exp: string | null): string {
  if (!exp) return "Client";
  const m = exp.match(/^\s*"?([^"<]+?)"?\s*</);
  return (m?.[1] ?? exp).trim().slice(0, 80) || "Client";
}

export async function POST() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (orgRole !== "org:admin")
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });

  const wf = await sql`SELECT id FROM workflows WHERE slug = 'support-client'`;
  const ag = await sql`SELECT id FROM agents WHERE name = 'Imane'`;
  if (!wf[0] || !ag[0])
    return NextResponse.json({ error: "Workflow ou agent introuvable" }, { status: 500 });
  const workflowId = wf[0].id as number;
  const agentId = ag[0].id as number;

  const emails = (await sql`
    SELECT id, expediteur, objet, tri_categorie, tri_priorite, tri_traitement, tri_justification
    FROM emails_entrants
    WHERE org_id = ${orgId} AND execution_id IS NULL
      AND tri_categorie IS NOT NULL AND tri_categorie <> 'ignorer'
    ORDER BY recu_le DESC NULLS LAST
    LIMIT ${LIMITE}
  `) as EmailTrie[];

  let automatiques = 0;
  let enAttente = 0;
  let echecs = 0;

  for (const m of emails) {
    const humain =
      m.tri_traitement === "validation_humaine" || m.tri_categorie === "securite_confidentialite";
    try {
      const client = nomExpediteur(m.expediteur);
      const exec = await sql`
        INSERT INTO workflow_executions
          (workflow_id, status, progress_done, progress_total, current_step, client_label, run_label, org_id)
        VALUES (${workflowId}, 'en_cours', 2, 8, ${humain ? "escalade" : "imane_reply"},
                ${client}, 'Support e-mail', ${orgId})
        RETURNING id
      `;
      const executionId = exec[0].id as number;
      await sql`UPDATE workflow_executions SET run_label = ${`#${executionId}`} WHERE id = ${executionId}`;

      const noteTri = `${m.tri_categorie} · priorité ${m.tri_priorite ?? "?"}`;
      await sql`
        INSERT INTO workflow_node_runs (execution_id, node_key, state, note, org_id)
        VALUES (${executionId}, 'imane_tri', 'done', ${noteTri}, ${orgId}),
               (${executionId}, 'condition', 'done',
                ${humain ? "Décision humaine requise" : "Traitement automatique"}, ${orgId}),
               (${executionId}, ${humain ? "escalade" : "imane_reply"},
                ${humain ? "waiting" : "pending"},
                ${humain ? "En attente de décision" : "Réponse non branchée"}, ${orgId})
      `;

      if (humain) {
        const payload = {
          source: "Proposé par Agent Imane · Tri du support",
          aiReco: "Décision humaine requise",
          chips: [m.tri_categorie, `Priorité ${m.tri_priorite ?? "?"}`, `Traitement ${m.tri_traitement ?? "?"}`],
          extractTitle: "Justification de l'agent",
          extract: m.tri_justification ?? "",
          props: [
            { k: "Demandeur", v: client },
            { k: "Catégorie", v: m.tri_categorie },
            { k: "Objet", v: (m.objet ?? "").slice(0, 120) },
          ],
          lineage: ["E-mail entrant", "Tri Imane", "Escalade humaine"],
        };
        await sql`
          INSERT INTO approvals (title, tag, agent_id, agent_label, payload, org_id)
          VALUES (${`Escalade support · ${client}`}, 'Escalade', ${agentId}, 'Imane',
                  ${JSON.stringify(payload)}::jsonb, ${orgId})
        `;
        enAttente += 1;
      } else {
        automatiques += 1;
      }

      await sql`
        UPDATE emails_entrants
        SET execution_id = ${executionId},
            statut_traitement = ${humain ? "attente_interne" : "en_cours"}
        WHERE id = ${m.id} AND org_id = ${orgId}
      `;
    } catch (e) {
      console.error("declencher support", e);
      echecs += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    automatiques,
    en_attente_humaine: enAttente,
    echecs,
    restants_possibles: emails.length === LIMITE,
  });
}