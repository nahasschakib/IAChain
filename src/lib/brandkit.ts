import { sql } from "@/lib/db";
import { CHAMPS_TEXTE, type Brandkit } from "@/lib/brandkit-regle";

// Les règles pures vivent dans brandkit-regle.ts ; ce fichier reste côté serveur (accès base).
export * from "@/lib/brandkit-regle";

// Lit le brand kit de l'organisation. null = jamais renseigné. Lève en cas d'erreur technique :
// l'appelant décide (Karima refuse de facturer, il ne devine pas).
export async function getBrandkit(orgId: string): Promise<Brandkit | null> {
  const rows = await sql`SELECT * FROM org_brandkit WHERE org_id = ${orgId}`;
  const r = rows[0] as Record<string, unknown> | undefined;
  if (!r) return null;
  const kit = { capital_social: null } as Brandkit;
  for (const c of CHAMPS_TEXTE) {
    const v = r[c];
    kit[c] = typeof v === "string" && v.trim() !== "" ? v : null;
  }
  const cap = r.capital_social === null || r.capital_social === undefined ? NaN : Number(r.capital_social);
  kit.capital_social = Number.isFinite(cap) ? cap : null;
  return kit;
}

// Enregistre le brand kit (une ligne par organisation). Les valeurs viennent de validerBrandkit.
// L'appelant (action serveur) doit avoir vérifié que l'utilisateur est administrateur de l'organisation.
export async function enregistrerBrandkit(orgId: string, userId: string, v: Brandkit): Promise<void> {
  await sql`
    INSERT INTO org_brandkit (
      org_id, raison_sociale, nom_commercial, forme_juridique, capital_social, ice, identifiant_fiscal,
      rc, rc_tribunal, taxe_professionnelle, cnss, adresse, ville, code_postal, pays,
      telephone, email_contact, site_web, banque, rib, updated_by, updated_at
    ) VALUES (
      ${orgId}, ${v.raison_sociale}, ${v.nom_commercial}, ${v.forme_juridique}, ${v.capital_social}, ${v.ice},
      ${v.identifiant_fiscal}, ${v.rc}, ${v.rc_tribunal}, ${v.taxe_professionnelle}, ${v.cnss}, ${v.adresse},
      ${v.ville}, ${v.code_postal}, COALESCE(${v.pays}, 'Maroc'), ${v.telephone}, ${v.email_contact},
      ${v.site_web}, ${v.banque}, ${v.rib}, ${userId}, now()
    )
    ON CONFLICT (org_id) DO UPDATE SET
      raison_sociale = EXCLUDED.raison_sociale,
      nom_commercial = EXCLUDED.nom_commercial,
      forme_juridique = EXCLUDED.forme_juridique,
      capital_social = EXCLUDED.capital_social,
      ice = EXCLUDED.ice,
      identifiant_fiscal = EXCLUDED.identifiant_fiscal,
      rc = EXCLUDED.rc,
      rc_tribunal = EXCLUDED.rc_tribunal,
      taxe_professionnelle = EXCLUDED.taxe_professionnelle,
      cnss = EXCLUDED.cnss,
      adresse = EXCLUDED.adresse,
      ville = EXCLUDED.ville,
      code_postal = EXCLUDED.code_postal,
      pays = EXCLUDED.pays,
      telephone = EXCLUDED.telephone,
      email_contact = EXCLUDED.email_contact,
      site_web = EXCLUDED.site_web,
      banque = EXCLUDED.banque,
      rib = EXCLUDED.rib,
      updated_by = EXCLUDED.updated_by,
      updated_at = now()
  `;
}