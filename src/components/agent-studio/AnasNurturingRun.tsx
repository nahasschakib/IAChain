"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { runAnasNurturing } from "@/app/agents/anas-actions";
import {
  CANAUX,
  MATURITES,
  NB_DEFAUT,
  NB_MAX,
  NB_MIN,
  REGISTRES_NURTURING,
  type AnasNurturingOutcome,
} from "@/lib/anas-nurturing";

export type AnasNurturingState = { pending: boolean; outcome: AnasNurturingOutcome | null };

const champ: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "6px 8px",
  fontSize: 12,
  background: "var(--surface, #fff)",
  color: "inherit",
  width: "100%",
};
const petit: React.CSSProperties = { fontSize: 11.5, color: "var(--muted-foreground)", lineHeight: 1.45 };

export default function AnasNurturingRun({ onState }: { onState: (s: AnasNurturingState) => void }) {
  const [pending, startTransition] = useTransition();
  const [client, setClient] = useState("");
  const [theme, setTheme] = useState("");
  const [maturite, setMaturite] = useState<string>("Tiède");
  const [canaux, setCanaux] = useState<string[]>(["Email", "LinkedIn"]);
  const [nb, setNb] = useState(String(NB_DEFAUT));
  const [registre, setRegistre] = useState<string>("Direct");
  const [message, setMessage] = useState<string | null>(null);

  const basculer = (c: string) => setCanaux((l) => (l.includes(c) ? l.filter((x) => x !== c) : [...l, c]));

  const lancer = () => {
    setMessage(null);
    if (client.trim().length < 2) {
      setMessage("Indique le nom du prospect.");
      return;
    }
    if (canaux.length === 0) {
      setMessage("Choisis au moins un canal.");
      return;
    }
    if (!/^\s*\d+\s*$/.test(nb)) {
      setMessage("Nombre de touches : saisis un nombre entier.");
      return;
    }
    onState({ pending: true, outcome: null });
    startTransition(async () => {
      let outcome: AnasNurturingOutcome;
      try {
        outcome = await runAnasNurturing({ client, theme, maturite, canaux, nbTouches: Number(nb), registre });
      } catch {
        outcome = { ok: false, error: "L'agent n'a pas pu répondre. Réessaie dans un instant." };
      }
      if (!outcome.ok) setMessage(outcome.error);
      onState({ pending: false, outcome });
    });
  };

  return (
    <div style={{ display: "grid", gap: 12, border: "1px solid var(--border)", borderRadius: 10, padding: 14, marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700 }}>SÉQUENCE DE NURTURING D&apos;UN PROSPECT</div>
      <div style={petit}>
        1. Indique le prospect, sa maturité et les canaux. 2. Anas fixe le calendrier et rédige chaque message. 3. La séquence est soumise à
        approbation : rien n&apos;est envoyé.
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600 }}>Prospect</label>
        <input style={champ} value={client} onChange={(e) => setClient(e.target.value)} placeholder="Ex. Somaplast" maxLength={120} disabled={pending} />
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600 }}>Thème (facultatif)</label>
        <input style={champ} value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Ex. automatisation du suivi commercial" maxLength={120} disabled={pending} />
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600 }}>Maturité</label>
        <select style={champ} value={maturite} onChange={(e) => setMaturite(e.target.value)} disabled={pending}>
          {MATURITES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <div style={petit}>Chaud : touches rapprochées (jusqu&apos;à 4 semaines). Tiède : rythme moyen. Froid : touches espacées.</div>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600 }}>Canaux</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CANAUX.map((c) => (
            <Button key={c} type="button" size="sm" variant={canaux.includes(c) ? "default" : "outline"} onClick={() => basculer(c)} disabled={pending}>
              {c}
            </Button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600 }}>Nombre de touches</label>
        <input style={{ ...champ, width: 70 }} value={nb} onChange={(e) => setNb(e.target.value)} inputMode="numeric" disabled={pending} />
        <div style={petit}>
          Entre {NB_MIN} et {NB_MAX}.
        </div>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600 }}>Registre de rédaction</label>
        <select style={champ} value={registre} onChange={(e) => setRegistre(e.target.value)} disabled={pending}>
          {REGISTRES_NURTURING.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {message && <div style={{ fontSize: 12, color: "var(--red)" }}>{message}</div>}
      <Button type="button" onClick={lancer} disabled={pending}>
        {pending ? "Rédaction en cours…" : "Préparer la séquence"}
      </Button>
    </div>
  );
}