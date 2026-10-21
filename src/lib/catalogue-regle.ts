// Règles du catalogue de prestations : fonctions pures, sans accès à la base (importables côté client).

export const UNITES = ["forfait", "jour", "mois", "unité"] as const;
export type Unite = (typeof UNITES)[number];

export type Prestation = {
  id: number;
  libelle: string;
  description: string | null;
  unite: Unite;
  prix_ht: number; // MAD, hors taxe
  delai_jours: number | null;
  actif: boolean;
};

export type PrestationInput = {
  id?: number;
  libelle: string;
  description?: string;
  unite: string;
  prix_ht: number;
  delai_jours?: number | null;
};

export type PrestationValide = {
  libelle: string;
  description: string | null;
  unite: Unite;
  prix_ht: number;
  delai_jours: number | null;
};

export const LIMITES = {
  libelle: 120,
  description: 400,
  prixMax: 99999999.99,
  delaiMax: 730,
  maxPrestations: 200,
} as const;

const espaces = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();

// Contrôle et normalise une prestation avant enregistrement.
export function controlerPrestation(
  input: PrestationInput,
): { ok: true; valeur: PrestationValide } | { ok: false; error: string } {
  const libelle = espaces(input?.libelle);
  if (!libelle) return { ok: false, error: "Le libellé est obligatoire." };
  if (libelle.length > LIMITES.libelle)
    return { ok: false, error: `Libellé trop long (${LIMITES.libelle} caractères maximum).` };

  const description = espaces(input?.description);
  if (description.length > LIMITES.description)
    return { ok: false, error: `Description trop longue (${LIMITES.description} caractères maximum).` };

  if (!(UNITES as readonly string[]).includes(input?.unite)) return { ok: false, error: "Unité inconnue." };

  const prix = Number(input?.prix_ht);
  if (!Number.isFinite(prix) || prix < 0 || prix > LIMITES.prixMax)
    return { ok: false, error: "Le prix HT doit être un nombre positif ou nul." };

  let delai: number | null = null;
  if (input?.delai_jours !== null && input?.delai_jours !== undefined) {
    const d = Number(input.delai_jours);
    if (!Number.isInteger(d) || d < 1 || d > LIMITES.delaiMax)
      return { ok: false, error: `Le délai doit être un nombre entier de jours entre 1 et ${LIMITES.delaiMax}.` };
    delai = d;
  }

  return {
    ok: true,
    valeur: {
      libelle,
      description: description || null,
      unite: input.unite as Unite,
      prix_ht: Math.round(prix * 100) / 100,
      delai_jours: delai,
    },
  };
}

// Affichage d'un montant en MAD : 12 000,00
export const formatMAD = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });