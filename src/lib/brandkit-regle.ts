// Règles du brand kit : sans accès base, utilisables côté client et côté serveur.

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

// Affichage : seuls les 4 derniers chiffres du RIB sont visibles.
export function masquerRib(rib: string | null): string {
  if (!rib) return "";
  return `•••• •••• •••• •••• ${rib.slice(-4)}`;
}