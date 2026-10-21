import { sql } from "@/lib/db";
import type { Prestation, Unite } from "@/lib/catalogue-regle";

// Prestations d'une organisation, triées par libellé. Par défaut : toutes, y compris les désactivées.
export async function listPrestations(orgId: string, actifsSeulement = false): Promise<Prestation[]> {
  const rows = actifsSeulement
    ? await sql`
        SELECT id, libelle, description, unite, prix_ht, delai_jours, actif
        FROM catalogue_prestations WHERE org_id = ${orgId} AND actif = true
        ORDER BY lower(libelle)`
    : await sql`
        SELECT id, libelle, description, unite, prix_ht, delai_jours, actif
        FROM catalogue_prestations WHERE org_id = ${orgId}
        ORDER BY actif DESC, lower(libelle)`;
  return rows.map((r) => ({
    id: r.id as number,
    libelle: r.libelle as string,
    description: (r.description as string | null) ?? null,
    unite: r.unite as Unite,
    prix_ht: Number(r.prix_ht),
    delai_jours: r.delai_jours === null ? null : Number(r.delai_jours),
    actif: r.actif as boolean,
  }));
}