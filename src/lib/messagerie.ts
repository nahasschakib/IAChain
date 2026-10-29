import { sql } from "@/lib/db";
import type { ValeursImap } from "@/lib/messagerie-regle";

export type ConnexionImap = {
  id: string;
  identifiant: string;
  imapHote: string;
  imapPort: number;
  smtpHote: string;
  smtpPort: number;
  statut: string;
  derniereSync: string | null;
  motDePasseChiffre: string | null;
};

export async function getConnexionImap(orgId: string): Promise<ConnexionImap | null> {
  const r = await sql`
    SELECT id, identifiant, imap_hote, imap_port, smtp_hote, smtp_port, statut,
           derniere_sync_at, mot_de_passe_chiffre
    FROM email_connexions
    WHERE org_id = ${orgId} AND fournisseur = 'imap'
    ORDER BY cree_le LIMIT 1
  `;
  if (!r[0]) return null;
  const x = r[0];
  return {
    id: x.id as string,
    identifiant: x.identifiant as string,
    imapHote: x.imap_hote as string,
    imapPort: Number(x.imap_port),
    smtpHote: x.smtp_hote as string,
    smtpPort: Number(x.smtp_port),
    statut: x.statut as string,
    derniereSync: x.derniere_sync_at ? String(x.derniere_sync_at) : null,
    motDePasseChiffre: (x.mot_de_passe_chiffre as string) ?? null,
  };
}

// Une seule connexion IMAP par organisation. motDePasseChiffre = null : on garde l'existant.
export async function enregistrerImap(
  orgId: string,
  v: ValeursImap,
  motDePasseChiffre: string | null
): Promise<void> {
  const actuel = await getConnexionImap(orgId);
  if (actuel) {
    await sql`
      UPDATE email_connexions SET
        compte_email = ${v.identifiant}, identifiant = ${v.identifiant},
        imap_hote = ${v.imapHote}, imap_port = ${v.imapPort},
        smtp_hote = ${v.smtpHote}, smtp_port = ${v.smtpPort},
        mot_de_passe_chiffre = COALESCE(${motDePasseChiffre}, mot_de_passe_chiffre),
        statut = 'actif'
      WHERE id = ${actuel.id} AND org_id = ${orgId}
    `;
    return;
  }
  await sql`
    INSERT INTO email_connexions
      (org_id, fournisseur, compte_email, identifiant, imap_hote, imap_port,
       smtp_hote, smtp_port, mot_de_passe_chiffre, statut)
    VALUES
      (${orgId}, 'imap', ${v.identifiant}, ${v.identifiant}, ${v.imapHote}, ${v.imapPort},
       ${v.smtpHote}, ${v.smtpPort}, ${motDePasseChiffre}, 'actif')
  `;
}