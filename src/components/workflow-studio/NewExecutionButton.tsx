"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { launchProspectToCash } from "@/app/workflows/launch-actions";

const CANAUX = ["Formulaire web", "Salon professionnel", "Import CSV"];
const FITS = ["Fort", "Moyen", "Faible"];
const BUDGETS = ["< 50k MAD", "50-200k MAD", "200k+ MAD"];
const MATURITES = ["Exploration", "Comparaison active", "Prêt à acheter"];

const chipStyle = (on: boolean): React.CSSProperties => ({
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  cursor: "pointer",
  border: "1px solid var(--line)",
  background: on ? "var(--steel-deep)" : "var(--surface)",
  color: on ? "#f5f6f8" : "inherit",
});

function Chips({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: "var(--graphite)", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map((o) => (
          <button
            key={o}
            type="button"
            disabled={disabled}
            onClick={() => onChange(value === o ? "" : o)}
            style={chipStyle(value === o)}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiChips({
  label,
  options,
  values,
  onChange,
  disabled,
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
  disabled: boolean;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: "var(--graphite)", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map((o) => {
          const on = values.includes(o);
          return (
            <button
              key={o}
              type="button"
              disabled={disabled}
              onClick={() => onChange(on ? values.filter((v) => v !== o) : [...values, o])}
              style={chipStyle(on)}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function NewExecutionButton({
  slug,
  segments,
  enjeux,
}: {
  slug: string;
  segments: string[];
  enjeux: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signal, setSignal] = useState("");
  const [canal, setCanal] = useState(CANAUX[0]);
  const [crm, setCrm] = useState("");
  const [fit, setFit] = useState("");
  const [budget, setBudget] = useState("");
  const [maturite, setMaturite] = useState("");
  const [segment, setSegment] = useState("");
  const [enjeuxSel, setEnjeuxSel] = useState<string[]>([]);
  const [offer, setOffer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ status: string; note: string } | null>(null);
  const [pending, start] = useTransition();

  function resetForm() {
    setSignal("");
    setCrm("");
    setFit("");
    setBudget("");
    setMaturite("");
    setSegment("");
    setEnjeuxSel([]);
    setOffer("");
  }

  function close() {
    if (pending) return;
    setOpen(false);
    setError(null);
    setDone(null);
    resetForm();
  }

  function launch() {
    setError(null);
    start(async () => {
      const out = await launchProspectToCash({
        signal,
        canaux: [canal],
        compteCrm: crm,
        fit,
        budget,
        maturite,
        segment: segment || undefined,
        enjeux: enjeuxSel,
        offer: offer.trim() || undefined,
      });
      if (!out.ok) {
        setError(out.error);
        return;
      }
      setDone({ status: out.status, note: out.note });
      router.refresh();
    });
  }

  function seeExecution() {
    setOpen(false);
    setDone(null);
    resetForm();
    router.push(`/workflows/${slug}?vue=execution`);
  }

  const field: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid var(--line)",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 13,
    fontFamily: "inherit",
    background: "var(--surface)",
    color: "inherit",
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          marginLeft: "auto",
          background: "var(--steel-deep)",
          color: "#f5f6f8",
          fontSize: 13,
          fontWeight: 600,
          padding: "9px 16px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          whiteSpace: "nowrap",
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.18)",
        }}
      >
        + Nouvelle exécution
      </button>

      {open &&
        createPortal(
          <div
            onClick={close}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
              padding: 16,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--surface, #fff)",
                borderRadius: 14,
                padding: 24,
                width: 560,
                maxWidth: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 60px rgba(15, 23, 42, 0.3)",
              }}
            >
              <div style={{ fontSize: 11, color: "var(--graphite)", marginBottom: 4 }}>PROSPECT TO CASH</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Nouvelle exécution</h2>
              <p style={{ fontSize: 13, color: "var(--graphite)", margin: "0 0 18px" }}>
                Yasmine capture le signal et produit la fiche prospect, puis Mehdi la qualifie. La décision go/no-go reste humaine.
              </p>

              {!done ? (
                <>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Canal source</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    {CANAUX.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCanal(c)}
                        disabled={pending}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 999,
                          fontSize: 13,
                          cursor: "pointer",
                          border: "1px solid var(--line)",
                          background: canal === c ? "var(--steel-deep)" : "var(--surface)",
                          color: canal === c ? "#f5f6f8" : "inherit",
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Contenu du signal brut</div>
                  <textarea
                    value={signal}
                    onChange={(e) => setSignal(e.target.value)}
                    disabled={pending}
                    rows={6}
                    placeholder="Collez le message, le formulaire ou la note reçue…"
                    style={{ ...field, marginBottom: 16, resize: "vertical" }}
                  />

                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Compte CRM associé (optionnel)</div>
                  <textarea
                    value={crm}
                    onChange={(e) => setCrm(e.target.value)}
                    disabled={pending}
                    rows={2}
                    style={{ ...field, marginBottom: 16, resize: "vertical" }}
                  />

                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Estimation du commercial (optionnelle)</div>
                  <p style={{ fontSize: 12, color: "var(--graphite)", margin: "0 0 8px" }}>
                    Indicative et non prouvée : Mehdi ne la retient que si la fiche la soutient.
                  </p>
                  <Chips label="Fit ICP" options={FITS} value={fit} onChange={setFit} disabled={pending} />
                  <Chips label="Budget" options={BUDGETS} value={budget} onChange={setBudget} disabled={pending} />
                  <Chips label="Maturité du besoin" options={MATURITES} value={maturite} onChange={setMaturite} disabled={pending} />

                  <div style={{ fontSize: 13, fontWeight: 600, margin: "16px 0 2px" }}>Plan d&apos;approche (Karim, optionnel)</div>
                  <p style={{ fontSize: 12, color: "var(--graphite)", margin: "0 0 8px" }}>
                    Utilisé seulement si le prospect est qualifié. Ce que vous choisissez ici prime sur la déduction de l&apos;IA ;
                    sans choix, l&apos;IA déduit le segment et les enjeux.
                  </p>
                  <Chips label="Segment de marché" options={segments} value={segment} onChange={setSegment} disabled={pending} />
                  <MultiChips label="Enjeux prioritaires" options={enjeux} values={enjeuxSel} onChange={setEnjeuxSel} disabled={pending} />
                  <div style={{ fontSize: 12, color: "var(--graphite)", margin: "6px 0 4px" }}>
                    Offre pour cette exécution (vide : offre de l&apos;organisation)
                  </div>
                  <textarea
                    value={offer}
                    onChange={(e) => setOffer(e.target.value)}
                    disabled={pending}
                    rows={3}
                    maxLength={2000}
                    placeholder="Laisser vide pour utiliser l'offre de Paramètres, Profil commercial."
                    style={{ ...field, marginBottom: 16, resize: "vertical" }}
                  />

                  {error && <p style={{ fontSize: 13, color: "var(--red, #b3261e)", margin: "0 0 12px" }}>{error}</p>}

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button
                      type="button"
                      onClick={close}
                      disabled={pending}
                      style={{ ...field, width: "auto", cursor: "pointer", fontWeight: 600 }}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={launch}
                      disabled={pending || signal.trim().length < 20}
                      style={{
                        background: "var(--steel-deep)",
                        color: "#f5f6f8",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 18px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: pending ? "wait" : "pointer",
                        opacity: pending || signal.trim().length < 20 ? 0.6 : 1,
                      }}
                    >
                      {pending ? "Exécution en cours…" : "Lancer l'exécution"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      background: "var(--steel-tint)",
                      borderRadius: 10,
                      padding: "14px 16px",
                      marginBottom: 16,
                      fontSize: 14,
                    }}
                  >
                    <strong>{done.status === "termine" ? "Exécution terminée" : "Exécution arrêtée"}</strong>
                    <div style={{ marginTop: 4, color: "var(--graphite)" }}>{done.note}</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button
                      type="button"
                      onClick={close}
                      style={{ ...field, width: "auto", cursor: "pointer", fontWeight: 600 }}
                    >
                      Fermer
                    </button>
                    <button
                      type="button"
                      onClick={seeExecution}
                      style={{
                        background: "var(--steel-deep)",
                        color: "#f5f6f8",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 18px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Voir l&apos;exécution
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}