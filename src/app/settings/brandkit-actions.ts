"use server";

import { revalidatePath } from "next/cache";
import { resolveTenant } from "@/lib/tenant";
import { getBrandkit, enregistrerBrandkit } from "@/lib/brandkit";
import { validerBrandkit, type ErreursBrandkit } from "@/lib/brandkit-regle";

export type BrandkitResult = { ok: true } | { ok: false; error: string; erreurs?: ErreursBrandkit };

const REFUS = "Réservé aux administrateurs de l'organisation.";

async function adminCtx() {
  const t = await resolveTenant();
  return t.ok && t.ctx.isOrgAdmin ? t.ctx : null;
}

// Enregistre le brand kit de l'organisation. Un RIB laissé vide conserve le RIB déjà enregistré
// (le formulaire ne le réaffiche pas en clair).
export async function sauverBrandkit(input: Record<string, string>): Promise<BrandkitResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: REFUS };

  const brut: Record<string, unknown> = { ...(input ?? {}) };
  try {
    const actuel = await getBrandkit(ctx.orgId);
    if (String(brut.rib ?? "").trim() === "" && actuel?.rib) brut.rib = actuel.rib;
  } catch (e) {
    console.error("sauverBrandkit lecture", e);
    return { ok: false, error: "Enregistrement impossible. Réessaie dans un instant." };
  }

  const v = validerBrandkit(brut);
  if (!v.ok) return { ok: false, error: "Corrige les champs signalés.", erreurs: v.erreurs };

  try {
    await enregistrerBrandkit(ctx.orgId, ctx.userId, v.valeurs);
  } catch (e) {
    console.error("sauverBrandkit", e);
    return { ok: false, error: "Enregistrement impossible. Réessaie dans un instant." };
  }
  revalidatePath("/settings");
  return { ok: true };
}