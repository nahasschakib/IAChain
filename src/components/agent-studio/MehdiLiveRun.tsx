"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { runMehdi } from "@/app/agents/mehdi-actions";
import type { MehdiOutcome } from "@/lib/mehdi";

type Values = Record<string, string | boolean | string[]>;
const first = (v: Values[string] | undefined) => (Array.isArray(v) && v[0] ? v[0] : "non précisé");

export default function MehdiLiveRun({ values }: { values: Values }) {
  const [pending, startTransition] = useTransition();
  const [outcome, setOutcome] = useState<MehdiOutcome | null>(null);

  const launch = () => {
    setOutcome(null);
    startTransition(async () => {
      const res = await runMehdi({
        fiche: String(values.fiche_prospect ?? ""),
        fit: first(values.fit_icp),
        budget: first(values.budget_estime),
        maturite: first(values.maturite_besoin),
      });
      setOutcome(res);
    });
  };

  const r = outcome && outcome.ok ? outcome.result : null;
    const color =
    r?.verdict === "Qualifié"
      ? "var(--emerald, #2f8f5b)"
      : r?.verdict === "À nourrir" || r?.verdict === "À compléter"
      ? "var(--amber)"
      : "var(--red)";

  return (
    <div style={{ marginBottom: "12px" }}>
      <Button type="button" onClick={launch} disabled={pending} style={{ width: "100%" }}>
        {pending ? "Analyse en cours…" : "Qualifier avec l'IA (réel)"}
      </Button>

      {outcome && !outcome.ok && (
        <div style={{ fontSize: "12px", color: "var(--red)", marginTop: "8px" }}>{outcome.error}</div>
      )}

      {r && (
        <div style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "14px", marginTop: "12px", fontSize: "13px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>RÉSULTAT RÉEL · IA</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color }}>
            {r.verdict}
            {r.verdict !== "À compléter" ? ` · ${r.score}/100` : ""}
          </div>
          <div style={{ margin: "8px 0", color: "var(--muted-foreground)" }}>
            Fit {r.fit_icp} ({r.detail.fit}/40) · Budget {r.budget_estime} ({r.detail.budget}/30) · Maturité{" "}
            {r.maturite_besoin} ({r.detail.maturite}/30)
          </div>
          <p style={{ margin: "0 0 8px", lineHeight: 1.5 }}>{r.justification}</p>
          {r.informations_manquantes.length > 0 && (
            <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
              Informations manquantes : {r.informations_manquantes.join(" · ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}