"use client";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { chargerPourRelance, runAnasRelance } from "@/app/agents/anas-actions";
import {
  DELAIS_PROPOSES,
  JOURS_MAX,
  JOURS_MIN,
  REGISTRES_RELANCE,
  type AnasRelanceOutcome,
  type PropositionRelance,
} from "@/lib/anas-relance";
import { formatMAD } from "@/lib/catalogue-regle";

export type AnasRelanceState = { pending: boolean; outcome: AnasRelanceOutcome | null };

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

export default function AnasRelanceRun({ onState }: { onState: (s: AnasRelanceState) => void }) {
  const [pending, startTransition] = useTransition();
  const [liste, setListe] = useState<PropositionRelance[] | null>(null);
  const [choix, setChoix] = useState("");
  const [jours, setJours] = useState("7");
  const [registre, setRegistre] = useState<string>("Direct");
  const [message, setMessage] = useState<string | null>(null);

  const charger = () =>
    chargerPourRelance()
      .then((l) => {
        setListe(l);
        setChoix((c) => (c && l.some((p) => String(p.runId) === c) ? c : l[0] ? String(l[0].runId) : ""));
      })
      .catch(() => setMessage("Impossible de charger les propositions. Recharge la page."));

  useEffect(() => {
    charger();
  }, []);

  const choisie = (liste ?? []).find((p) => String(p.runId) === choix);

  const lancer = () => {
    if (!choisie) return;
    setMessage(null);
    if (!/^\s*\d+\s*$/.test(jours)) {
      setMessage("Jours sans réponse : saisis un nombre entier.");
      return;
    }
    onState({ pending: true, outcome: null });
    startTransition(async () => {
      let outcome: AnasRelanceOutcome;
      try {
        outcome = await runAnasRelance({ salmaRunId: choisie.runId, joursSilence: Number(jours), registre });
      } catch {
        outcome = { ok: false, error: "L'agent n'a pas pu répondre. Réessaie dans un instant." };
      }
      if (!outcome.ok) setMessage(outcome.error);
      else await charger();
      onState({ pending: false, outcome });
    });
  };

  return (
    <div style={{ display: "grid", gap: 12, border: "1px solid var(--border)", borderRadius: 10, padding: 14, marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700 }}>RELANCE D&apos;UN DEVIS SANS RÉPONSE</div>
      <div style={petit}>
        1. Choisis la proposition envoyée. 2. Indique depuis combien de jours le prospect ne répond pas. 3. Anas prépare un brouillon, soumis à
        approbation : rien n&apos;est envoyé.
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600 }}>Proposition à relancer</label>
        {liste === null ? (
          <div style={petit}>Chargement…</div>
        ) : liste.length === 0 ? (
          <div style={petit}>Aucune proposition chiffrée. Lance d&apos;abord Salma.</div>
        ) : (
          <select style={champ} value={choix} onChange={(e) => setChoix(e.target.value)} disabled={pending}>
            {liste.map((p) => (
              <option key={p.runId} value={String(p.runId)}>
                {p.client} · {formatMAD(p.total_ttc)} MAD TTC{p.version ? ` · ${p.version}` : ""}
                {p.relance_en_attente ? " · relance en attente" : ""}
              </option>
            ))}
          </select>
        )}
        {choisie && (
          <div style={petit}>
            Contrôle de remise :{" "}
            {choisie.verdict_nadia ? <strong>{choisie.verdict_nadia}</strong> : "non contrôlée par Nadia"}.
          </div>
        )}
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600 }}>Jours sans réponse</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {DELAIS_PROPOSES.map((n) => (
            <Button key={n} type="button" size="sm" variant={jours === String(n) ? "default" : "outline"} onClick={() => setJours(String(n))} disabled={pending}>
              {n}
            </Button>
          ))}
          <input style={{ ...champ, width: 70 }} value={jours} onChange={(e) => setJours(e.target.value)} inputMode="numeric" disabled={pending} />
        </div>
        <div style={petit}>
          Entre {JOURS_MIN} et {JOURS_MAX} jours. Jusqu&apos;à 7 : rappel courtois ; jusqu&apos;à 21 : relance ; au-delà : dernier message avant clôture.
        </div>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600 }}>Registre de rédaction</label>
        <select style={champ} value={registre} onChange={(e) => setRegistre(e.target.value)} disabled={pending}>
          {REGISTRES_RELANCE.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {message && <div style={{ fontSize: 12, color: "var(--red)" }}>{message}</div>}
      <Button type="button" onClick={lancer} disabled={pending || !choisie}>
        {pending ? "Rédaction en cours…" : "Préparer la relance"}
      </Button>
    </div>
  );
}