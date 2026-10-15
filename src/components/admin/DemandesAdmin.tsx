"use client";

import { useState, useTransition } from "react";
import { decideDemandePermission } from "@/lib/permissions-actions";

export type DemandeItem = {
  id: number;
  orgName: string;
  agent: string;
  action: string;
  modeActuel: string;
  modeDemande: string;
  motif: string | null;
  date: string;
};

export type DecisionItem = {
  id: number;
  orgName: string;
  agent: string;
  action: string;
  modeDemande: string;
  statut: string;
  note: string | null;
  date: string;
};

const LIBELLES: Record<string, string> = {
  AUTO: "Automatique",
  APPROBATION_REQUISE: "Validation requise",
  BLOQUE: "Bloqué",
};

function Titre({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", color: "var(--muted-foreground)", margin: "20px 0 6px" }}>
      {children}
    </div>
  );
}

function Ligne({ d }: { d: DemandeItem }) {
  const [note, setNote] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const decider = (decision: "accepte" | "refuse") =>
    start(async () => {
      const r = await decideDemandePermission(d.id, decision, note);
      if (!r.ok) setErreur(r.error ?? "Erreur.");
    });

  return (
    <div style={{ padding: "14px 0", borderTop: "1px solid var(--border)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13px" }}>
        <span style={{ fontWeight: 600 }}>
          {d.orgName} · {d.agent} · {d.action}
        </span>
        <span style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--muted-foreground)" }}>{d.date}</span>
      </div>
      <div style={{ fontSize: "12px", marginTop: "4px" }}>
        {LIBELLES[d.modeActuel] ?? d.modeActuel} → <strong>{LIBELLES[d.modeDemande] ?? d.modeDemande}</strong>
      </div>
      {d.motif && (
        <div style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "4px" }}>Motif : {d.motif}</div>
      )}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note de décision (facultatif)"
        rows={2}
        style={{
          width: "100%",
          marginTop: "8px",
          fontSize: "12px",
          padding: "4px 6px",
          border: "1px solid var(--border)",
          borderRadius: "4px",
          background: "transparent",
          color: "inherit",
          resize: "vertical",
        }}
      />
      {erreur && <div style={{ fontSize: "11px", color: "#dc2626", marginTop: "4px" }}>{erreur}</div>}
      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
        <button
          type="button"
          disabled={pending}
          onClick={() => decider("accepte")}
          style={{
            fontSize: "11px",
            padding: "4px 10px",
            borderRadius: "4px",
            border: "none",
            cursor: pending ? "default" : "pointer",
            background: "#171717",
            color: "#fff",
            opacity: pending ? 0.5 : 1,
          }}
        >
          Accepter
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => decider("refuse")}
          style={{
            fontSize: "11px",
            padding: "4px 10px",
            borderRadius: "4px",
            border: "1px solid var(--border)",
            cursor: pending ? "default" : "pointer",
            background: "transparent",
            color: "inherit",
            opacity: pending ? 0.5 : 1,
          }}
        >
          Refuser
        </button>
      </div>
    </div>
  );
}

export default function DemandesAdmin({
  demandes,
  decisions,
}: {
  demandes: DemandeItem[];
  decisions: DecisionItem[];
}) {
  return (
    <div style={{ maxWidth: "760px" }}>
      <Titre>DEMANDES EN ATTENTE · {demandes.length}</Titre>
      {demandes.length === 0 && (
        <div style={{ fontSize: "13px", color: "var(--muted-foreground)", padding: "12px 0" }}>
          Aucune demande en attente.
        </div>
      )}
      {demandes.map((d) => (
        <Ligne key={d.id} d={d} />
      ))}

      <Titre>DÉCISIONS RÉCENTES</Titre>
      {decisions.length === 0 && (
        <div style={{ fontSize: "13px", color: "var(--muted-foreground)", padding: "12px 0" }}>
          Aucune décision pour le moment.
        </div>
      )}
      {decisions.map((d) => (
        <div key={d.id} style={{ padding: "10px 0", borderTop: "1px solid var(--border)", fontSize: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <span>
              {d.orgName} · {d.agent} · {d.action} → {LIBELLES[d.modeDemande] ?? d.modeDemande}
            </span>
            <span style={{ fontFamily: "monospace", fontSize: "11px", color: d.statut === "accepte" ? "#166534" : "#b91c1c" }}>
              {d.statut === "accepte" ? "Accepté" : "Refusé"} · {d.date}
            </span>
          </div>
          {d.note && <div style={{ color: "var(--muted-foreground)", marginTop: "2px" }}>{d.note}</div>}
        </div>
      ))}
    </div>
  );
}