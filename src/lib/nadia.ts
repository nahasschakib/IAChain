import { remiseAdmissible, verdictRemise, type PolitiqueTarifaire, type VerdictRemise } from "@/lib/politique-regle";

// Règles de l'agent Nadia (contrôle de remise). Aucune IA : le verdict est décidé par le code,
// avec la même politique tarifaire que Karim. Nadia signale, elle ne modifie jamais une remise.

export type PropositionLue = {
  client: string;
  segment: string; // segment retenu pour la proposition, ou chaîne vide
  remise_pct: number;
  total_ttc: number;
  version: string | null; // version du livrable de Salma
};

export type PropositionResume = PropositionLue & { runId: number; created_at: string };

export type NadiaResult = PropositionLue & {
  verdict: VerdictRemise["verdict"];
  motif: string;
  plafond_pct: number | null; // plafond sans dérogation
  plafond_derogation_pct: number | null; // plafond absolu
  ecart_pts: number | null; // remise proposée moins plafond (négatif = marge restante)
  motif_exception: string;
  segment_saisi: boolean; // segment choisi au contrôle, absent de la proposition
  commentaire: string;
  politique_version: number | null;
  proposition_run_id: number;
  // Validation humaine du devis (P4-10d) : soumise à approbation après un verdict Conforme ou Dérogation requise.
  validation_devis?: "soumise" | "deja_soumise" | "deja_validee" | "non_requise" | "erreur";
  version: string | null; // vN du livrable de Nadia
};

export type NadiaOutcome = { ok: true; result: NadiaResult } | { ok: false; error: string };

export type ListePourNadia = {
  propositions: PropositionResume[];
  politique: { version: number; motifs: string[]; segments: string[] } | null;
};

export const MAX_MOTIF = 80;
export const MAX_COMMENTAIRE = 500;

// Lit le résultat enregistré d'une exécution de Salma ; null si la forme n'est pas celle d'une proposition chiffrée.
export function lireProposition(result: unknown): PropositionLue | null {
  const r = (result ?? {}) as Record<string, unknown>;
  if (r.statut !== "Proposition prête") return null;
  const client = typeof r.client === "string" ? r.client.trim() : "";
  const remise = Number(r.remise_pct);
  const ttc = Number(r.total_ttc);
  if (!client || !Number.isFinite(remise) || remise < 0 || remise > 100 || !Number.isFinite(ttc)) return null;
  return {
    client,
    segment: typeof r.segment === "string" ? r.segment : "",
    remise_pct: remise,
    total_ttc: ttc,
    version: typeof r.version === "string" ? r.version : null,
  };
}

const arrondi = (n: number) => Math.round(n * 100) / 100;

// Verdict sur une proposition : aucune lecture de base, aucune IA.
export function construireVerdict(
  politique: PolitiqueTarifaire | null,
  prop: PropositionLue,
  motifException: string,
  commentaire: string,
  propositionRunId: number,
  segmentSaisi = false
): Omit<NadiaResult, "version"> {
  const v = verdictRemise(politique, prop.segment, prop.remise_pct, motifException);
  const a = remiseAdmissible(politique, prop.segment);
  return {
    ...prop,
    verdict: v.verdict,
    motif: v.motif,
    plafond_pct: a.defini ? a.plafond : null,
    plafond_derogation_pct: a.defini ? a.plafondDerogation : null,
    ecart_pts: a.defini ? arrondi(prop.remise_pct - a.plafond) : null,
    motif_exception: motifException,
    segment_saisi: segmentSaisi,
    commentaire,
    politique_version: politique ? politique.version : null,
    proposition_run_id: propositionRunId,
  };
}
// ─── Second contrôle de Nadia : la facture de Karima (P4-10g) ─────────────────────────────
// Fonction pure, sans IA. Karima refuse de créer la facture si le verdict n'est pas « Conforme »
// et affiche l'action corrective.

export type ControleDevis = {
  verdict: string;
  remise_pct: number;
  segment: string;
  motif_exception: string;
  politique_version: number | null;
};

export type ControleFacture = {
  verdict: "Conforme" | "Non conforme" | "À contrôler manuellement";
  motif: string;
  action_corrective: string | null;
  remise_pct: number;
  segment: string;
  plafond_pct: number | null;
  derogation_couverte: boolean; // remise au-delà du plafond, déjà validée en « Dérogation requise » sur le devis
  politique_version: number | null; // politique appliquée au contrôle de la facture
  politique_devis_version: number | null; // politique du contrôle du devis
  nadia_run_id: number;
};

const VERDICTS = ["Conforme", "Dérogation requise", "Non conforme", "À contrôler manuellement"];
const pctTxt = (n: number) => `${String(n).replace(".", ",")} %`;
const memeRemise = (a: number, b: number) => Math.round(a * 100) === Math.round(b * 100);

// Résultat enregistré d'un contrôle de Nadia sur un devis ; null si illisible.
export function lireControleDevis(result: unknown): ControleDevis | null {
  const r = (result ?? {}) as Record<string, unknown>;
  if (typeof r.verdict !== "string" || !VERDICTS.includes(r.verdict)) return null;
  const remise = Number(r.remise_pct);
  if (!Number.isFinite(remise) || remise < 0 || remise > 100) return null;
  const pv = r.politique_version === null || r.politique_version === undefined ? NaN : Number(r.politique_version);
  return {
    verdict: r.verdict,
    remise_pct: remise,
    segment: typeof r.segment === "string" ? r.segment : "",
    motif_exception: typeof r.motif_exception === "string" ? r.motif_exception : "",
    politique_version: Number.isFinite(pv) ? pv : null,
  };
}

export function controlerFacture(
  politique: PolitiqueTarifaire | null,
  devis: ControleDevis,
  remiseFacturePct: number,
  nadiaRunId: number
): ControleFacture {
  const base = {
    remise_pct: remiseFacturePct,
    segment: devis.segment,
    plafond_pct: null as number | null,
    derogation_couverte: false,
    politique_version: politique ? politique.version : null,
    politique_devis_version: devis.politique_version,
    nadia_run_id: nadiaRunId,
  };
  const refus = (motif: string, action: string): ControleFacture => ({
    ...base,
    verdict: "Non conforme",
    motif,
    action_corrective: action,
  });
  const REVOIR =
    "Faire rechiffrer la remise par Salma dans le plafond de la politique actuelle, la faire contrôler par Nadia, puis valider le nouveau devis (ou, si une dérogation se justifie, relancer le contrôle de Nadia avec un motif d'exception de la politique).";

  // 1. Le devis doit avoir été contrôlé conforme, ou en dérogation validée par un humain.
  if (devis.verdict !== "Conforme" && devis.verdict !== "Dérogation requise")
    return refus(
      `Le contrôle de remise du devis est « ${devis.verdict} »`,
      "Relancer le contrôle de remise de Nadia sur la proposition, puis faire valider le devis."
    );

  // 2. La remise facturée doit être celle qui a été contrôlée.
  if (!memeRemise(devis.remise_pct, remiseFacturePct))
    return refus(
      `La remise de la facture (${pctTxt(remiseFacturePct)}) diffère de celle contrôlée sur le devis (${pctTxt(devis.remise_pct)})`,
      "Faire rechiffrer la proposition par Salma, la faire contrôler par Nadia, puis valider le nouveau devis."
    );

  // 3. Politique de remise applicable aujourd'hui.
  const a = remiseAdmissible(politique, devis.segment);
  if (!a.defini)
    return {
      ...base,
      verdict: "À contrôler manuellement",
      motif: a.raison,
      action_corrective: politique
        ? "Rattacher ce segment à une grille dans Paramètres (politique tarifaire), puis refaire la facture."
        : "Définir la politique tarifaire dans Paramètres, puis refaire la facture.",
    };
  const avecPlafond = { ...base, plafond_pct: a.plafond };

  // 4. Remise rejugée avec la politique active, avec le motif d'exception retenu sur le devis.
  const v = verdictRemise(politique, devis.segment, remiseFacturePct, devis.motif_exception);
  if (v.verdict === "Conforme")
    return { ...avecPlafond, verdict: "Conforme", motif: v.motif, action_corrective: null };
  if (v.verdict === "Dérogation requise") {
    if (devis.verdict === "Dérogation requise")
      return { ...avecPlafond, verdict: "Conforme", motif: v.motif, action_corrective: null, derogation_couverte: true };
    return {
      ...avecPlafond,
      verdict: "Non conforme",
      motif: `${v.motif} ; or le devis a été validé sans dérogation`,
      action_corrective:
        "La politique a changé depuis le devis : relancer le contrôle de Nadia avec un motif d'exception, ou faire rechiffrer la remise par Salma, puis valider le nouveau devis.",
    };
  }
  return { ...refus(v.motif, REVOIR), plafond_pct: a.plafond };
}