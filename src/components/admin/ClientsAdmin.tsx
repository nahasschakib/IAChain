"use client";

import { useState, useTransition } from "react";
import { activerEssai, enregistrerPaiement, reactiverClient, suspendreClient } from "@/lib/clients-actions";

export type ClientItem = {
  orgId: string;
  nom: string;
  statut: "attente" | "essai" | "paye" | "echu" | "suspendu";
  etat: string;
  inscrit: string;
};

export type PaiementItem = {
  id: number;
  orgName: string;
  montant: string;
  mode: string;
  periodicite: string;
  reference: string;
  payeLe: string;
  couvreJusqu: string;
};

const COULEURS: Record<ClientItem["statut"], string> = {
  attente: "var(--amber)",
  essai: "#1d4ed8",
  paye: "#15803d",
  echu: "#b91c1c",
  suspendu: "#b91c1c",
};

const bouton: React.CSSProperties = {
  font: "inherit",
  fontSize: 12,
  fontWeight: 600,
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "transparent",
  cursor: "pointer",
};

const champ: React.CSSProperties = {
  font: "inherit",
  fontSize: 12,
  padding: "5px 8px",
  border: "1px solid var(--border)",
  borderRadius: 6,
  background: "transparent",
  color: "inherit",
};

function Titre({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "var(--muted-foreground)", margin: "20px 0 6px" }}>
      {children}
    </div>
  );
}

function Ligne({ c }: { c: ClientItem }) {
  const [paiement, setPaiement] = useState(false);
  const [montant, setMontant] = useState("");
  const [mode, setMode] = useState("virement");
  const [periodicite, setPeriodicite] = useState("mensuel");
  const [reference, setReference] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const lancer = (action: () => Promise<{ ok: boolean; error?: string }>, apres?: () => void) =>
    start(async () => {
      setErreur(null);
      const r = await action();
      if (!r.ok) setErreur(r.error ?? "Erreur.");
      else apres?.();
    });

  const payer = () =>
    lancer(
      () => enregistrerPaiement(c.orgId, Number(montant.replace(",", ".")), mode, periodicite, reference),
      () => {
        setPaiement(false);
        setMontant("");
        setReference("");
      }
    );

  return (
    <div style={{ padding: "14px 0", borderTop: "1px solid var(--border)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 600 }}>{c.nom}</span>
        <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--muted-foreground)" }}>Inscrit le {c.inscrit}</span>
      </div>
      <div style={{ fontSize: 12, marginTop: 4, fontWeight: 600, color: COULEURS[c.statut] }}>{c.etat}</div>

      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        {c.statut === "attente" && (
          <button type="button" disabled={pending} style={bouton} onClick={() => lancer(() => activerEssai(c.orgId))}>
            Activer l&apos;essai de 14 jours
          </button>
        )}
        {c.statut !== "suspendu" && (
          <button type="button" disabled={pending} style={bouton} onClick={() => setPaiement(!paiement)}>
            Enregistrer un paiement
          </button>
        )}
        {c.statut !== "suspendu" && (
          <button type="button" disabled={pending} style={bouton} onClick={() => lancer(() => suspendreClient(c.orgId))}>
            Suspendre
          </button>
        )}
        {c.statut === "suspendu" && (
          <button type="button" disabled={pending} style={bouton} onClick={() => lancer(() => reactiverClient(c.orgId))}>
            Réactiver
          </button>
        )}
      </div>

      {paiement && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input style={{ ...champ, width: 110 }} inputMode="decimal" placeholder="Montant (MAD)" value={montant} onChange={(e) => setMontant(e.target.value)} />
          <select style={champ} value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="virement">Virement</option>
            <option value="especes">Espèces</option>
          </select>
          <select style={champ} value={periodicite} onChange={(e) => setPeriodicite(e.target.value)}>
            <option value="mensuel">Mensuel (+1 mois)</option>
            <option value="annuel">Annuel (+1 an)</option>
          </select>
          <input style={{ ...champ, width: 220 }} placeholder="Référence virement ou n° de reçu" value={reference} onChange={(e) => setReference(e.target.value)} />
          <button type="button" disabled={pending} style={{ ...bouton, background: "var(--ink, #0f172a)", color: "#fff" }} onClick={payer}>
            Valider le paiement
          </button>
        </div>
      )}

      {erreur && <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 8 }}>{erreur}</div>}
    </div>
  );
}

export default function ClientsAdmin({ clients, paiements }: { clients: ClientItem[]; paiements: PaiementItem[] }) {
  return (
    <div style={{ maxWidth: 820, padding: "4px 0 40px" }}>
      <Titre>CLIENTS</Titre>
      {clients.length === 0 && (
        <div style={{ fontSize: 13, color: "var(--muted-foreground)", padding: "10px 0" }}>Aucun client pour le moment.</div>
      )}
      {clients.map((c) => (
        <Ligne key={c.orgId} c={c} />
      ))}

      <Titre>DERNIERS PAIEMENTS</Titre>
      {paiements.length === 0 && (
        <div style={{ fontSize: 13, color: "var(--muted-foreground)", padding: "10px 0" }}>Aucun paiement enregistré.</div>
      )}
      {paiements.map((p) => (
        <div key={p.id} style={{ padding: "10px 0", borderTop: "1px solid var(--border)", fontSize: 12 }}>
          <strong>{p.orgName}</strong> · {p.montant} MAD · {p.mode === "especes" ? "Espèces" : "Virement"} · {p.periodicite}
          <div style={{ color: "var(--muted-foreground)", marginTop: 2 }}>
            Réf. {p.reference} · le {p.payeLe} · couvre jusqu&apos;au {p.couvreJusqu}
          </div>
        </div>
      ))}
    </div>
  );
}