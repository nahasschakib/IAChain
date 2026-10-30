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