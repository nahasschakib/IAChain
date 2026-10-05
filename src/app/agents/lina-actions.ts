"use server";

import { resolveTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { executeLina } from "@/lib/lina-core";
import type { LinaOutcome } from "@/lib/lina";

export async function runLina(input: {
  brief: string;
  formats: string[];
  ton: string;
  registre: string;
}): Promise<LinaOutcome> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { outcome } = await executeLina(t.ctx, input);
  if (outcome.ok) {
    revalidatePath("/agents/lina");
    revalidatePath("/agents");
    revalidatePath("/deliverables");
    revalidatePath("/dashboard");
  }
  return outcome;
}