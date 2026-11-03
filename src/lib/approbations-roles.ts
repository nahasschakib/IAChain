// Types d'approbation dont la décision est réservée aux administrateurs de l'organisation (P7-14, P7-22).
export const TAGS_ADMIN = ["Validation du devis", "Validation de la facture"];

export function decisionReservee(tag: string, isOrgAdmin: boolean): boolean {
  return !isOrgAdmin && TAGS_ADMIN.includes(tag);
}