// Signature des réponses d'Imane, propre à chaque organisation.
// Nom commercial, sinon raison sociale, sinon « Le support ».
export function signatureOrganisation(kit: {
  nom_commercial?: string | null;
  raison_sociale?: string | null;
} | null): string {
  const nom = String(kit?.nom_commercial ?? "").trim() || String(kit?.raison_sociale ?? "").trim();
  return nom ? `L'équipe ${nom}` : "Le support";
}