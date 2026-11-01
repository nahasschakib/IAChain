import { sql } from "@/lib/db";
import { dechiffrer } from "@/lib/email-crypto";
import { lireMessagesImap } from "@/lib/imap-lecture";

export type ResultatSyncImap =
  | { ok: true; lus: number; nouveaux: number }
  | { ok: false; status: number; error: string };

// Lit les boîtes IMAP actives d'une organisation et enregistre les nouveaux e-mails (sans doublon).
export async function synchroniserImap(orgId: string): Promise<ResultatSyncImap> {
  const connexions = await sql`
    SELECT id, identifiant, imap_hote, imap_port, mot_de_passe_chiffre
    FROM email_connexions
    WHERE org_id = ${orgId} AND fournisseur = 'imap' AND statut = 'actif'
  `;
  if (connexions.length === 0)
    return { ok: false, status: 404, error: "Aucune boîte IMAP active pour cette organisation" };

  let lus = 0;
  let nouveaux = 0;
  for (const c of connexions) {
    try {
      const messages = await lireMessagesImap(
        c.imap_hote as string,
        Number(c.imap_port),
        c.identifiant as string,
        dechiffrer(c.mot_de_passe_chiffre as string),
        7
      );
      lus += messages.length;
      for (const m of messages) {
        const inserted = await sql`
          INSERT INTO emails_entrants
            (org_id, connexion_id, gmail_message_id, gmail_thread_id, expediteur, objet, extrait, recu_le)
          VALUES
            (${orgId}, ${c.id}, ${m.gmail_message_id}, ${m.gmail_thread_id},
             ${m.expediteur}, ${m.objet}, ${m.extrait}, ${m.recu_le})
          ON CONFLICT (connexion_id, gmail_message_id) DO NOTHING
          RETURNING id
        `;
        if (inserted.length > 0) nouveaux += 1;
      }
      await sql`
        UPDATE email_connexions SET derniere_sync_at = now()
        WHERE id = ${c.id} AND org_id = ${orgId}
      `;
    } catch (e) {
      console.error("imap sync", (e as { code?: string }).code ?? "erreur");
      return { ok: false, status: 502, error: "Synchronisation IMAP échouée" };
    }
  }
  return { ok: true, lus, nouveaux };
}