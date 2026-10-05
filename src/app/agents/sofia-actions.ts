"use server";

import { resolveTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { executeSofia, type SofiaCoreInput } from "@/lib/sofia-core";
import type { SofiaOutcome } from "@/lib/sofia";

export async function runSofia(input: SofiaCoreInput): Promise<SofiaOutcome> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { outcome } = await executeSofia(t.ctx, input);
  if (outcome.ok) {
    revalidatePath("/agents/sofia");
    revalidatePath("/agents");
    revalidatePath("/deliverables");
    revalidatePath("/dashboard");
  }
  return outcome;
}