"use server";

import { resolveTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { proposerLignesSalma, executeSalma, type SalmaProposeInput, type SalmaCoreInput } from "@/lib/salma-core";
import type { SalmaOutcome, SalmaProposeOutcome } from "@/lib/salma";

// Étape 1 : l'IA propose des lignes du catalogue ; crée l'exécution de Salma.
export async function proposerSalma(input: SalmaProposeInput): Promise<SalmaProposeOutcome> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { outcome } = await proposerLignesSalma(t.ctx, input);
  if (outcome.ok) revalidatePath("/agents/salma");
  return outcome;
}

// Étape 2 : le code chiffre les lignes retenues ; l'IA rédige l'introduction.
export async function chiffrerSalma(input: SalmaCoreInput): Promise<SalmaOutcome> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { outcome } = await executeSalma(t.ctx, input);
  if (outcome.ok) {
    revalidatePath("/agents/salma");
    revalidatePath("/agents");
    revalidatePath("/deliverables");
    revalidatePath("/dashboard");
  }
  return outcome;
}