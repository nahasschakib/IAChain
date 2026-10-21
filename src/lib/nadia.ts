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