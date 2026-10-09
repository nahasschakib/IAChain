import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function getKey(): Buffer {
  const b64 = process.env.EMAIL_ENCRYPTION_KEY;
  if (!b64) throw new Error("EMAIL_ENCRYPTION_KEY manquante");
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) throw new Error("EMAIL_ENCRYPTION_KEY doit faire 32 octets (base64)");
  return key;
}

// Format stocké : iv.tag.donnees (chacun en base64)
export function chiffrer(texte: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const data = Buffer.concat([cipher.update(texte, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, data].map((b) => b.toString("base64")).join(".");
}

export function dechiffrer(valeur: string): string {
  const [iv, tag, data] = valeur.split(".").map((p) => Buffer.from(p, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}