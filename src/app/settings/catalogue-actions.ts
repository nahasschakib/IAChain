"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { resolveTenant } from "@/lib/tenant";
import { controlerPrestation, LIMITES, type PrestationInput } from "@/lib/catalogue-regle";

export type CatalogueResult = { ok: true } | { ok: false; error: string };

const REFUS = "Réservé aux administrateurs de l'organisation.";

async function adminCtx() {
  const t = await resolveTenant();
  return t.ok && t.ctx.isOrgAdmin ? t.ctx : null;
}

const estDoublon = (e: unknown) => {
  const m = e as { code?: string; message?: string };
  return m?.code === "23505" || String(m?.message ?? "").includes("catalogue_prestations_libelle_unique");
};

// Crée (sans id) ou modifie (avec id) une prestation de l'organisation.
export async function savePrestation(input: PrestationInput): Promise<CatalogueResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: REFUS };

  const c = controlerPrestation(input);
  if (!c.ok) return c;
  const v = c.valeur;

  try {
    if (input.id === undefined || input.id === null) {
      const n = await sql`SELECT count(*)::int AS n FROM catalogue_prestations WHERE org_id = ${ctx.orgId}`;
      if ((n[0].n as number) >= LIMITES.maxPrestations)
        return { ok: false, error: `${LIMITES.maxPrestations} prestations maximum : désactive-en avant d'en ajouter.` };
      await sql`
        INSERT INTO catalogue_prestations (org_id, libelle, description, unite, prix_ht, delai_jours, created_by)
        VALUES (${ctx.orgId}, ${v.libelle}, ${v.description}, ${v.unite}, ${v.prix_ht}, ${v.delai_jours}, ${ctx.userId})`;
    } else {
      const r = await sql`
        UPDATE catalogue_prestations
        SET libelle = ${v.libelle}, description = ${v.description}, unite = ${v.unite},
            prix_ht = ${v.prix_ht}, delai_jours = ${v.delai_jours}, updated_at = now()
        WHERE id = ${Number(input.id)} AND org_id = ${ctx.orgId}
        RETURNING id`;
      if (r.length === 0) return { ok: false, error: "Prestation introuvable." };
    }
  } catch (e) {
    if (estDoublon(e)) return { ok: false, error: "Une prestation porte déjà ce libellé." };
    console.error("savePrestation", e);
    return { ok: false, error: "Enregistrement impossible. Réessaie dans un instant." };
  }

  revalidatePath("/settings");
  return { ok: true };
}

// Désactive ou réactive une prestation. Une prestation désactivée n'est plus proposée dans les devis,
// mais les devis déjà produits gardent leurs lignes.
export async function setPrestationActive(id: number, actif: boolean): Promise<CatalogueResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: REFUS };
  try {
    const r = await sql`
      UPDATE catalogue_prestations SET actif = ${Boolean(actif)}, updated_at = now()
      WHERE id = ${Number(id)} AND org_id = ${ctx.orgId}
      RETURNING id`;
    if (r.length === 0) return { ok: false, error: "Prestation introuvable." };
  } catch (e) {
    console.error("setPrestationActive", e);
    return { ok: false, error: "Modification impossible. Réessaie dans un instant." };
  }
  revalidatePath("/settings");
  return { ok: true };
}