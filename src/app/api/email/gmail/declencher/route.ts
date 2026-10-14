import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { getPermissionMode } from "@/lib/permissions";
import { redigerReponse } from "@/lib/imane-reply";

export const maxDuration = 60;

const LIMITE = 20;

type EmailTrie = {
  id: string;
  expediteur: string | null;
  objet: string | null;
  extrait: string | null;
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

async function clore(executionId: number, orgId: string, etape: string, status: "termine" | "echoue") {
  await sql`
    UPDATE workflow_executions
    SET status = ${status}, progress_done = progress_total, current_step = ${etape}, finished_at = now()
    WHERE id = ${executionId} AND org_id = ${orgId}
  `;
}

async function noeud(executionId: number, orgId: string, cle: string, state: string, note: string) {
  await sql`
    UPDATE workflow_node_runs SET state = ${state}, note = ${note}
    WHERE execution_id = ${executionId} AND node_key = ${cle} AND org_id = ${orgId}
  `;
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
    SELECT id, expediteur, objet, extrait, tri_categorie, tri_priorite, tri_traitement, tri_justification
    FROM emails_entrants
    WHERE org_id = ${orgId} AND execution_id IS NULL
      AND tri_categorie IS NOT NULL AND tri_categorie <> 'ignorer'
    ORDER BY recu_le DESC NULLS LAST
    LIMIT ${LIMITE}
  `) as EmailTrie[];

  let brouillonsAValider = 0;
  let brouillonsPrets = 0;
  let bloques = 0;
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
                ${humain ? "waiting" : "running"},
                ${humain ? "En attente de décision" : "Rédaction du brouillon"}, ${orgId})
      `;

      let statut = "en_cours";

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
          execution_id: executionId,
          email_id: m.id,
        };
        await sql`
          INSERT INTO approvals (title, tag, agent_id, agent_label, payload, org_id)
          VALUES (${`Escalade support · ${client}`}, 'Escalade', ${agentId}, 'Imane',
                  ${JSON.stringify(payload)}::jsonb, ${orgId})
        `;
        enAttente += 1;
        statut = "attente_interne";
      } else {
               const mode = await getPermissionMode(agentId, "reponse_email", {
          orgId,
          categorie: m.tri_categorie,
          canal: "email",
          priorite: m.tri_priorite,
        });
        if (mode === "BLOQUE") {
          await noeud(executionId, orgId, "imane_reply", "done", "Réponse bloquée par la permission");
          await clore(executionId, orgId, "imane_reply", "termine");
          bloques += 1;
          statut = "attente_interne";
        } else {
          const r = await redigerReponse({ orgId, userId, agentId }, m);
          if (!r.ok) {
            await noeud(executionId, orgId, "imane_reply", "failed", r.error);
            await clore(executionId, orgId, "imane_reply", "echoue");
            echecs += 1;
            statut = "attente_interne";
          } else if (mode === "AUTO") {
            await sql`
              INSERT INTO reponse_auto_journal
                (org_id, agent_id, action_key, email_id, execution_id, categorie, priorite, canal, brouillon, agent_run_id)
              VALUES (${orgId}, ${agentId}, 'reponse_email', ${m.id}, ${executionId},
                      ${m.tri_categorie}, ${m.tri_priorite}, 'email', ${r.texte}, ${r.agentRunId})
            `;
            await noeud(executionId, orgId, "imane_reply", "done", "Brouillon prêt (envoi non branché)");
            await clore(executionId, orgId, "imane_reply", "termine");
            brouillonsPrets += 1;
            statut = "attente_interne";
          } else {
            await noeud(executionId, orgId, "imane_reply", "waiting", "Brouillon à valider");
            const payload = {
              source: "Proposé par Agent Imane · Réponse au client",
              aiReco: "Valider le brouillon de réponse",
              chips: [m.tri_categorie, `Priorité ${m.tri_priorite ?? "?"}`, r.infosManquantes ? "Informations manquantes" : "Brouillon complet"],
              extractTitle: "Brouillon de réponse",
              extract: r.texte,
              props: [
                { k: "Destinataire", v: client },
                { k: "Catégorie", v: m.tri_categorie },
                { k: "Objet", v: (m.objet ?? "").slice(0, 120) },
              ],
              lineage: ["E-mail entrant", "Tri Imane", "Brouillon Imane", "Validation humaine"],
              execution_id: executionId,
              email_id: m.id,
            };
            await sql`
              INSERT INTO approvals (title, tag, agent_id, agent_label, payload, org_id)
              VALUES (${`Réponse support · ${client}`}, 'Réponse support', ${agentId}, 'Imane',
                      ${JSON.stringify(payload)}::jsonb, ${orgId})
            `;
            brouillonsAValider += 1;
            statut = "attente_interne";
          }
        }
      }

      await sql`
        UPDATE emails_entrants
        SET execution_id = ${executionId}, statut_traitement = ${statut}
        WHERE id = ${m.id} AND org_id = ${orgId}
      `;
    } catch (e) {
      console.error("declencher support", e);
      echecs += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    brouillons_a_valider: brouillonsAValider,
    brouillons_prets: brouillonsPrets,
    bloques,
    en_attente_humaine: enAttente,
    echecs,
    restants_possibles: emails.length === LIMITE,
  });
}