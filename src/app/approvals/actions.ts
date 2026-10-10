"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { resolveTenant } from "@/lib/tenant";

export async function resolveApproval(
  id: number,
  decision: "approuve" | "rejete",
  reason?: string
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
        RETURNING id, tag, payload
  `;
  if (updated.length === 0) return { ok: false, error: "Demande introuvable ou déjà traitée." };

  await sql`
    INSERT INTO approval_events (approval_id, event_type, actor_user_id, reason, org_id)
    VALUES (${id}, ${decision === "approuve" ? "approved" : "rejected"}, ${userId}, ${why}, ${orgId})
  `;

  // Escalade support : boucler l'exécution du workflow et l'e-mail d'origine.
  try {
    const p = updated[0].payload as { execution_id?: number; email_id?: string } | null;
    if (updated[0].tag === "Escalade" && p?.execution_id) {
      const note = decision === "approuve" ? "Approuvée" : "Rejetée";
      await sql`
        UPDATE workflow_node_runs SET state = 'done', note = ${note}
        WHERE execution_id = ${p.execution_id} AND node_key = 'escalade' AND org_id = ${orgId}
      `;
      await sql`
        UPDATE workflow_executions
        SET status = 'termine', progress_done = progress_total, current_step = 'escalade', finished_at = now()
        WHERE id = ${p.execution_id} AND org_id = ${orgId}
      `;
      if (p.email_id) {
        await sql`
          UPDATE emails_entrants SET statut_traitement = 'resolu'
          WHERE id = ${p.email_id} AND org_id = ${orgId}
        `;
      }
    }
  } catch (e) {
    console.error("resolveApproval escalade", e);
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