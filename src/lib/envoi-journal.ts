import { sql } from "@/lib/db";
import { cleJourUtc, verifierQuotaEnvoi, type VerdictQuota } from "@/lib/envoi-regle";

// Nombre d'envois réussis du jour (UTC) pour une connexion. Les échecs ne comptent pas.
export async function compterEnvoisDuJour(
  orgId: string,
  connexionId: string,
  jour: Date = new Date(),
): Promise<number> {
  const r = await sql`
    SELECT COUNT(*)::int AS n
    FROM envois_email
    WHERE org_id = ${orgId}
      AND connexion_id = ${connexionId}
      AND jour = ${cleJourUtc(jour)}::date
      AND statut = 'envoye'
  `;
  return Number(r[0]?.n ?? 0);
}

// Plafond quotidien propre à la connexion, null si la connexion n'existe pas pour cette organisation.
export async function lirePlafondJour(orgId: string, connexionId: string): Promise<number | null> {
  const r = await sql`
    SELECT plafond_jour FROM email_connexions
    WHERE id = ${connexionId} AND org_id = ${orgId}
  `;
  return r[0] ? Number(r[0].plafond_jour) : null;
}

// Verdict du quota pour une connexion : lit le plafond et le nombre d'envois du jour.
// limiteFournisseur absent = valeur par défaut de la règle (250, Nindohost).
export async function quotaDuJour(
  orgId: string,
  connexionId: string,
  limiteFournisseur?: number,
): Promise<VerdictQuota> {
  const plafond = await lirePlafondJour(orgId, connexionId);
  if (plafond === null)
    return { autorise: false, restant: 0, raison: "Connexion e-mail introuvable pour cette organisation" };
  const envoyes = await compterEnvoisDuJour(orgId, connexionId);
  return verifierQuotaEnvoi(envoyes, plafond, limiteFournisseur);
}

export type EnvoiJournal = {
  orgId: string;
  connexionId: string;
  emailId: string | null;
  destinataire: string;
  objet: string | null;
  statut: "envoye" | "echec";
  erreur?: string | null; // un code ou un court message, jamais un secret ni le corps du message
};

export async function journaliserEnvoi(e: EnvoiJournal): Promise<void> {
  await sql`
    INSERT INTO envois_email (org_id, connexion_id, email_id, destinataire, objet, statut, erreur)
    VALUES (${e.orgId}, ${e.connexionId}, ${e.emailId}, ${e.destinataire},
            ${e.objet}, ${e.statut}, ${e.erreur ? e.erreur.slice(0, 300) : null})
  `;
}