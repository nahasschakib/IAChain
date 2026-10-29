"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sauverImap } from "@/app/settings/messagerie-actions";
import type { ErreursImap } from "@/lib/messagerie-regle";

export type ConnexionImapVue = {
  identifiant: string;
  imapHote: string;
  imapPort: number;
  smtpHote: string;
  smtpPort: number;
  statut: string;
  derniereSync: string | null;
} | null;

const CHAMP: React.CSSProperties = {
  width: "100%", padding: "8px 10px", border: "1px solid var(--line)",
  borderRadius: 8, fontSize: 13, background: "var(--surface)",
};
const LABEL: React.CSSProperties = { fontSize: 12, color: "var(--graphite)", marginBottom: 4, display: "block" };
const ERR: React.CSSProperties = { fontSize: 12, color: "#b42318", marginTop: 3 };

export default function MessagerieForm({ connexion, canEdit }: { connexion: ConnexionImapVue; canEdit: boolean }) {
  const router = useRouter();
  const [v, setV] = useState<Record<string, string>>({
    identifiant: connexion?.identifiant ?? "",
    motDePasse: "",
    imapHote: connexion?.imapHote ?? "imap.nindomail.com",
    imapPort: String(connexion?.imapPort ?? 993),
    smtpHote: connexion?.smtpHote ?? "smtp.nindomail.com",
    smtpPort: String(connexion?.smtpPort ?? 465),
  });
  const [erreurs, setErreurs] = useState<ErreursImap>({});
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (!canEdit) {
    return (
      <div style={{ fontSize: 13, color: "var(--graphite)" }}>
        {connexion ? `Boîte connectée : ${connexion.identifiant}.` : "Aucune boîte e-mail connectée."}{" "}
        Seuls les administrateurs de l&apos;organisation peuvent la modifier.
      </div>
    );
  }

  function champ(cle: string, libelle: string, type = "text", aide?: string) {
    return (
      <div>
        <label style={LABEL} htmlFor={`msg-${cle}`}>{libelle}</label>
        <input
          id={`msg-${cle}`}
          type={type}
          value={v[cle]}
          autoComplete={type === "password" ? "new-password" : "off"}
          onChange={(e) => setV({ ...v, [cle]: e.target.value })}
          style={CHAMP}
        />
        {aide && <div style={{ fontSize: 11, color: "var(--graphite)", marginTop: 3 }}>{aide}</div>}
        {erreurs[cle as keyof ErreursImap] && <div style={ERR}>{erreurs[cle as keyof ErreursImap]}</div>}
      </div>
    );
  }

  async function enregistrer() {
    setMessage(null);
    setErreurs({});
    setPending(true);
    try {
      const r = await sauverImap(v);
      if (r.ok) {
        setV({ ...v, motDePasse: "" });
        setMessage({ ok: true, text: "Connexion testée et enregistrée." });
        router.refresh();
      } else {
        setErreurs(r.erreurs ?? {});
        setMessage({ ok: false, text: r.error });
      }
    } catch {
      setMessage({ ok: false, text: "Enregistrement impossible. Réessaie dans un instant." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {connexion && (
        <div style={{ fontSize: 12, color: "var(--graphite)" }}>
          État : {connexion.statut}
          {connexion.derniereSync ? ` · dernière synchronisation : ${connexion.derniereSync}` : " · jamais synchronisée"}
        </div>
      )}
      {champ("identifiant", "Adresse e-mail (identifiant)")}
      {champ("motDePasse", "Mot de passe de la boîte", "password",
        connexion ? "Laisse vide pour conserver le mot de passe enregistré." : undefined)}
      {champ("imapHote", "Serveur IMAP (réception)")}
      {champ("imapPort", "Port IMAP (SSL/TLS)")}
      {champ("smtpHote", "Serveur SMTP (envoi)")}
      {champ("smtpPort", "Port SMTP (465 SSL/TLS ou 587)")}
      <div style={{ fontSize: 11, color: "var(--graphite)" }}>
        La connexion est testée avant l&apos;enregistrement. Le mot de passe est chiffré et n&apos;est jamais réaffiché.
        Lecture seule pour l&apos;instant : aucun envoi n&apos;est branché.
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          onClick={enregistrer}
          disabled={pending}
          style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--steel)", color: "#fff", fontSize: 13, cursor: pending ? "wait" : "pointer" }}
        >
          {pending ? "Test en cours…" : "Tester et enregistrer"}
        </button>
        {message && <span style={{ fontSize: 13, color: message.ok ? "#067647" : "#b42318" }}>{message.text}</span>}
      </div>
    </div>
  );
}