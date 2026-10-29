import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { MessageGmail } from "@/lib/gmail";

// Lecture seule : boîte de réception, N derniers jours, 50 messages au maximum.
// Seuls les en-têtes et le début du texte sont lus ; le corps n'est jamais enregistré.
export async function lireMessagesImap(
  hote: string,
  port: number,
  identifiant: string,
  motDePasse: string,
  jours = 7
): Promise<MessageGmail[]> {
  const client = new ImapFlow({
    host: hote,
    port,
    secure: true,
    auth: { user: identifiant, pass: motDePasse },
    logger: false,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  });
  client.on("error", () => {});

  const messages: MessageGmail[] = [];
  await client.connect();
  try {
    const verrou = await client.getMailboxLock("INBOX", { readOnly: true });
    try {
      const depuis = new Date(Date.now() - jours * 24 * 60 * 60 * 1000);
      const uids = (await client.search({ since: depuis }, { uid: true })) || [];
      const derniers = uids.slice(-50);
      if (derniers.length === 0) return messages;
      const uidValidity = String(client.mailbox && "uidValidity" in client.mailbox ? client.mailbox.uidValidity : "0");

      for await (const m of client.fetch(
        derniers,
        { uid: true, envelope: true, internalDate: true, source: { start: 0, maxLength: 20000 } },
        { uid: true }
      )) {
        let extrait: string | null = null;
        try {
          const p = await simpleParser(m.source as Buffer);
          const t = (p.text ?? "").replace(/\s+/g, " ").trim();
          extrait = t ? t.slice(0, 200) : null;
        } catch {
          extrait = null;
        }
        const exp = m.envelope?.from?.[0];
        const expediteur = exp
          ? exp.name
            ? `${exp.name} <${exp.address ?? ""}>`
            : (exp.address ?? null)
          : null;
        messages.push({
          gmail_message_id: m.envelope?.messageId || `uid:${uidValidity}:${m.uid}`,
          gmail_thread_id: null,
          expediteur,
          objet: m.envelope?.subject ?? null,
          extrait,
          recu_le: m.internalDate ? new Date(m.internalDate) : null,
        });
      }
    } finally {
      verrou.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
  return messages;
}