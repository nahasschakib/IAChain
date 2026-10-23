"use server";

import { resolveTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { executeKarima, listerPourKarima, type DevisAFacturer, type KarimaInput, type KarimaOutcome } from "@/lib/karima-core";

// Devis validés par un humain, avec l'état de leur facture et l'identité déjà connue du client.
export async function chargerPourKarima(): Promise<DevisAFacturer[]> {
  const t = await resolveTenant();
  if (!t.ok) return [];
  return listerPourKarima(t.ctx.orgId);
}

// Établit le brouillon de facture d'un devis validé et le soumet à l'approbation. Réservé aux administrateurs.
export async function runKarima(input: KarimaInput): Promise<KarimaOutcome> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  if (!t.ctx.isOrgAdmin) return { ok: false, error: "Réservé aux administrateurs de l'organisation." };
  const { outcome } = await executeKarima(t.ctx, input);
  if (outcome.ok) {
    revalidatePath("/agents/karima");
    revalidatePath("/agents");
    revalidatePath("/approvals");
    revalidatePath("/deliverables");
    revalidatePath("/dashboard");
  }
  return outcome;
}