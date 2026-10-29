import { ImapFlow } from "imapflow";

export async function testerImap(
  hote: string,
  port: number,
  identifiant: string,
  motDePasse: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = new ImapFlow({
    host: hote,
    port,
    secure: true,
    auth: { user: identifiant, pass: motDePasse },
    logger: false,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  client.on("error", () => {});
  try {
    await client.connect();
    await client.logout();
    return { ok: true };
  } catch (e) {
    // Jamais le mot de passe dans les journaux : on ne garde que le code.
    console.error("testerImap", (e as { code?: string }).code ?? "erreur");
    return { ok: false, error: "Connexion refusée : vérifie l'identifiant, le mot de passe et le serveur." };
  }
}