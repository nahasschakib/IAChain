"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";

export async function resolveApproval(
  id: number,
  decision: "approuve" | "rejete",
  reason?: string
): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Non authentifié" };

  const why = reason?.trim() || null;
  if (decision === "rejete" && !why) return { ok: false, error: "Le motif du rejet est obligatoire." };

  await sql`
    UPDATE approvals
    SET status = ${decision}, resolved_at = now(), decision_reason = ${why}
    WHERE id = ${id} AND status = 'en_attente'
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
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Non authentifié" };

  const why = reason.trim();
  if (!why) return { ok: false, error: "Le motif de la délégation est obligatoire." };

  const experts = await sql`SELECT id FROM org_experts WHERE id = ${expertId}`;
  if (!experts[0]) return { ok: false, error: "Expert introuvable." };

  // Le statut et l'échéance (SLA) ne changent pas : la demande reste en attente.
  const updated = await sql`
    UPDATE approvals
    SET delegated_to = ${expertId}, delegated_at = now(), delegation_reason = ${why}
    WHERE id = ${id} AND status = 'en_attente'
    RETURNING id
  `;
  if (updated.length === 0) return { ok: false, error: "Demande introuvable ou déjà traitée." };

  await sql`
    INSERT INTO approval_events (approval_id, event_type, actor_user_id, target_expert_id, reason)
    VALUES (${id}, 'delegated', ${userId}, ${expertId}, ${why})
  `;

  revalidatePath("/approvals");
  return { ok: true };
}