// Règle de remise : fonctions pures, sans accès à la base.
// Partagées par Karim (remise admissible) et par Nadia (verdict) : une seule règle pour les deux.

export type GrilleSegment = "standard" | "grands_comptes";

export type PolitiqueTarifaire = {
  id: number;
  version: number;
  // Plafonds en %. derogation = remise maximale absolue (motif d'exception + approbation de la direction).
  plafonds: { standard: number; grands_comptes: number; derogation: number };
  segments: Record<string, GrilleSegment>; // segment de l'organisation -> grille
  motifs: string[]; // motifs d'exception autorisés
};

export type RemiseAdmissible =
  | { defini: true; grille: GrilleSegment; plafond: number; plafondDerogation: number }
  | { defini: false; raison: string };

export type VerdictRemise = {
  verdict: "Conforme" | "Dérogation requise" | "Non conforme" | "À contrôler manuellement";
  motif: string;
};

const pct = (n: number) => `${String(n).replace(".", ",")} %`;

// Remise admissible pour un segment (lue par Karim : discount.cap).
export function remiseAdmissible(p: PolitiqueTarifaire | null, segment: string): RemiseAdmissible {
  if (!p) return { defini: false, raison: "Politique tarifaire non définie pour l'organisation" };
  const grille = p.segments[segment];
  if (!grille)
    return {
      defini: false,
      raison: `Segment « ${segment || "indéterminé"} » non rattaché à une grille tarifaire`,
    };
  const plafond = p.plafonds[grille];
  return { defini: true, grille, plafond, plafondDerogation: Math.max(plafond, p.plafonds.derogation) };
}

// Verdict sur une remise proposée (lu par Nadia).
export function verdictRemise(
  p: PolitiqueTarifaire | null,
  segment: string,
  remisePct: number,
  motifException?: string,
): VerdictRemise {
  const a = remiseAdmissible(p, segment);
  if (!a.defini) return { verdict: "À contrôler manuellement", motif: a.raison };
  if (!Number.isFinite(remisePct) || remisePct < 0 || remisePct > 100)
    return { verdict: "Non conforme", motif: "Remise proposée invalide" };
  if (remisePct <= a.plafond)
    return { verdict: "Conforme", motif: `${pct(remisePct)} dans le plafond de ${pct(a.plafond)}` };
  if (remisePct > a.plafondDerogation)
    return {
      verdict: "Non conforme",
      motif: `${pct(remisePct)} au-delà du plafond absolu de ${pct(a.plafondDerogation)}`,
    };
  const motif = (motifException ?? "").trim();
  if (!motif)
    return {
      verdict: "Non conforme",
      motif: `${pct(remisePct)} au-delà du plafond de ${pct(a.plafond)} : un motif d'exception est requis`,
    };
  if (!p!.motifs.includes(motif))
    return { verdict: "Non conforme", motif: `Motif d'exception « ${motif} » absent de la politique` };
  return {
    verdict: "Dérogation requise",
    motif: `${pct(remisePct)} au-delà du plafond de ${pct(a.plafond)} (motif : ${motif}) : approbation de la direction requise`,
  };
}

// Contrôle d'une politique avant enregistrement (utilisé par l'écran de saisie).
export function erreursPolitique(p: Omit<PolitiqueTarifaire, "id" | "version">): string[] {
  const e: string[] = [];
  for (const [code, v] of Object.entries(p.plafonds))
    if (!Number.isFinite(v) || v < 0 || v > 100) e.push(`Plafond « ${code} » : valeur entre 0 et 100 attendue`);
  if (p.plafonds.derogation < Math.max(p.plafonds.standard, p.plafonds.grands_comptes))
    e.push("Le plafond de dérogation doit être au moins égal aux deux autres plafonds");
  if (Object.keys(p.segments).length === 0) e.push("Aucun segment rattaché à une grille");
  if (p.motifs.some((m) => m.trim() === "")) e.push("Motif d'exception vide");
  if (new Set(p.motifs.map((m) => m.trim())).size !== p.motifs.length) e.push("Motif d'exception en double");
  return e;
}