"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { resolveTenant } from "@/lib/tenant";
import { traiterSuivis } from "@/lib/suivi-traiter";

export async function resolveApproval(
  id: number,
  decision: "approuve" | "rejete",
  reason?: string,
  texteFinal?: string
): Promise<{ ok: boolean; error?: string }> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { userId, orgId } = t.ctx;

  const why = reason?.trim() || null;
  if (decision === "rejete" && !why) return { ok: false, error: "Le motif du rejet est obligatoire." };

  // Le filtre org_id garantit qu'on ne peut pas agir sur la demande d'un autre client.
  const updated = await sql`
    UPDATE approvals
    SET status = ${decision}, resolved_at = now(), decision_reason = ${why}
    WHERE id = ${id} AND org_id = ${orgId} AND status = 'en_attente'
       RETURNING id, tag, payload, agent_id
  `;
  if (updated.length === 0) return { ok: false, error: "Demande introuvable ou déjà traitée." };

  await sql`
    INSERT INTO approval_events (approval_id, event_type, actor_user_id, reason, org_id)
    VALUES (${id}, ${decision === "approuve" ? "approved" : "rejected"}, ${userId}, ${why}, ${orgId})
  `;
    // Suivi des corrections d'Imane (P4-06b) : une ligne par brouillon traité.
  try {
    const rev = updated[0];
    if (rev.tag === "Réponse support" && rev.agent_id) {
      const p = rev.payload as { extract?: string; email_id?: string } | null;
      const original = (p?.extract ?? "").trim();
      const proposee = typeof texteFinal === "string" ? texteFinal.trim().slice(0, 5000) : "";
      const retenu = decision === "approuve" ? proposee || original : null;
      const modifie = decision === "approuve" && retenu !== original;
      const mail = p?.email_id
        ? await sql`
            SELECT tri_categorie, tri_priorite, canal
            FROM emails_entrants
            WHERE id = ${p.email_id} AND org_id = ${orgId}
          `
        : [];
      if (original && mail[0]?.tri_categorie) {
        await sql`
          INSERT INTO reponse_revisions
            (org_id, approval_id, email_id, agent_id, categorie, priorite, canal,
             decision, brouillon_original, texte_final, modifie, decided_by)
          VALUES (${orgId}, ${id}, ${p?.email_id ?? null}, ${rev.agent_id},
                  ${mail[0].tri_categorie}, ${mail[0].tri_priorite ?? null}, ${mail[0].canal ?? "email"},
                  ${decision}, ${original}, ${retenu}, ${modifie}, ${userId})
          ON CONFLICT (approval_id) DO NOTHING
        `;
      }
    }
  } catch (e) {
    console.error("resolveApproval revision", e);
  }

  // Escalade support : boucler l'exécution du workflow et l'e-mail d'origine.
   // Support : boucler l'exécution du workflow et l'e-mail d'origine
  // (escalade humaine ou validation d'un brouillon de réponse d'Imane).
  try {
    const p = updated[0].payload as { execution_id?: number; email_id?: string } | null;
    const tag = updated[0].tag as string;
    const noeud = tag === "Escalade" ? "escalade" : tag === "Réponse support" ? "imane_reply" : null;
    if (noeud && p?.execution_id) {
      const note = decision === "approuve" ? "Approuvée" : "Rejetée";
      await sql`
        UPDATE workflow_node_runs SET state = 'done', note = ${note}
        WHERE execution_id = ${p.execution_id} AND node_key = ${noeud} AND org_id = ${orgId}
      `;
      await sql`
        UPDATE workflow_executions
        SET status = 'termine', progress_done = progress_total, current_step = ${noeud}, finished_at = now()
        WHERE id = ${p.execution_id} AND org_id = ${orgId}
      `;
      if (p.email_id) {
        // Brouillon rejeté : l'e-mail reste à traiter par un humain.
        const statut = tag === "Réponse support" && decision === "rejete" ? "attente_interne" : "resolu";
        await sql`
          UPDATE emails_entrants SET statut_traitement = ${statut}
          WHERE id = ${p.email_id} AND org_id = ${orgId}
        `;
      }
    }
    } catch (e) {
    console.error("resolveApproval escalade", e);
  }

  // Suivi d'avancement (P4-07) : événement « étape validée », une ligne par approbation validée.
  try {
    if (decision === "approuve") {
      const rev = updated[0];
      const p = rev.payload as { execution_id?: number; email_id?: string; node_key?: string } | null;
      const noeud =
        rev.tag === "Escalade"
          ? "escalade"
          : rev.tag === "Réponse support"
            ? "imane_reply"
            : p?.node_key ?? null;
      if (noeud && p?.execution_id) {
        await sql`
          INSERT INTO etapes_validees
            (org_id, execution_id, node_key, approval_id, agent_id, tag, decided_by, payload)
          VALUES (${orgId}, ${p.execution_id}, ${noeud}, ${id}, ${rev.agent_id ?? null},
                  ${rev.tag}, ${userId}, ${JSON.stringify({ email_id: p.email_id ?? null })}::jsonb)
          ON CONFLICT (approval_id) DO NOTHING
        `;
      }
    }
  } catch (e) {
    console.error("resolveApproval etape validee", e);
  }

  // Suivi d'avancement (P4-07) : le brouillon de Soumaya suit la décision.
  // Aucun envoi réel : « envoye » signifie « validé, envoi non branché ».
  try {
    const rev = updated[0];
    const p = rev.payload as { suivi_id?: number } | null;
        if (rev.tag === "Suivi d'avancement" && p?.suivi_id) {
      const proposee = typeof texteFinal === "string" ? texteFinal.trim().slice(0, 5000) : "";
      // Lecture avant mise à jour : le texte d'origine sert de référence pour détecter une correction.
      const sb = await sql`
        SELECT node_key, canal, texte, agent_id
        FROM suivi_brouillons
        WHERE id = ${p.suivi_id} AND org_id = ${orgId}
      `;
      if (decision === "approuve") {
        await sql`
          UPDATE suivi_brouillons
          SET statut = 'envoye', texte = COALESCE(NULLIF(${proposee}, ''), texte)
          WHERE id = ${p.suivi_id} AND org_id = ${orgId}
        `;
      } else {
        await sql`
          UPDATE suivi_brouillons SET statut = 'rejete'
          WHERE id = ${p.suivi_id} AND org_id = ${orgId}
        `;
      }
      // Suivi des corrections (P4-07) : une ligne par message décidé.
      try {
        if (sb[0]) {
          const original = String(sb[0].texte ?? "").trim();
          const retenu = decision === "approuve" ? proposee || original : null;
          const modifie = decision === "approuve" && retenu !== original;
          await sql`
            INSERT INTO suivi_revisions
              (org_id, approval_id, suivi_id, agent_id, categorie, canal,
               decision, brouillon_original, texte_final, modifie, decided_by)
            VALUES (${orgId}, ${id}, ${p.suivi_id}, ${sb[0].agent_id as number},
                    ${sb[0].node_key as string}, ${(sb[0].canal as string) ?? "email"},
                    ${decision}, ${original}, ${retenu}, ${modifie}, ${userId})
            ON CONFLICT (approval_id) DO NOTHING
          `;
        }
      } catch (err) {
        console.error("resolveApproval suivi revision", err);
      }
    }
  } catch (e) {
    console.error("resolveApproval suivi", e);
  }
  // Analyse des causes (P4-08) : l'analyse de Hamza suit la décision. Aucune action externe.
  try {
    const rev = updated[0];
    const p = rev.payload as { analyse_id?: number | string } | null;
    const analyseId = Number(p?.analyse_id);
    if (rev.tag === "Analyse des causes" && Number.isInteger(analyseId) && analyseId > 0) {
      await sql`
        UPDATE analyses_causes
        SET statut = ${decision === "approuve" ? "valide" : "rejete"},
            decided_by = ${userId}, decided_at = now()
        WHERE id = ${analyseId} AND org_id = ${orgId} AND statut = 'a_valider'
      `;
    }
  } catch (e) {
    console.error("resolveApproval analyse causes", e);
  }
    // Relance de devis (P4-10b) : le brouillon d'Anas suit la décision. Aucun envoi réel.
  try {
    const rev = updated[0];
    const p = rev.payload as { relance_id?: number | string } | null;
    const relanceId = Number(p?.relance_id);
    if (rev.tag === "Relance de devis" && Number.isInteger(relanceId) && relanceId > 0) {
      await sql`
        UPDATE relances_devis
        SET statut = ${decision === "approuve" ? "valide" : "rejete"},
            decided_by = ${userId}, decided_at = now()
        WHERE id = ${relanceId} AND org_id = ${orgId} AND statut = 'a_valider'
      `;
    }
  } catch (e) {
    console.error("resolveApproval relance devis", e);
  }

 // Validation du devis (P4-10d, P4-09j) : un devis approuvé émet l'événement « étape validée » (étape Salma) qui
  // alimente le suivi d'avancement de Soumaya. Si le devis vient d'une exécution de la chaîne Prospect to Cash
  // (execution_id renseigné), cette exécution est clôturée ; sinon une exécution « Devis » est créée.
  try {
    const rev = updated[0];
    const p = rev.payload as { devis_validation_id?: number | string } | null;
    const validationId = Number(p?.devis_validation_id);
    if (rev.tag === "Validation du devis" && Number.isInteger(validationId) && validationId > 0) {
      // Prise de la validation en une instruction : jamais deux exécutions pour le même devis.
      const pris = await sql`
        UPDATE devis_validations
        SET statut = ${decision === "approuve" ? "valide" : "rejete"}, decided_by = ${userId}, decided_at = now()
        WHERE id = ${validationId} AND org_id = ${orgId} AND statut = 'a_valider'
        RETURNING id, salma_run_id, client, verdict, execution_id
      `;
      const v = pris[0];
      const chaineId = v && v.execution_id ? Number(v.execution_id) : null;
      if (v && chaineId) {
        // Exécution de la chaîne : le dernier nœud et l'exécution reflètent la décision.
        if (decision === "approuve") {
          await sql`
            UPDATE workflow_node_runs SET state = 'done', note = 'Devis validé'
            WHERE execution_id = ${chaineId} AND node_key = 'approval' AND org_id = ${orgId}
          `;
          await sql`
            UPDATE workflow_executions
            SET status = 'termine', progress_done = 6, current_step = 'approval', finished_at = now()
            WHERE id = ${chaineId} AND org_id = ${orgId}
          `;
          const sa = await sql`SELECT id FROM agents WHERE slug = 'salma'`;
          await sql`
            INSERT INTO etapes_validees
              (org_id, execution_id, node_key, approval_id, agent_id, tag, decided_by, payload)
            VALUES (${orgId}, ${chaineId}, 'salma', ${id}, ${sa[0]?.id ?? null},
                    ${rev.tag}, ${userId}, '{}'::jsonb)
            ON CONFLICT (approval_id) DO NOTHING
          `;
        } else {
          await sql`
            UPDATE workflow_node_runs SET state = 'failed', note = 'Devis rejeté'
            WHERE execution_id = ${chaineId} AND node_key = 'approval' AND org_id = ${orgId}
          `;
          await sql`
            UPDATE workflow_executions
            SET status = 'echoue', progress_done = 5, current_step = 'approval', finished_at = now()
            WHERE id = ${chaineId} AND org_id = ${orgId}
          `;
        }
      } else if (v && decision === "approuve") {
        const wf = await sql`SELECT id FROM workflows WHERE slug = 'prospect-to-cash'`;
        const sa = await sql`SELECT id FROM agents WHERE slug = 'salma'`;
        const ver = await sql`
          SELECT result->>'version' AS version FROM agent_runs
          WHERE id = ${v.salma_run_id as number} AND org_id = ${orgId}
        `;
        if (wf[0]) {
          const exec = await sql`
            INSERT INTO workflow_executions
              (workflow_id, status, progress_done, progress_total, current_step, client_label, run_label, org_id, finished_at)
            VALUES (${wf[0].id as number}, 'termine', 1, 1, 'salma', ${v.client as string}, 'Devis', ${orgId}, now())
            RETURNING id
          `;
          const executionId = exec[0].id as number;
          await sql`
            UPDATE workflow_executions SET run_label = ${`Devis ${ver[0]?.version ?? `#${executionId}`}`}
            WHERE id = ${executionId} AND org_id = ${orgId}
          `;
          await sql`
            INSERT INTO workflow_node_runs (execution_id, node_key, state, note, org_id)
            VALUES (${executionId}, 'salma', 'done', ${`Devis validé · ${v.verdict as string}`}, ${orgId})
          `;
          await sql`
            INSERT INTO etapes_validees
              (org_id, execution_id, node_key, approval_id, agent_id, tag, decided_by, payload)
            VALUES (${orgId}, ${executionId}, 'salma', ${id}, ${sa[0]?.id ?? null},
                    ${rev.tag}, ${userId}, '{}'::jsonb)
            ON CONFLICT (approval_id) DO NOTHING
          `;
          await sql`
            UPDATE devis_validations SET execution_id = ${executionId}
            WHERE id = ${validationId} AND org_id = ${orgId}
          `;
        }
      }
    }
  } catch (e) {
    console.error("resolveApproval validation devis", e);
  }
  // Suivi d'avancement (P4-10f) : le brouillon de Soumaya est produit tout de suite après la validation d'un devis,
  // sans appel manuel de /api/suivi/traiter. Un échec n'annule pas la décision.
  try {
    if (decision === "approuve" && updated[0]?.tag === "Validation du devis") {
      await traiterSuivis(orgId, userId);
    }
  } catch (e) {
    console.error("resolveApproval suivi", e);
  }
  revalidatePath("/approvals");
  revalidatePath("/dashboard");
  revalidatePath("/workflows");
  return { ok: true };

}

export async function delegateApproval(
  id: number,
  expertId: number,
  reason: string
): Promise<{ ok: boolean; error?: string }> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { userId, orgId } = t.ctx;

  const why = reason.trim();
  if (!why) return { ok: false, error: "Le motif de la délégation est obligatoire." };

  // L'expert doit appartenir à la même organisation que la demande.
  const experts = await sql`SELECT id FROM org_experts WHERE id = ${expertId} AND org_id = ${orgId}`;
  if (!experts[0]) return { ok: false, error: "Expert introuvable." };

  // Le statut et l'échéance (SLA) ne changent pas : la demande reste en attente.
  const updated = await sql`
    UPDATE approvals
    SET delegated_to = ${expertId}, delegated_at = now(), delegation_reason = ${why}
    WHERE id = ${id} AND org_id = ${orgId} AND status = 'en_attente'
    RETURNING id
  `;
  if (updated.length === 0) return { ok: false, error: "Demande introuvable ou déjà traitée." };

  await sql`
    INSERT INTO approval_events (approval_id, event_type, actor_user_id, target_expert_id, reason, org_id)
    VALUES (${id}, 'delegated', ${userId}, ${expertId}, ${why}, ${orgId})
  `;

  revalidatePath("/approvals");
  return { ok: true };
}