"use server";

import { resolveTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { executeKarim } from "@/lib/karim-core";
import type { KarimOutcome } from "@/lib/karim";

export async function runKarim(input: {
  profil: string;
  budget: string;
  registre: string;
  segment?: string;
  enjeux?: string[];
   offer?: string;
}): Promise<KarimOutcome> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { outcome } = await executeKarim(t.ctx, input);
  if (outcome.ok) {
    revalidatePath("/agents/karim");
    revalidatePath("/agents");
    revalidatePath("/deliverables");
    revalidatePath("/dashboard");
  }
  return outcome;
}