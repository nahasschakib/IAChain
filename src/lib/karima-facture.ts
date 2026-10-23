// Calcul de la facture de Karima à partir d'un devis validé (proposition chiffrée de Salma).
// Aucun accès base, aucune IA, aucun import : le code décide de tous les montants.
// Nommage de Salma repris ici : total_brut_ht = somme des lignes avant remise,
// total_net_ht = base de TVA après remise. Les montants sont calculés en centimes entiers.

export type LigneDevis = {
  libelle: string;
  description: string | null;
  unite: string;
  quantite: number;
  prix_unitaire_ht: number;
  total_ht: number;
  prestation_id: number | null;
};

export type DevisFacturable = {
  client: string;
  version: string | null;
  lignes: LigneDevis[];
  remise_pct: number;
  tva_pct: number;
  total_brut_ht: number;
  remise_montant: number;
  total_net_ht: number;
  tva_montant: number;
  total_ttc: number;
};

export type CalculFacture = {
  lignes: LigneDevis[];
  total_brut_ht: number;
  remise_pct: number;
  remise_montant: number;
  total_net_ht: number;
  tva_pct: number;
  tva_montant: number;
  total_ttc: number;
  tva_detail: { taux: number; base: number; montant: number }[];
};

export type LectureDevis = { ok: true; devis: DevisFacturable } | { ok: false; error: string };

const MAX_LIGNES = 100;

const nombre = (v: unknown) => (v === null || v === undefined || v === "" ? NaN : Number(v));
const texte = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");
const cts = (n: number) => Math.round(n * 100);
const mad = (c: number) => c / 100;
const fmt = (n: number) => n.toFixed(2).replace(".", ",");
// Pourcentage d'un montant en centimes, arrondi au centime. Le pourcentage est pris à deux décimales.
const pourcentage = (c: number, p: number) => Math.round((c * Math.round(p * 100)) / 10000);

// Lit une proposition chiffrée de Salma. Refuse tout ce qui est illisible plutôt que de deviner.
export function lireDevisFacturable(result: unknown): LectureDevis {
  const r = (result ?? {}) as Record<string, unknown>;
  const echec = (error: string): LectureDevis => ({ ok: false, error });

  if (r.statut !== "Proposition prête") return echec("Ce n'est pas une proposition chiffrée.");
  const client = texte(r.client);
  if (!client) return echec("Client manquant dans la proposition.");
  if (!Array.isArray(r.lignes) || r.lignes.length === 0) return echec("La proposition ne contient aucune ligne.");
  if (r.lignes.length > MAX_LIGNES) return echec(`Plus de ${MAX_LIGNES} lignes : facture impossible.`);

  const lignes: LigneDevis[] = [];
  for (let i = 0; i < r.lignes.length; i++) {
    const l = (r.lignes[i] ?? {}) as Record<string, unknown>;
    const n = i + 1;
    const libelle = texte(l.libelle);
    const quantite = nombre(l.quantite);
    const prix = nombre(l.prix_unitaire_ht);
    const total = nombre(l.total_ht);
    if (!libelle) return echec(`Ligne ${n} : libellé manquant.`);
    if (!Number.isFinite(quantite) || quantite <= 0) return echec(`Ligne ${n} : quantité invalide.`);
    if (!Number.isFinite(prix) || prix < 0) return echec(`Ligne ${n} : prix unitaire invalide.`);
    if (!Number.isFinite(total) || total < 0) return echec(`Ligne ${n} : total invalide.`);
    const pid = nombre(l.prestation_id);
    lignes.push({
      libelle,
      description: texte(l.description) || null,
      unite: texte(l.unite) || "unité",
      quantite,
      prix_unitaire_ht: prix,
      total_ht: total,
      prestation_id: Number.isInteger(pid) ? pid : null,
    });
  }

  const remise = nombre(r.remise_pct);
  const tva = nombre(r.tva_pct);
  if (!Number.isFinite(remise) || remise < 0 || remise > 100) return echec("Remise invalide dans la proposition.");
  if (!Number.isFinite(tva) || tva < 0 || tva > 100) return echec("Taux de TVA invalide dans la proposition.");

  // Une proposition sans remise peut ne pas porter de montant de remise : c'est zéro.
  const remiseMontant =
    r.remise_montant === undefined || r.remise_montant === null ? (remise === 0 ? 0 : NaN) : nombre(r.remise_montant);
  const montants = {
    total_ht: nombre(r.total_ht),
    remise_montant: remiseMontant,
    total_net_ht: nombre(r.total_net_ht),
    tva_montant: nombre(r.tva_montant),
    total_ttc: nombre(r.total_ttc),
  };
  for (const [nom, v] of Object.entries(montants)) {
    if (!Number.isFinite(v) || v < 0) return echec(`Montant illisible dans la proposition (${nom}).`);
  }

  return {
    ok: true,
    devis: {
      client,
      version: typeof r.version === "string" ? r.version : null,
      lignes,
      remise_pct: remise,
      tva_pct: tva,
      total_brut_ht: montants.total_ht,
      remise_montant: montants.remise_montant,
      total_net_ht: montants.total_net_ht,
      tva_montant: montants.tva_montant,
      total_ttc: montants.total_ttc,
    },
  };
}

// Recalcule tous les montants depuis les lignes (quantité x prix unitaire), sans reprendre les totaux du devis.
export function calculerFacture(d: DevisFacturable): CalculFacture {
  const lignes = d.lignes.map((l) => ({
    ...l,
    total_ht: mad(Math.round(l.quantite * cts(l.prix_unitaire_ht))),
  }));
  const brut = lignes.reduce((s, l) => s + cts(l.total_ht), 0);
  const remise = pourcentage(brut, d.remise_pct);
  const net = brut - remise;
  const tva = pourcentage(net, d.tva_pct);
  return {
    lignes,
    total_brut_ht: mad(brut),
    remise_pct: d.remise_pct,
    remise_montant: mad(remise),
    total_net_ht: mad(net),
    tva_pct: d.tva_pct,
    tva_montant: mad(tva),
    total_ttc: mad(net + tva),
    tva_detail: [{ taux: d.tva_pct, base: mad(net), montant: mad(tva) }],
  };
}

// Écarts entre le devis validé et le recalcul. Liste vide = la facture reprend exactement les montants validés.
// Au moindre écart, même d'un centime, l'appelant refuse de facturer.
export function ecartsAvecDevis(d: DevisFacturable, c: CalculFacture): string[] {
  const e: string[] = [];
  const cmp = (nom: string, devis: number, calcul: number) => {
    if (cts(devis) !== cts(calcul)) e.push(`${nom} : devis ${fmt(devis)}, recalcul ${fmt(calcul)}`);
  };
  d.lignes.forEach((l, i) => cmp(`Ligne ${i + 1} (${l.libelle})`, l.total_ht, c.lignes[i].total_ht));
  cmp("Total HT avant remise", d.total_brut_ht, c.total_brut_ht);
  cmp("Remise", d.remise_montant, c.remise_montant);
  cmp("Total net HT", d.total_net_ht, c.total_net_ht);
  cmp("TVA", d.tva_montant, c.tva_montant);
  cmp("Total TTC", d.total_ttc, c.total_ttc);
  return e;
}