"use server";

import { resolveTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { executeMehdi } from "@/lib/mehdi-core";
import type { MehdiOutcome } from "@/lib/mehdi";

export async function runMehdi(input: {
  fiche: string;
  fit: string;
  budget: string;
  maturite: string;
}): Promise<MehdiOutcome> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { outcome } = await executeMehdi(t.ctx, input);
  if (outcome.ok) {
    revalidatePath("/agents/mehdi");
    revalidatePath("/approvals");
    revalidatePath("/agents");
    revalidatePath("/deliverables");
    revalidatePath("/dashboard");
  }
  return outcome;
}