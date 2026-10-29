"use server";

import { revalidatePath } from "next/cache";
import { resolveTenant } from "@/lib/tenant";
import { chiffrer, dechiffrer } from "@/lib/email-crypto";
import { getConnexionImap, enregistrerImap } from "@/lib/messagerie";
import { validerImap, type ErreursImap } from "@/lib/messagerie-regle";
import { testerImap } from "@/lib/imap-test";

export type MessagerieResult = { ok: true } | { ok: false; error: string; erreurs?: ErreursImap };

const REFUS = "Réservé aux administrateurs de l'organisation.";
const ECHEC = "Enregistrement impossible. Réessaie dans un instant.";

export async function sauverImap(input: Record<string, string>): Promise<MessagerieResult> {
  const t = await resolveTenant();
  if (!t.ok || !t.ctx.isOrgAdmin) return { ok: false, error: REFUS };
  const ctx = t.ctx;

  try {
    const actuel = await getConnexionImap(ctx.orgId);
    const v = validerImap({ ...(input ?? {}) }, !!actuel?.motDePasseChiffre);
    if (!v.ok) return { ok: false, error: "Corrige les champs signalés.", erreurs: v.erreurs };

    const motDePasse = v.valeurs.motDePasse ?? dechiffrer(actuel!.motDePasseChiffre!);
    const test = await testerImap(v.valeurs.imapHote, v.valeurs.imapPort, v.valeurs.identifiant, motDePasse);
    if (!test.ok) return { ok: false, error: test.error };

    const chiffre = v.valeurs.motDePasse ? chiffrer(v.valeurs.motDePasse) : null;
    await enregistrerImap(ctx.orgId, v.valeurs, chiffre);
  } catch (e) {
    console.error("sauverImap", (e as { code?: string }).code ?? "erreur");
    return { ok: false, error: ECHEC };
  }
  revalidatePath("/settings");
  return { ok: true };
}