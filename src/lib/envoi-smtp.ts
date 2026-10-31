import nodemailer from "nodemailer";
import { sql } from "@/lib/db";
import { dechiffrer } from "@/lib/email-crypto";
import { getBrandkit } from "@/lib/brandkit";
import { choisirDestinataire, extraireAdresse, objetReponse } from "@/lib/envoi-regle";
import { journaliserEnvoi, quotaDuJour } from "@/lib/envoi-journal";

export type ResultatEnvoi = { ok: true } | { ok: false; raison: string };

const refus = (raison: string): ResultatEnvoi => ({ ok: false, raison });

// Message-ID d'origine utilisable pour le fil de conversation (absent pour un identifiant de repli « uid:… »).
function idMessage(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return /^<[^<>\s]+>$/.test(s) ? s : null;
}

// Envoie la réponse validée à l'expéditeur de l'e-mail d'origine, par la boîte IMAP/SMTP de l'organisation.
// Ne contacte jamais le SMTP tant que ENVOI_EMAIL_ACTIF n'est pas « oui ». Journalise chaque envoi ou échec.
export async function envoyerReponse(
  orgId: string,
  emailId: string,
  texte: string,
): Promise<ResultatEnvoi> {
  if (process.env.ENVOI_EMAIL_ACTIF !== "oui") return refus("Envoi désactivé sur cet environnement");
  const corps = texte.trim();
  if (!corps) return refus("Le texte de la réponse est vide");

  const mails = await sql`
    SELECT expediteur, objet, gmail_message_id, connexion_id
    FROM emails_entrants
    WHERE id = ${emailId} AND org_id = ${orgId}
  `;
  const mail = mails[0];
  if (!mail) return refus("E-mail d'origine introuvable");

  const conns = await sql`
    SELECT id, identifiant, smtp_hote, smtp_port, mot_de_passe_chiffre
    FROM email_connexions
    WHERE id = ${mail.connexion_id} AND org_id = ${orgId} AND fournisseur = 'imap'
  `;
  const c = conns[0];
  if (!c || !c.smtp_hote || !c.smtp_port || !c.mot_de_passe_chiffre)
    return refus("Connexion SMTP non configurée pour cet e-mail");
  const adresseBoite = extraireAdresse(String(c.identifiant ?? ""));
  if (!adresseBoite) return refus("Identifiant de la boîte invalide");

  const dest = choisirDestinataire(mail.expediteur, adresseBoite);
  if (!dest.ok) return refus(dest.raison);

  const quota = await quotaDuJour(orgId, c.id as string);
  if (!quota.autorise) return refus(quota.raison);

  let motDePasse: string;
  try {
    motDePasse = dechiffrer(String(c.mot_de_passe_chiffre));
  } catch {
    return refus("Mot de passe de la boîte illisible : le ressaisir dans Paramètres");
  }

  const kit = await getBrandkit(orgId).catch(() => null);
  const nom = (kit?.nom_commercial || kit?.raison_sociale || "").replace(/[\r\n"<>]/g, " ").trim();
  const objet = objetReponse(mail.objet);
  const reference = idMessage(mail.gmail_message_id);
  const port = Number(c.smtp_port);
  const entree = {
    orgId,
    connexionId: c.id as string,
    emailId,
    destinataire: dest.adresse,
    objet,
  };

  try {
    const transport = nodemailer.createTransport({
      host: String(c.smtp_hote),
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user: String(c.identifiant), pass: motDePasse },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
    await transport.sendMail({
      from: nom ? { name: nom, address: adresseBoite } : adresseBoite,
      to: dest.adresse,
      subject: objet,
      text: corps,
      ...(reference ? { inReplyTo: reference, references: reference } : {}),
    });
  } catch (e) {
    // Seul le code d'erreur est conservé : jamais le message du serveur ni le mot de passe.
    const code = String((e as { code?: string }).code ?? "SMTP").slice(0, 40);
    await journaliserEnvoi({ ...entree, statut: "echec", erreur: code }).catch((err) =>
      console.error("envoi journal echec", err),
    );
    return refus(`Envoi impossible (code ${code})`);
  }

  await journaliserEnvoi({ ...entree, statut: "envoye" }).catch((err) =>
    console.error("envoi journal", err),
  );
  return { ok: true };
}