import type { BraveResult } from "./brave";

// Catégorie déterminée par le code (domaine), jamais par l'IA.
// Adapte les 3 libellés à ceux de SOURCES dans sofia.ts si besoin.
export type SofiaCategorie = "Presse" | "Réseaux sociaux" | "Rapports sectoriels";

const SOCIAL = /(^|\.)(linkedin|facebook|instagram|x|twitter|youtube|tiktok)\.com$/;
const PRESSE =
  /(^|\.)(leseco|lematin|medias24|lavieeco|hespress|le360|telquel|challenge|lopinion|bladi|map-express|mapexpress|maroc-diplomatique|h24info|enass|lesiteinfo|reuters|jeuneafrique|lemonde|lesechos|bfmtv|zdnet|journaldunet|usinenouvelle)\.[a-z.]+$/;

export function categoryFromUrl(url: string): SofiaCategorie {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (SOCIAL.test(host)) return "Réseaux sociaux";
    if (PRESSE.test(host)) return "Presse";
  } catch {}
  return "Rapports sectoriels";
}

const MAROC = /maroc|marocain|morocco|moroccan|casablanca|rabat|tanger|marrakech|agadir|fès|fes\b|kénitra|kenitra|\bMAD\b|\.ma\b/i;

// Zone Maroc : on ne garde que les résultats .ma ou qui parlent du Maroc.
export function keepMoroccoRelevant(results: BraveResult[]): BraveResult[] {
  const kept = results.filter((r) => {
    try {
      if (new URL(r.url).hostname.endsWith(".ma")) return true;
    } catch {}
     const desc = (r as BraveResult & { description?: string }).description ?? "";
     const txt = `${r.title ?? ""} ${desc} ${r.url}`;
    return MAROC.test(txt);
  });
  // garde-fou : si le filtre vide tout, on ne filtre pas
  return kept.length >= 3 ? kept : results;
}