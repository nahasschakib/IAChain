"use server";

import { resolveTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { executeAnasRelance, listerPourRelance, type RelanceInput } from "@/lib/anas-relance-core";
import type { AnasRelanceOutcome, PropositionRelance } from "@/lib/anas-relance";
import { executeAnasNurturing, type NurturingInput } from "@/lib/anas-nurturing-core";
import type { AnasNurturingOutcome } from "@/lib/anas-nurturing";

export async function chargerPourRelance(): Promise<PropositionRelance[]> {
  const t = await resolveTenant();
  if (!t.ok) return [];
  return listerPourRelance(t.ctx.orgId);
}

export async function runAnasRelance(input: RelanceInput): Promise<AnasRelanceOutcome> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { outcome } = await executeAnasRelance(t.ctx, input);
  if (outcome.ok) {
    revalidatePath("/agents/anas");
    revalidatePath("/agents");
    revalidatePath("/approvals");
    revalidatePath("/deliverables");
    revalidatePath("/dashboard");
  }
  return outcome;
}

export async function runAnasNurturing(input: NurturingInput): Promise<AnasNurturingOutcome> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { outcome } = await executeAnasNurturing(t.ctx, input);
  if (outcome.ok) {
    revalidatePath("/agents/anas");
    revalidatePath("/agents");
    revalidatePath("/approvals");
    revalidatePath("/deliverables");
    revalidatePath("/dashboard");
  }
  return outcome;
}