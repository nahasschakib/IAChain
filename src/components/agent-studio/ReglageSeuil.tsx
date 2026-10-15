"use client";

import { useState, useTransition } from "react";
import { definirSeuil } from "@/lib/autonomie-actions";

export default function ReglageSeuil({
  agentId,
  actionKey,
  seuil,
}: {
  agentId: number;
  actionKey: string;
  seuil: number;
}) {
  const [valeur, setValeur] = useState(String(seuil));
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const nombre = Number(valeur);
  const inchange = nombre === seuil;

  return (
    <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
      <div style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em", color: "var(--muted-foreground)" }}>
        SEUIL DE PROMOTION
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "6px" }}>
        <input
          type="number"
          min={5}
          max={200}
          value={valeur}
          onChange={(e) => {
            setValeur(e.target.value);
            setMessage(null);
            setErreur(null);
          }}
          style={{
            width: "72px",
            fontSize: "13px",
            padding: "3px 6px",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            background: "transparent",
            color: "inherit",
          }}
        />
        <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
          brouillons acceptés d&apos;affilée (5 à 200)
        </span>
        <button
          type="button"
          disabled={pending || inchange}
          onClick={() =>
            start(async () => {
              const r = await definirSeuil(agentId, actionKey, nombre);
              if (r.ok) setMessage("Seuil enregistré.");
              else setErreur(r.error ?? "Erreur.");
            })
          }
          style={{
            fontSize: "11px",
            padding: "3px 8px",
            borderRadius: "4px",
            border: "none",
            cursor: pending || inchange ? "default" : "pointer",
            background: "#171717",
            color: "#fff",
            opacity: pending || inchange ? 0.4 : 1,
          }}
        >
          {pending ? "…" : "Enregistrer"}
        </button>
      </div>
      {message && <div style={{ fontSize: "11px", color: "#15803d", marginTop: "4px" }}>{message}</div>}
      {erreur && <div style={{ fontSize: "11px", color: "#dc2626", marginTop: "4px" }}>{erreur}</div>}
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "4px" }}>
        N&apos;affecte pas les promotions déjà accordées.
      </div>
    </div>
  );
}