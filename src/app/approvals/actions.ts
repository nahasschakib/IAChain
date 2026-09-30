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
    RETURNING id
  `;
  if (updated.length === 0) return { ok: false, error: "Demande introuvable ou déjà traitée." };

  await sql`
    INSERT INTO approval_events (approval_id, event_type, actor_user_id, reason, org_id)
    VALUES (${id}, ${decision === "approuve" ? "approved" : "rejected"}, ${userId}, ${why}, ${orgId})
  `;

  revalidatePath("/approvals");
  revalidatePath("/dashboard");
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