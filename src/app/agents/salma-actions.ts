"use server";

import { resolveTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { proposerLignesSalma, executeSalma, type SalmaProposeInput, type SalmaCoreInput } from "@/lib/salma-core";
import type { SalmaOutcome, SalmaProposeOutcome } from "@/lib/salma";
import { continuerApresSalma } from "@/lib/workflow-engine";
import { listerDossiersChaine, chargerDossierChaine, type DossierChaine, type DossierRepris } from "@/lib/salma-chaine";

// Étape 1 : l'IA propose des lignes du catalogue ; crée l'exécution de Salma.
export async function proposerSalma(input: SalmaProposeInput): Promise<SalmaProposeOutcome> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { outcome } = await proposerLignesSalma(t.ctx, input);
  if (outcome.ok) revalidatePath("/agents/salma");
  return outcome;
}

// Étape 2 : le code chiffre les lignes retenues ; l'IA rédige l'introduction.
// Si l'exécution de Salma appartient à une chaîne Prospect to Cash en attente, la chaîne reprend (Nadia, validation).
export async function chiffrerSalma(input: SalmaCoreInput): Promise<SalmaOutcome> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { outcome } = await executeSalma(t.ctx, input);
  if (outcome.ok) {
    try {
      await continuerApresSalma(t.ctx, Number(input.agentRunId));
    } catch (e) {
      console.error("chiffrerSalma chaîne", e);
    }
    revalidatePath("/agents/salma");
    revalidatePath("/agents");
    revalidatePath("/deliverables");
    revalidatePath("/dashboard");
    revalidatePath("/workflows");
    revalidatePath("/approvals");
  }
  return outcome;
}

// Dossiers de la chaîne qui attendent la validation des lignes.
export async function dossiersChaine(): Promise<DossierChaine[]> {
  const t = await resolveTenant();
  if (!t.ok) return [];
  return listerDossiersChaine(t.ctx.orgId);
}

// Reprise d'un dossier de la chaîne dans le Studio de Salma.
export async function reprendreDossier(executionId: number): Promise<DossierRepris> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  return chargerDossierChaine(t.ctx.orgId, Number(executionId));
}