"use client";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { chargerPourNadia, runNadia } from "@/app/agents/nadia-actions";
import { MAX_COMMENTAIRE, type ListePourNadia, type NadiaOutcome } from "@/lib/nadia";

type Values = Record<string, string | boolean | string[]>;
export type NadiaRunState = { pending: boolean; outcome: NadiaOutcome | null };

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
const pct = (n: number) => `${String(n).replace(".", ",")} %`;

export default function NadiaLiveRun({ values, onState }: { values: Values; onState: (s: NadiaRunState) => void }) {
  const [pending, startTransition] = useTransition();
  const [liste, setListe] = useState<ListePourNadia | null>(null);
  const [choix, setChoix] = useState("");
  const [motif, setMotif] = useState("");
  const [segment, setSegment] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [fait, setFait] = useState(false);

  useEffect(() => {
    let vivant = true;
    chargerPourNadia()
      .then((l) => {
        if (!vivant) return;
        setListe(l);
        if (l.propositions[0]) setChoix(String(l.propositions[0].runId));
      })
      .catch(() => vivant && setMessage("Impossible de charger les propositions. Recharge la page."));
    return () => {
      vivant = false;
    };
  }, []);

  const propositions = liste?.propositions ?? [];
  const motifs = liste?.politique?.motifs ?? [];
  const choisie = propositions.find((p) => String(p.runId) === choix);

  const etapes = [
    { fait: propositions.length > 0, titre: "Prépare une proposition", aide: "Salma doit avoir chiffré un devis." },
    { fait: choisie !== undefined, titre: "Choisis-la", aide: "La plus récente est présélectionnée." },
    { fait, titre: "Lance le contrôle", aide: "Nadia compare la remise à la politique tarifaire." },
  ];
  const courante = etapes.findIndex((e) => !e.fait);

  const lancer = () => {
    if (!choisie) return;
    setMessage(null);
    onState({ pending: true, outcome: null });
    startTransition(async () => {
      let outcome: NadiaOutcome;
      try {
        outcome = await runNadia({
          salmaRunId: choisie.runId,
          motifException: motif,
          segment: choisie.segment ? undefined : segment || undefined,
          commentaire: String(values.commentaire ?? "").trim(),
        });
      } catch {
        outcome = { ok: false, error: "L'agent n'a pas pu répondre. Réessaie dans un instant." };
      }
      if (outcome.ok) setFait(true);
      else setMessage(outcome.error);
      onState({ pending: false, outcome });
    });
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>COMMENT ÇA MARCHE</div>
        <div style={{ display: "grid", gap: 8 }}>
          {etapes.map((e, i) => (
            <div key={e.titre} style={{ display: "flex", gap: 8, fontSize: 12, opacity: e.fait || i === courante ? 1 : 0.55 }}>
              <span style={{ fontWeight: 700 }}>{e.fait ? "✓" : i + 1}</span>
              <span>
                <strong>{e.titre}.</strong> {e.aide}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600 }}>Proposition à contrôler</label>
        {liste === null ? (
          <div style={petit}>Chargement…</div>
        ) : propositions.length === 0 ? (
          <div style={petit}>Aucune proposition chiffrée. Lance d&apos;abord Salma, puis reviens ici.</div>
        ) : (
          <select style={champ} value={choix} onChange={(e) => setChoix(e.target.value)} disabled={pending}>
            {propositions.map((p) => (
              <option key={p.runId} value={String(p.runId)}>
                {p.client} · remise {pct(p.remise_pct)}
                {p.version ? ` · ${p.version}` : ""} · {new Date(p.created_at).toLocaleDateString("fr-FR")}
              </option>
            ))}
          </select>
        )}
      </div>

      {choisie && !choisie.segment && (
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Segment du client</label>
          <select style={champ} value={segment} onChange={(e) => setSegment(e.target.value)} disabled={pending}>
            <option value="">Non précisé</option>
            {(liste?.politique?.segments ?? []).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div style={petit}>Cette proposition n&apos;a pas de segment : sans lui, Nadia ne peut pas choisir la grille et renvoie un contrôle manuel.</div>
        </div>
      )}

      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600 }}>Motif d&apos;exception (si la remise dépasse le plafond)</label>
        <select style={champ} value={motif} onChange={(e) => setMotif(e.target.value)} disabled={pending}>
          <option value="">Aucun motif</option>
          {motifs.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <div style={petit}>
          {liste?.politique
            ? `Motifs de la politique tarifaire v${liste.politique.version}. La condition du motif est vérifiée par la direction à l'approbation.`
            : "Aucune politique tarifaire active : le contrôle sera manuel. Renseigne-la dans Paramètres."}
        </div>
      </div>

      {message && <div style={{ fontSize: 12, color: "var(--red)" }}>{message}</div>}
      <div style={petit}>Commentaire facultatif : {MAX_COMMENTAIRE} caractères maximum. Nadia signale, elle ne modifie jamais une remise.</div>
      <Button onClick={lancer} disabled={pending || !choisie}>
        {pending ? "Contrôle en cours…" : "Contrôler la remise"}
      </Button>
    </div>
  );
}