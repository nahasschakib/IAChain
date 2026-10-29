export type ValeursImap = {
  identifiant: string;
  imapHote: string;
  imapPort: number;
  smtpHote: string;
  smtpPort: number;
  motDePasse: string | null; // null = conserver le mot de passe enregistré
};

export type ErreursImap = Partial<
  Record<"identifiant" | "motDePasse" | "imapHote" | "imapPort" | "smtpHote" | "smtpPort", string>
>;

const IMAP_PORTS = [993];
const SMTP_PORTS = [465, 587];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Nom de domaine avec point et extension alphabétique : refuse IP et « localhost ».
const HOTE = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export function validerImap(
  brut: Record<string, unknown>,
  motDePasseExiste: boolean
): { ok: true; valeurs: ValeursImap } | { ok: false; erreurs: ErreursImap } {
  const e: ErreursImap = {};
  const txt = (k: string) => String(brut[k] ?? "").trim();

  const identifiant = txt("identifiant").toLowerCase();
  if (!EMAIL.test(identifiant) || identifiant.length > 254) e.identifiant = "Adresse e-mail invalide.";

  const imapHote = txt("imapHote").toLowerCase();
  if (!HOTE.test(imapHote)) e.imapHote = "Nom de serveur invalide (pas d'adresse IP).";
  const smtpHote = txt("smtpHote").toLowerCase();
  if (!HOTE.test(smtpHote)) e.smtpHote = "Nom de serveur invalide (pas d'adresse IP).";

  const imapPort = Number(txt("imapPort"));
  if (!IMAP_PORTS.includes(imapPort)) e.imapPort = "Port IMAP accepté : 993 (SSL/TLS).";
  const smtpPort = Number(txt("smtpPort"));
  if (!SMTP_PORTS.includes(smtpPort)) e.smtpPort = "Port SMTP accepté : 465 ou 587.";

  // Le mot de passe n'est pas rogné : il peut contenir des espaces.
  const mdp = String(brut.motDePasse ?? "");
  if (mdp === "" && !motDePasseExiste) e.motDePasse = "Mot de passe requis.";
  if (mdp.length > 200) e.motDePasse = "Mot de passe trop long.";

  if (Object.keys(e).length > 0) return { ok: false, erreurs: e };
  return {
    ok: true,
    valeurs: { identifiant, imapHote, imapPort, smtpHote, smtpPort, motDePasse: mdp === "" ? null : mdp },
  };
}