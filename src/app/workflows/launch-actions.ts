"use server";

import { resolveTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { runProspectToCash, type ChainOutcome } from "@/lib/workflow-engine";

export async function launchProspectToCash(input: {
  signal: string;
  canaux: string[];
  compteCrm: string;
  fit?: string;
  budget?: string;
  maturite?: string;
  segment?: string;
  enjeux?: string[];
  offer?: string;
}): Promise<ChainOutcome> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const out = await runProspectToCash(t.ctx, input);
  if (out.ok) {
    revalidatePath("/workflows");
    revalidatePath("/dashboard");
    revalidatePath("/agents");
    revalidatePath("/deliverables");
    revalidatePath("/approvals");
  }
  return out;
}