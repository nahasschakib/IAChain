import { sql } from "@/lib/db";

// Brand kit de l'organisation : identité légale saisie une fois, réutilisée par les processus.
// Aucun de ces champs n'est jamais transmis à un modèle IA : le code les insère dans les documents.

export const CHAMPS_TEXTE = [
  "raison_sociale",
  "nom_commercial",
  "forme_juridique",
  "ice",
  "identifiant_fiscal",
  "rc",
  "rc_tribunal",
  "taxe_professionnelle",
  "cnss",
  "adresse",
  "ville",
  "code_postal",
  "pays",
  "telephone",
  "email_contact",
  "site_web",
  "banque",
  "rib",
] as const;

export type ChampTexte = (typeof CHAMPS_TEXTE)[number];
export type ChampBrandkit = ChampTexte | "capital_social";
export type Brandkit = Record<ChampTexte, string | null> & { capital_social: number | null };

export const LIBELLES: Record<ChampBrandkit, string> = {
  raison_sociale: "Raison sociale",
  nom_commercial: "Nom commercial",
  forme_juridique: "Forme juridique",
  capital_social: "Capital social",
  ice: "ICE",
  identifiant_fiscal: "Identifiant fiscal (IF)",
  rc: "Registre du commerce (RC)",
  rc_tribunal: "Tribunal du RC",
  taxe_professionnelle: "Taxe professionnelle",
  cnss: "CNSS",
  adresse: "Adresse",
  ville: "Ville",
  code_postal: "Code postal",
  pays: "Pays",
  telephone: "Téléphone",
  email_contact: "E-mail de contact",
  site_web: "Site web",
  banque: "Banque",
  rib: "RIB",
};

// Champs exigés par usage. Un seul endroit à modifier quand un processus a besoin d'autres informations.
export type UsageBrandkit = "facture";
const REQUIS: Record<UsageBrandkit, ChampBrandkit[]> = {
  facture: ["raison_sociale", "ice", "identifiant_fiscal", "rc", "adresse", "ville", "rib"],
};

const LONGUEUR_MAX: Partial<Record<ChampBrandkit, number>> = { adresse: 300, site_web: 200 };
const LONGUEUR_DEFAUT = 120;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ErreursBrandkit = Partial<Record<ChampBrandkit, string>>;

// Normalise et valide une saisie. Une valeur vide devient null. ICE et RIB : espaces retirés, chiffres seulement.
export function validerBrandkit(
  entree: Record<string, unknown>
): { ok: true; valeurs: Brandkit } | { ok: false; erreurs: ErreursBrandkit } {
  const erreurs: ErreursBrandkit = {};
  const valeurs = { capital_social: null } as Brandkit;

  for (const c of CHAMPS_TEXTE) {
    let s = String(entree[c] ?? "").replace(/\s+/g, " ").trim();
    if (c === "ice" || c === "rib") s = s.replace(/\s/g, "");
    if (s === "") {
      valeurs[c] = null;
      continue;
    }
    const max = LONGUEUR_MAX[c] ?? LONGUEUR_DEFAUT;
    if (s.length > max) erreurs[c] = `${max} caractères maximum.`;
    else if (c === "ice" && !/^[0-9]{15}$/.test(s)) erreurs[c] = "L'ICE comporte 15 chiffres.";
    else if (c === "rib" && !/^[0-9]{24}$/.test(s)) erreurs[c] = "Le RIB comporte 24 chiffres.";
    else if (c === "email_contact" && !EMAIL.test(s)) erreurs[c] = "Adresse e-mail invalide.";
    valeurs[c] = s;
  }

  const brut = String(entree.capital_social ?? "").replace(/\s/g, "").replace(",", ".");
  if (brut !== "") {
    const n = Number(brut);
    if (!Number.isFinite(n) || n < 0 || n > 1e12) erreurs.capital_social = "Montant invalide.";
    else valeurs.capital_social = n;
  }

  return Object.keys(erreurs).length > 0 ? { ok: false, erreurs } : { ok: true, valeurs };
}

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

// Champs encore à renseigner pour un usage. Liste vide = prêt.
export function brandkitManque(kit: Brandkit | null, usage: UsageBrandkit): ChampBrandkit[] {
  return REQUIS[usage].filter((c) => {
    const v = kit ? kit[c] : null;
    return v === null || v === undefined || v === "";
  });
}

export function libellesManquants(champs: ChampBrandkit[]): string {
  return champs.map((c) => LIBELLES[c]).join(", ");
}

// Affichage : seuls les 4 derniers chiffres du RIB sont visibles par défaut.
export function masquerRib(rib: string | null): string {
  if (!rib) return "";
  return `•••• •••• •••• •••• ${rib.slice(-4)}`;
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