"use server";

import { resolveTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { executeOthmane } from "@/lib/othmane-core";
import type { OthmaneOutcome } from "@/lib/othmane";

export async function runOthmane(input: {
  objectif: string;
  canaux: string[];
  budgetK: number;
}): Promise<OthmaneOutcome> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { outcome } = await executeOthmane(t.ctx, input);
  if (outcome.ok) {
    revalidatePath("/agents/othmane");
    revalidatePath("/agents");
    revalidatePath("/deliverables");
    revalidatePath("/dashboard");
  }
  return outcome;
}