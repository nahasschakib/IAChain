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