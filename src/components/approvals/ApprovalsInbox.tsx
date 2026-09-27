"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

const CARD_SHADOW = "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)";
const CARD_SHADOW_ELEVATED = "0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.05)";

export type ApprovalPayload = {
  ref?: string;
  owner?: string;
  source?: string;
  aiReco?: string;
  chips?: string[];
  extractTitle?: string;
  extract?: string;
  email?: { to: string; subject: string; body: string };
  props?: { k: string; v: string }[];
  lineage?: string[];
  actions?: string[];
};

export type PendingItem = {
  id: number;
  tag: string;
  time: string;
  title: string;
  subtitle: string;
  agentLabel: string;
  workflowName: string;
  sla: { label: string; late: boolean } | null;
  payload: ApprovalPayload | null;
};

export type HistoryItem = { title: string; status: string; tone: "signal" | "red" };

const DEFAULT_ACTIONS = ["Rejeter", "Modifier", "Approuver"];

const MONO_LABEL: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  letterSpacing: "0.06em",
  color: "var(--graphite)",
};

export default function ApprovalsInbox({
  pending,
  history,
}: {
  pending: PendingItem[];
  history: HistoryItem[];
}) {
  const [selectedId, setSelectedId] = useState<number | null>(pending[0]?.id ?? null);
  const selected = pending.find((p) => p.id === selectedId) ?? pending[0];
  const payload = selected?.payload ?? null;

  const actions = payload?.actions?.length ? payload.actions : DEFAULT_ACTIONS;
  const primaryAction = actions[actions.length - 1];
  const otherActions = actions.slice(0, -1);
  const chips = payload?.chips ?? [];

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
      {/* LIST */}
      <div style={{ flex: "1 1 380px", minWidth: 320, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 8, fontSize: 13, fontWeight: 600 }}>
          <span
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              background: "var(--steel-deep)",
              color: "#f5f6f8",
              boxShadow: "0 2px 6px rgba(15, 23, 42, 0.15)",
            }}
          >
            {`En attente · ${pending.length}`}
          </span>
          <span style={{ padding: "8px 14px", borderRadius: 999, color: "var(--graphite)", cursor: "pointer" }}>
            Traitées
          </span>
        </div>

        {pending.length === 0 && (
          <div style={{ fontSize: 13, color: "var(--graphite)", padding: 16 }}>Aucune approbation en attente.</div>
        )}

        {pending.map((item) => {
          const active = item.id === selected?.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              style={{
                textAlign: "left",
                font: "inherit",
                color: "inherit",
                background: "var(--surface)",
                border: active ? "2px solid var(--steel)" : "1px solid var(--line)",
                borderRadius: 12,
                padding: active ? 15 : 16,
                cursor: "pointer",
                boxShadow: active ? CARD_SHADOW_ELEVATED : CARD_SHADOW,
                transition: "box-shadow 0.18s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: active ? "var(--steel-tint)" : "var(--paper)",
                    color: active ? "var(--steel)" : "var(--graphite)",
                    padding: "3px 9px",
                    borderRadius: 999,
                  }}
                >
                  {item.tag}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--graphite)" }}>
                  {item.time}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "var(--graphite)", marginTop: 3 }}>{item.subtitle}</div>
            </button>
          );
        })}
      </div>

      {/* DETAIL */}
      <div
        style={{
          flex: "1.4 1 480px",
          minWidth: 360,
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 14,
          padding: 24,
          boxSizing: "border-box",
          boxShadow: CARD_SHADOW,
        }}
      >
        {selected ? (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.06em", color: "var(--steel)" }}>
                {`DEMANDE D'APPROBATION${payload?.ref ? ` · ${payload.ref}` : ""}`}
              </span>
              <span
                style={{
                  fontSize: 11,
                  background: "var(--steel-tint)",
                  color: "var(--steel)",
                  padding: "3px 9px",
                  borderRadius: 999,
                  fontWeight: 600,
                }}
              >
                {selected.tag} requis
              </span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, margin: "10px 0 4px" }}>
              {selected.title}
            </div>
            <div style={{ fontSize: 12, color: "var(--graphite)", marginBottom: 18 }}>
              {payload?.source ?? `Proposé par Agent ${selected.agentLabel} · Workflow ${selected.workflowName}`}
            </div>

            {(selected.sla || chips.length > 0) && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
                {selected.sla && (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      background: "var(--paper)",
                      border: `1px solid ${selected.sla.late ? "var(--red)" : "var(--line)"}`,
                      color: selected.sla.late ? "var(--red)" : "inherit",
                      padding: "4px 9px",
                      borderRadius: 6,
                    }}
                  >
                    {`SLA ${selected.sla.label}`}
                  </span>
                )}
                {chips.map((chip) => (
                  <span
                    key={chip}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      background: "var(--paper)",
                      border: "1px solid var(--line)",
                      padding: "4px 9px",
                      borderRadius: 6,
                    }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            )}

            {payload?.aiReco && (
              <div
                style={{
                  background: "var(--steel-tint)",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  marginBottom: 14,
                }}
              >
                <div style={{ ...MONO_LABEL, color: "var(--steel)", marginBottom: 6 }}>RECOMMANDATION DE L&apos;AGENT</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{payload.aiReco}</div>
              </div>
            )}

            {payload?.email && (
              <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, padding: 16, marginBottom: 18 }}>
                <div style={{ fontSize: 11, color: "var(--graphite)", marginBottom: 10 }}>Aperçu de l&apos;email à envoyer</div>
                <div style={{ fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "var(--graphite)" }}>À :</span> {payload.email.to}
                </div>
                <div style={{ fontSize: 12, marginBottom: 10 }}>
                  <span style={{ color: "var(--graphite)" }}>Objet :</span> {payload.email.subject}
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, color: "var(--ink)" }}>{payload.email.body}</p>
              </div>
            )}

            {payload?.extract && (
              <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, padding: 16, marginBottom: 18 }}>
                {payload.extractTitle && (
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{payload.extractTitle}</div>
                )}
                <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, color: "var(--ink)" }}>{payload.extract}</p>
              </div>
            )}

            {payload?.props && payload.props.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "12px 20px",
                  marginBottom: 18,
                }}
              >
                {payload.props.map((p) => (
                  <div key={p.k}>
                    <div style={{ fontSize: 11, color: "var(--graphite)", marginBottom: 2 }}>{p.k}</div>
                    <div style={{ fontSize: 13 }}>{p.v}</div>
                  </div>
                ))}
              </div>
            )}

            {payload?.lineage && payload.lineage.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ ...MONO_LABEL, marginBottom: 8 }}>CHAÎNE DE DÉCISION</div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                  {payload.lineage.map((step, i) => (
                    <span key={step} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          fontSize: 11.5,
                          background: "var(--paper)",
                          border: "1px solid var(--line)",
                          padding: "3px 8px",
                          borderRadius: 6,
                        }}
                      >
                        {step}
                      </span>
                      {i < payload.lineage!.length - 1 && <span style={{ color: "var(--graphite)" }}>→</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {otherActions.map((label) => (
                <button
                  key={label}
                  type="button"
                  style={{
                    font: "inherit",
                    fontSize: 13,
                    fontWeight: 600,
                    color: label === "Rejeter" ? "var(--red)" : "inherit",
                    background: "transparent",
                    border: "1px solid var(--line)",
                    padding: "10px 18px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                style={{
                  font: "inherit",
                  fontSize: 13,
                  fontWeight: 700,
                  background: "var(--steel-deep)",
                  color: "#f5f6f8",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 8,
                  marginLeft: "auto",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.18)",
                }}
              >
                {primaryAction}
              </button>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: "var(--graphite)" }}>Sélectionne une demande pour voir son détail.</div>
        )}

        <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
          <span style={MONO_LABEL}>HISTORIQUE RÉCENT</span>
          {history.map((item, i) => (
            <div
              key={`${item.title}-${i}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                padding: "10px 0",
                borderBottom: i < history.length - 1 ? "1px solid var(--line)" : "none",
              }}
            >
              <span>{item.title}</span>
              <span style={{ color: `var(--${item.tone})` }}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}