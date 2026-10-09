import { sql } from "@/lib/db";
import { dechiffrer } from "@/lib/email-crypto";

export type ConnexionGmail = {
  id: string;
  org_id: string;
  refresh_token_chiffre: string;
};

export type MessageGmail = {
  gmail_message_id: string;
  gmail_thread_id: string | null;
  expediteur: string | null;
  objet: string | null;
  extrait: string | null;
  recu_le: Date | null;
};

export class ConnexionExpireeError extends Error {
  constructor() {
    super("Connexion Gmail expirée ou révoquée");
  }
}

// Échange le jeton de rafraîchissement (chiffré en base) contre un jeton d'accès.
// Le jeton d'accès n'est jamais stocké.
export async function obtenirAccessToken(connexion: ConnexionGmail): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: dechiffrer(connexion.refresh_token_chiffre),
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();

  if (!res.ok) {
    if (data.error === "invalid_grant") {
      // Cas typique du mode test Google : jeton expiré au bout de 7 jours
      await sql`
        UPDATE email_connexions SET statut = 'expire'
        WHERE id = ${connexion.id} AND org_id = ${connexion.org_id}
      `;
      throw new ConnexionExpireeError();
    }
    throw new Error(`Renouvellement du jeton refusé (${res.status} ${data.error ?? ""})`);
  }
  return data.access_token as string;
}

function enTete(headers: { name: string; value: string }[] | undefined, nom: string) {
  return headers?.find((h) => h.name.toLowerCase() === nom.toLowerCase())?.value ?? null;
}

// Liste les messages de la boîte de réception des N derniers jours (50 maximum)
// puis lit uniquement les en-têtes et l'extrait : jamais le corps complet.
export async function lireMessagesRecents(
  accessToken: string,
  jours = 7
): Promise<MessageGmail[]> {
  const auth = { Authorization: `Bearer ${accessToken}` };

  const listeUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  listeUrl.searchParams.set("labelIds", "INBOX");
  listeUrl.searchParams.set("q", `newer_than:${jours}d`);
  listeUrl.searchParams.set("maxResults", "50");

  const listeRes = await fetch(listeUrl, { headers: auth });
  if (!listeRes.ok) throw new Error(`Liste Gmail refusée (${listeRes.status})`);
  const liste = await listeRes.json();
  const ids: string[] = (liste.messages ?? []).map((m: { id: string }) => m.id);

  const messages: MessageGmail[] = [];
  // Par lots de 10 pour rester raisonnable côté quotas
  for (let i = 0; i < ids.length; i += 10) {
    const lot = await Promise.all(
      ids.slice(i, i + 10).map(async (id) => {
        const url = new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`);
        url.searchParams.set("format", "metadata");
        for (const h of ["From", "Subject"]) url.searchParams.append("metadataHeaders", h);

        const res = await fetch(url, { headers: auth });
        if (!res.ok) return null;
        const m = await res.json();
        return {
          gmail_message_id: m.id as string,
          gmail_thread_id: (m.threadId as string) ?? null,
          expediteur: enTete(m.payload?.headers, "From"),
          objet: enTete(m.payload?.headers, "Subject"),
          extrait: m.snippet ? String(m.snippet).slice(0, 200) : null,
          recu_le: m.internalDate ? new Date(Number(m.internalDate)) : null,
        } satisfies MessageGmail;
      })
    );
    for (const msg of lot) if (msg) messages.push(msg);
  }
  return messages;
}