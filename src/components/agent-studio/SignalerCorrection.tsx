"use client";

import { useState, useTransition } from "react";
import { signalerCorrection } from "@/lib/autonomie-actions";

export default function SignalerCorrection({
  journalId,
  actionKey = "reponse_email",
}: {
  journalId: number;
  actionKey?: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        style={{
          fontSize: "11px",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textDecoration: "underline",
          color: "var(--muted-foreground)",
        }}
      >
        Signaler une correction
      </button>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
        La catégorie repassera en validation humaine et la série repartira de zéro.
      </div>
      <textarea
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
        placeholder="Motif (facultatif)"
        rows={2}
        style={{
          width: "100%",
          fontSize: "12px",
          padding: "4px 6px",
          border: "1px solid var(--border)",
          borderRadius: "4px",
          background: "transparent",
          color: "inherit",
          resize: "vertical",
        }}
      />
      {erreur && <div style={{ fontSize: "11px", color: "#dc2626" }}>{erreur}</div>}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
                const r = await signalerCorrection(journalId, motif, actionKey);
              if (!r.ok) setErreur(r.error ?? "Erreur.");
            })
          }
          style={{
            fontSize: "11px",
            padding: "3px 8px",
            borderRadius: "4px",
            border: "none",
            cursor: pending ? "default" : "pointer",
            background: "#171717",
            color: "#fff",
            opacity: pending ? 0.5 : 1,
          }}
        >
          {pending ? "…" : "Confirmer"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setOuvert(false);
            setErreur(null);
          }}
          style={{
            fontSize: "11px",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            textDecoration: "underline",
            color: "var(--muted-foreground)",
          }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}