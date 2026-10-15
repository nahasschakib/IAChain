"use client";

import { useState, useTransition } from "react";
import { demanderChangementPermission } from "@/lib/permissions-actions";
import type { DemandePermission as Demande } from "./types";

const LIBELLES: Record<string, string> = {
  AUTO: "Automatique",
  APPROBATION_REQUISE: "Validation requise",
  BLOQUE: "Bloqué",
};

export default function DemandePermission({
  demande,
  modeActuel,
}: {
  demande: Demande;
  modeActuel: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const modesPossibles = Object.keys(LIBELLES).filter((m) => m !== modeActuel);
  const [mode, setMode] = useState(modesPossibles[0] ?? "");
  const [motif, setMotif] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);
  const [pending, start] = useTransition();

  if (demande.enAttente) {
    return (
      <div style={{ marginTop: "10px", fontSize: "12px", color: "#92400e" }}>
               Demande en attente : {LIBELLES[demande.enAttente.mode] ?? demande.enAttente.mode} · envoyée le{" "}
        {demande.enAttente.date} · décision de l&apos;Admin SOCYTAY
      </div>
    );
  }

  if (envoye) {
    return (
      <div style={{ marginTop: "10px", fontSize: "12px", color: "#15803d" }}>
        Demande envoyée à l&apos;Admin SOCYTAY.
      </div>
    );
  }

  if (!demande.peutDemander) return null;

  if (!ouvert) {
    return (
      <div style={{ marginTop: "10px" }}>
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
          Demander un changement de mode
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
        La demande est examinée par l&apos;Admin SOCYTAY. Le mode actuel reste en vigueur jusqu&apos;à sa décision.
      </div>
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        style={{
          width: "220px",
          fontSize: "12px",
          padding: "4px 6px",
          border: "1px solid var(--border)",
          borderRadius: "4px",
          background: "transparent",
          color: "inherit",
        }}
      >
        {modesPossibles.map((m) => (
          <option key={m} value={m}>
            {LIBELLES[m]}
          </option>
        ))}
      </select>
      <textarea
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
        placeholder="Motif de la demande (facultatif)"
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
          disabled={pending || !mode}
          onClick={() =>
            start(async () => {
              const r = await demanderChangementPermission(demande.permissionId, mode, motif);
              if (r.ok) setEnvoye(true);
              else setErreur(r.error ?? "Erreur.");
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
          {pending ? "…" : "Envoyer la demande"}
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