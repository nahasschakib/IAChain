"use client";

import { useState, useTransition } from "react";
import type { CSSProperties } from "react";
import { accorderPromotion, revoquerPromotion } from "@/lib/autonomie-actions";
import type { Autonomie } from "./types";
   import SignalerCorrection from "./SignalerCorrection";

const BTN: CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  padding: "5px 10px",
  borderRadius: "3px",
  border: "1px solid var(--border)",
  background: "transparent",
  cursor: "pointer",
};

export default function SerieAcceptes({ autonomie }: { autonomie: Autonomie }) {
  const [confirm, setConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function agir(type: "promouvoir" | "revoquer", categorie: string) {
    setError(null);
    startTransition(async () => {
      const fn = type === "promouvoir" ? accorderPromotion : revoquerPromotion;
      const res = await fn(autonomie.agentId, autonomie.actionKey, categorie, autonomie.canal);
      if (!res.ok) {
        setError(res.error ?? "Erreur");
        return;
      }
      setConfirm(null);
    });
  }

  function confirmation(type: "promouvoir" | "revoquer", categorie: string, libelle: string) {
    const cle = `${type}:${categorie}`;
    if (confirm !== cle) {
      return (
        <button type="button" disabled={isPending} style={BTN} onClick={() => setConfirm(cle)}>
          {libelle}
        </button>
      );
    }
    return (
      <span style={{ display: "inline-flex", gap: "6px" }}>
        <button type="button" disabled={isPending} style={BTN} onClick={() => setConfirm(null)}>
          Annuler
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => agir(type, categorie)}
          style={{
            ...BTN,
            border: "none",
            color: "#fff",
            background: type === "revoquer" ? "#b91c1c" : "var(--steel-strong, #2f4a63)",
          }}
        >
          {isPending ? "Enregistrement…" : "Confirmer"}
        </button>
      </span>
    );
  }

  return (
    <div style={{ marginTop: "10px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", color: "var(--muted-foreground)", marginBottom: "6px" }}>
        BROUILLONS ACCEPTÉS SANS CORRECTION
      </div>
      {autonomie.categories.length === 0 ? (
        <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>Aucune décision enregistrée</div>
      ) : (
        autonomie.categories.map((c) => {
          const atteint = c.serie >= autonomie.seuil;
          return (
            <div key={c.categorie} style={{ padding: "4px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                <span>{c.categorie}</span>
                {c.promue ? (
                  <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#166534" }}>Automatique</span>
                ) : (
                  <span style={{ fontFamily: "monospace", color: atteint ? "#166534" : "inherit" }}>
                    {`${c.serie} / ${autonomie.seuil}${atteint ? " · seuil atteint" : ""}`}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                {c.promue && autonomie.peutAppliquer && confirmation("revoquer", c.categorie, "Révoquer")}
                {!c.promue && atteint && autonomie.peutAppliquer &&
                  confirmation("promouvoir", c.categorie, "Promouvoir en automatique")}
                {!c.promue && atteint && !autonomie.peutAppliquer && (
                  <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                    À demander à l&apos;Admin SOCYTAY
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", color: "var(--muted-foreground)", margin: "14px 0 6px" }}>
        {`TRAITÉS EN AUTOMATIQUE (7 J) · ${autonomie.journal.recents7j}`}
      </div>
      {autonomie.journal.entrees.length === 0 ? (
        <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>Aucun brouillon traité en automatique</div>
      ) : (
        autonomie.journal.entrees.map((e) => (
          <div key={e.id} style={{ padding: "6px 0", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span>{e.categorie}</span>
              <span style={{ fontFamily: "monospace", color: "var(--muted-foreground)" }}>{e.date}</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "2px" }}>{e.apercu}</div>
             {e.corrigee ? (
              <div style={{ fontSize: "11px", color: "#b45309", marginTop: "4px" }}>Correction signalée</div>
            ) : autonomie.peutAppliquer ? (
              <div style={{ marginTop: "4px" }}>
                  <SignalerCorrection journalId={e.id} actionKey={autonomie.actionKey} />
              </div>
            ) : null}
          </div>
        ))
      )}
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "6px" }}>
        Priorité haute ou critique : toujours validée par un humain.
      </div>
      {error && <div style={{ fontSize: "12px", color: "#b91c1c", marginTop: "6px" }}>{error}</div>}
    </div>
  );
}