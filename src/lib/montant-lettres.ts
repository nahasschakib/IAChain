// Montant en lettres (français), fonctions pures. Calculé à partir du total TTC : il ne peut pas diverger du chiffre.
const UNITES = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
  "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf",
];
const DIZAINES = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"];

// n de 1 à 99. « quatre-vingts » prend un s quand rien ne le suit (final).
function moinsDeCent(n: number, final: boolean): string {
  if (n < 20) return UNITES[n];
  const d = Math.floor(n / 10);
  const u = n % 10;
  if (d <= 6) {
    if (u === 0) return DIZAINES[d];
    if (u === 1) return `${DIZAINES[d]} et un`;
    return `${DIZAINES[d]}-${UNITES[u]}`;
  }
  if (d === 7) return u === 1 ? "soixante et onze" : `soixante-${UNITES[10 + u]}`;
  if (d === 8) return u === 0 ? (final ? "quatre-vingts" : "quatre-vingt") : `quatre-vingt-${UNITES[u]}`;
  return `quatre-vingt-${UNITES[10 + u]}`;
}

// n de 1 à 999. « cent » prend un s quand il est multiplié et que rien ne le suit (final).
function moinsDeMille(n: number, final: boolean): string {
  const c = Math.floor(n / 100);
  const r = n % 100;
  let s = "";
  if (c > 0) {
    s = c === 1 ? "cent" : `${UNITES[c]} cent`;
    if (c > 1 && r === 0 && final) s += "s";
  }
  if (r > 0) s += (s ? " " : "") + moinsDeCent(r, final);
  return s;
}

export function nombreEnLettres(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n >= 1e12) throw new Error("Nombre hors limites");
  if (n === 0) return "zéro";
  const milliards = Math.floor(n / 1e9);
  const millions = Math.floor((n % 1e9) / 1e6);
  const milliers = Math.floor((n % 1e6) / 1e3);
  const reste = n % 1e3;
  const parts: string[] = [];
  if (milliards) parts.push(`${moinsDeMille(milliards, true)} milliard${milliards > 1 ? "s" : ""}`);
  if (millions) parts.push(`${moinsDeMille(millions, true)} million${millions > 1 ? "s" : ""}`);
  if (milliers) parts.push(milliers === 1 ? "mille" : `${moinsDeMille(milliers, false)} mille`);
  if (reste) parts.push(moinsDeMille(reste, true));
  return parts.join(" ");
}

// Montant en dirhams : « trente-trois mille soixante dirhams », avec les centimes si présents.
export function montantEnLettres(montant: number): string {
  if (!Number.isFinite(montant) || montant < 0) throw new Error("Montant invalide");
  const cts = Math.round(montant * 100);
  const dh = Math.floor(cts / 100);
  const c = cts % 100;
  const de = dh >= 1e6 && dh % 1e6 === 0 ? " de" : "";
  let s = `${nombreEnLettres(dh)}${de} dirham${dh > 1 ? "s" : ""}`;
  if (c > 0) s += ` et ${nombreEnLettres(c)} centime${c > 1 ? "s" : ""}`;
  return s;
}