import { NextResponse } from "next/server";
import { adminApi } from "@/lib/api-admin";
import { sql } from "@/lib/db";
import {
  ConnexionExpireeError,
  lireMessagesRecents,
  obtenirAccessToken,
  type ConnexionGmail,
} from "@/lib/gmail";

export async function POST() {
  const a = await adminApi();
  if (a.err) return a.err;
  const { orgId } = a.ctx;

  // Toujours filtré par organisation
  const connexions = (await sql`
    SELECT id, org_id, refresh_token_chiffre
    FROM email_connexions
    WHERE org_id = ${orgId} AND fournisseur = 'gmail' AND statut = 'actif'
  `) as ConnexionGmail[];

  if (connexions.length === 0) {
    return NextResponse.json(
      { error: "Aucune boîte Gmail active pour cette organisation" },
      { status: 404 }
    );
  }

  let nouveaux = 0;
  let lus = 0;

  for (const connexion of connexions) {
    try {
      const accessToken = await obtenirAccessToken(connexion);
      const messages = await lireMessagesRecents(accessToken, 7);
      lus += messages.length;

      for (const m of messages) {
        const inserted = await sql`
          INSERT INTO emails_entrants
            (org_id, connexion_id, gmail_message_id, gmail_thread_id, expediteur, objet, extrait, recu_le)
          VALUES
            (${orgId}, ${connexion.id}, ${m.gmail_message_id}, ${m.gmail_thread_id},
             ${m.expediteur}, ${m.objet}, ${m.extrait}, ${m.recu_le})
          ON CONFLICT (connexion_id, gmail_message_id) DO NOTHING
          RETURNING id
        `;
        if (inserted.length > 0) nouveaux += 1;
      }

      await sql`
        UPDATE email_connexions SET derniere_sync_at = now()
        WHERE id = ${connexion.id} AND org_id = ${orgId}
      `;
    } catch (e) {
      if (e instanceof ConnexionExpireeError) {
        return NextResponse.json(
          { error: "Connexion Gmail expirée : reconnectez la boîte", code: "expire" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "Synchronisation Gmail échouée" }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: true, lus, nouveaux });
}