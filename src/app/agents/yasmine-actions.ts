"use server";

import { resolveTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { executeYasmine } from "@/lib/yasmine-core";
import type { YasmineOutcome } from "@/lib/yasmine";

export async function runYasmine(input: {
  signal: string;
  canaux: string[];
  compteCrm: string;
}): Promise<YasmineOutcome> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { outcome } = await executeYasmine(t.ctx, input);
  if (outcome.ok) {
    revalidatePath("/agents/yasmine");
    revalidatePath("/agents");
    revalidatePath("/deliverables");
    revalidatePath("/dashboard");
  }
  return outcome;
}