import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { getPermissionMode } from "@/lib/permissions";
import { redigerSuivi, type EtapeAtraiter } from "@/lib/soumaya-suivi";

export const maxDuration = 60;

const LIMITE = 10;

// Étapes dont la validation envoie déjà un message au client (ou est interne) : pas de suivi.
const NODES_EXCLUS = ["escalade", "imane_reply"];

export async function POST() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (orgRole !== "org:admin")
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });

  const ag = await sql`SELECT id FROM agents WHERE name = 'Soumaya'`;
  if (!ag[0]) return NextResponse.json({ error: "Agent introuvable" }, { status: 500 });
  const agentId = ag[0].id as number;

  // Étapes exclues : marquées « ignore » une fois pour toutes.
  const exclus = await sql`
    UPDATE etapes_validees SET statut = 'ignore'
    WHERE org_id = ${orgId} AND statut = 'nouveau' AND node_key = ANY(${NODES_EXCLUS})
    RETURNING id
  `;

  const etapes = (await sql`
    SELECT e.id, e.org_id, e.execution_id, e.node_key,
           x.client_label, x.run_label,
           w.name AS workflow_nom,
           n.label AS etape_label,
           i.expediteur
    FROM etapes_validees e
    JOIN workflow_executions x ON x.id = e.execution_id AND x.org_id = e.org_id
    JOIN workflows w ON w.id = x.workflow_id
    LEFT JOIN workflow_nodes n ON n.workflow_slug = w.slug AND n.node_key = e.node_key
    LEFT JOIN emails_entrants i ON i.id::text = e.payload->>'email_id' AND i.org_id = e.org_id
    WHERE e.org_id = ${orgId} AND e.statut = 'nouveau'
    ORDER BY e.created_at
    LIMIT ${LIMITE}
  `) as EtapeAtraiter[];

  let brouillons = 0;
  let bloques = 0;
  let echecs = 0;

  for (const e of etapes) {
    // Prise de l'événement en une instruction : pas de double traitement.
    const pris = await sql`
      UPDATE etapes_validees SET statut = 'traite'
      WHERE id = ${e.id} AND org_id = ${orgId} AND statut = 'nouveau'
      RETURNING id
    `;
    if (pris.length === 0) continue;

    try {
      const mode = await getPermissionMode(agentId, "envoi_suivi", {
        orgId,
        categorie: e.node_key,
        canal: "email",
        priorite: null,
      });
      if (mode === "BLOQUE") {
        await sql`UPDATE etapes_validees SET statut = 'ignore' WHERE id = ${e.id} AND org_id = ${orgId}`;
        bloques += 1;
        continue;
      }
           const r = await redigerSuivi({ orgId, userId, agentId }, e);
      if (!r.ok) {
        // Échec : l'événement redevient « nouveau » pour un prochain passage.
        await sql`UPDATE etapes_validees SET statut = 'nouveau' WHERE id = ${e.id} AND org_id = ${orgId}`;
        echecs += 1;
      } else {
        brouillons += 1;
        if (mode !== "AUTO") {
          // Approbation « Suivi d'avancement » portant le brouillon (sans node_key :
          // sa validation ne doit pas produire un nouvel événement « étape validée »).
          try {
            const dossier = e.client_label ?? "Dossier";
            const payload = {
              source: "Proposé par Agent Soumaya · Suivi d'avancement",
              aiReco: "Valider le message de suivi",
              chips: [e.workflow_nom ?? "Workflow", e.etape_label ?? e.node_key],
              extractTitle: "Brouillon du message de suivi",
              extract: r.texte,
              props: [
                { k: "Dossier", v: dossier },
                { k: "Étape validée", v: e.etape_label ?? e.node_key },
                { k: "Destinataire", v: e.expediteur ?? "À renseigner" },
              ],
              lineage: ["Étape validée", "Brouillon Soumaya", "Validation humaine"],
              execution_id: e.execution_id,
              suivi_id: r.suiviId,
            };
            await sql`
              INSERT INTO approvals (title, tag, agent_id, agent_label, payload, org_id)
              VALUES (${`Suivi d'avancement · ${dossier}`}, 'Suivi d''avancement', ${agentId}, 'Soumaya',
                      ${JSON.stringify(payload)}::jsonb, ${orgId})
            `;
            await sql`
              UPDATE suivi_brouillons SET statut = 'a_valider'
              WHERE id = ${r.suiviId} AND org_id = ${orgId}
            `;
                  } catch (err) {
            // Le brouillon est conservé en statut « brouillon » ; l'événement reste « traite ».
            console.error("suivi approbation", err);
            brouillons -= 1;
            echecs += 1;
          }
        } else {
          // Mode automatique : le brouillon est journalisé (envoi non branché).
          try {
            await sql`
              INSERT INTO suivi_auto_journal
                (org_id, agent_id, action_key, suivi_id, etape_validee_id, execution_id,
                 categorie, canal, brouillon, agent_run_id)
              VALUES (${orgId}, ${agentId}, 'envoi_suivi', ${r.suiviId}, ${e.id}, ${e.execution_id},
                      ${e.node_key}, 'email', ${r.texte}, ${r.agentRunId})
              ON CONFLICT (suivi_id) DO NOTHING
            `;
          } catch (err) {
            console.error("suivi journal auto", err);
          }
        }
      }
    } catch (err) {
      console.error("traiter suivi", err);
      try {
        await sql`UPDATE etapes_validees SET statut = 'nouveau' WHERE id = ${e.id} AND org_id = ${orgId}`;
      } catch {}
      echecs += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    exclus: exclus.length,
    brouillons,
    bloques,
    echecs,
    restants_possibles: etapes.length === LIMITE,
  });
}