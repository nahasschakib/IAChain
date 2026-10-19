"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { resolveTenant } from "@/lib/tenant";

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

  // Suivi d'avancement (P4-07) : le brouillon de Soumaya suit la décision.
  // Aucun envoi réel : « envoye » signifie « validé, envoi non branché ».
  try {
    const rev = updated[0];
    const p = rev.payload as { suivi_id?: number } | null;
    if (rev.tag === "Suivi d'avancement" && p?.suivi_id) {
      const proposee = typeof texteFinal === "string" ? texteFinal.trim().slice(0, 5000) : "";
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