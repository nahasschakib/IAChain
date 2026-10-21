"use server";

import { resolveTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { executeNadia, listerPourNadia, type NadiaCoreInput } from "@/lib/nadia-core";
import type { ListePourNadia, NadiaOutcome } from "@/lib/nadia";

// Propositions de Salma à contrôler et motifs d'exception de la politique tarifaire.
export async function chargerPourNadia(): Promise<ListePourNadia> {
  const t = await resolveTenant();
  if (!t.ok) return { propositions: [], politique: null };
  return listerPourNadia(t.ctx.orgId);
}

export async function runNadia(input: NadiaCoreInput): Promise<NadiaOutcome> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { outcome } = await executeNadia(t.ctx, input);
  if (outcome.ok) {
    revalidatePath("/agents/nadia");
    revalidatePath("/agents");
    revalidatePath("/deliverables");
    revalidatePath("/dashboard");
  }
  return outcome;
}