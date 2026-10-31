// Règle de quota d'envoi : fonctions pures, sans accès à la base.
// Nindohost (offre Nindomail Professional) limite la boîte à 250 e-mails par jour,
// quota partagé par tous les produits qui envoient par cette boîte.

export const QUOTA_JOURNALIER_FOURNISSEUR = 250;
export const QUOTA_JOURNALIER_DEFAUT = 100; // budget d'IAChain, le reste est laissé aux autres produits

export type VerdictQuota =
  | { autorise: true; restant: number }
  | { autorise: false; restant: 0; raison: string };

const refus = (raison: string): VerdictQuota => ({ autorise: false, restant: 0, raison });

// En cas de doute sur un nombre, l'envoi est refusé : mieux vaut retarder un message que dépasser le quota.
export function verifierQuotaEnvoi(
  envoyesAujourdhui: number,
  plafond: number = QUOTA_JOURNALIER_DEFAUT,
  limiteFournisseur: number = QUOTA_JOURNALIER_FOURNISSEUR,
): VerdictQuota {
  if (!Number.isInteger(limiteFournisseur) || limiteFournisseur < 1)
    return refus("Limite du fournisseur invalide : envoi suspendu par précaution");
  if (!Number.isInteger(plafond) || plafond < 1 || plafond > limiteFournisseur)
    return refus(`Plafond d'envoi invalide : un entier de 1 à ${limiteFournisseur} est attendu`);
  if (!Number.isInteger(envoyesAujourdhui) || envoyesAujourdhui < 0)
    return refus("Nombre d'envois du jour illisible : envoi suspendu par précaution");
  if (envoyesAujourdhui >= plafond)
    return refus(`Plafond de ${plafond} envois par jour atteint : le message reste en attente jusqu'à demain`);
  return { autorise: true, restant: plafond - envoyesAujourdhui };
}

// Clé de la journée d'envoi (AAAA-MM-JJ, en UTC). L'heure exacte de remise à zéro du quota chez
// Nindohost n'est pas connue : l'UTC est une convention unique et prudente pour compter.
export function cleJourUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Adresse simple : un seul destinataire, sans espace ni caractère de contrôle.
const ADRESSE = /^[A-Za-z0-9._%+'-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
const AUTOMATIQUES = /^(no-?reply|do-?not-?reply|mailer-daemon|postmaster|bounces?|notifications?)([+._-]|@)/i;

// Extrait l'adresse d'un expéditeur « Nom <adresse> ». Renvoie null si elle est illisible,
// multiple ou contient un caractère de contrôle (retour à la ligne : risque d'injection d'en-têtes).
export function extraireAdresse(expediteur: string | null | undefined): string | null {
  if (!expediteur || /[\r\n\0]/.test(expediteur)) return null;
  const paires = expediteur.match(/<[^<>]*>/g) ?? [];
  if (paires.length > 1) return null;
  let brut = expediteur.trim();
  if (paires.length === 1) {
    const avant = expediteur.slice(0, expediteur.indexOf("<")).replace(/"[^"]*"/g, "");
    if (avant.includes("@")) return null;
    const m = expediteur.match(/<([^<>]+)>\s*$/);
    if (!m) return null;
    brut = m[1].trim();
  }
  if (brut.length > 254 || !ADRESSE.test(brut)) return null;
  return brut.toLowerCase();
}

// Objet d'une réponse : « Re: » ajouté une seule fois, sans retour à la ligne.
export function objetReponse(objet: string | null | undefined): string {
  const o = (objet ?? "").replace(/[\r\n\0]+/g, " ").trim().slice(0, 200);
  if (!o) return "Re: votre message";
  return /^re\s*:/i.test(o) ? o : `Re: ${o}`;
}

export type Destinataire = { ok: true; adresse: string } | { ok: false; raison: string };

// Destinataire d'une réponse : refuse l'illisible, la boîte d'envoi elle-même et les adresses automatiques.
export function choisirDestinataire(
  expediteur: string | null | undefined,
  adresseConnexion: string | null | undefined,
): Destinataire {
  const adresse = extraireAdresse(expediteur);
  if (!adresse) return { ok: false, raison: "Adresse du destinataire illisible ou multiple" };
  if (adresse === (adresseConnexion ?? "").trim().toLowerCase())
    return { ok: false, raison: "Le destinataire est la boîte d'envoi elle-même" };
  if (AUTOMATIQUES.test(adresse)) return { ok: false, raison: "Adresse automatique (ne pas répondre)" };
  return { ok: true, adresse };
}