import { searchBrave, type BraveResult } from "@/lib/brave";
import { normalizeName } from "@/lib/ilyas";

export type SocialLinks = { linkedin_url: string; facebook_url: string; instagram_url: string };
const EMPTY: SocialLinks = { linkedin_url: "", facebook_url: "", instagram_url: "" };

// Garde-fou : le résultat doit contenir un mot significatif du nom de l'entreprise (évite les homonymes).
function sameCompany(nom: string, r: BraveResult): boolean {
  const tokens = normalizeName(nom).split(" ").filter((t) => t.length >= 3);
  if (tokens.length === 0) return false;
  const hay = normalizeName(`${r.title} ${r.url}`);
  return tokens.some((t) => hay.includes(t));
}

function pick(results: BraveResult[], re: RegExp, nom: string): string {
  return results.find((r) => re.test(r.url) && sameCompany(nom, r))?.url ?? "";
}

// Recherche des pages publiques de l'entreprise via le moteur de recherche (aucun accès aux réseaux eux-mêmes).
export async function findSocialLinks(nom: string, ville: string): Promise<SocialLinks> {
  try {
    const where = ville ? ` ${ville}` : "";
    const results = await searchBrave(
      `"${nom}"${where} (site:linkedin.com/company OR site:facebook.com OR site:instagram.com)`,
      10
    );
    let linkedin = pick(results, /linkedin\.com\/company\//i, nom);
    if (!linkedin) {
      const retry = await searchBrave(`"${nom}"${where} site:linkedin.com/company`, 5);
      linkedin = pick(retry, /linkedin\.com\/company\//i, nom);
    }
    return {
      linkedin_url: linkedin,
      facebook_url: pick(results, /facebook\.com\/(?!sharer|share|login)/i, nom),
      instagram_url: pick(results, /instagram\.com\/(?!p\/|explore)/i, nom),
    };
  } catch (e) {
    console.error("findSocialLinks", e);
    return EMPTY;
  }
}