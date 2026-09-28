"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";

/* ------------------------------------------------------------------ */
/* Modèle de tarification — INDICATIF, à valider avec Chakib          */
/*                                                                    */
/* Socle (inclus dans les 1 490 MAD) : 3 agents actifs, 1 workflow,   */
/* jusqu'à 200 exécutions / mois.                                     */
/* Au-delà, chaque curseur ajoute son propre coût.                    */
/* Le palier "Cabinet partenaire" bascule en devis (pas de prix live).*/
/* ------------------------------------------------------------------ */

const SOCLE = 1490;
const AGENTS_INCLUS = 3;
const PRIX_AGENT = 280;
const WORKFLOWS_INCLUS = 1;
const PRIX_WORKFLOW = 750;

const VOLUME_OPTIONS = [
  { id: "leger", label: "Léger", sub: "jusqu'à 200 exécutions / mois", addon: 0 },
  { id: "soutenu", label: "Soutenu", sub: "jusqu'à 1 000 exécutions / mois", addon: 400 },
  { id: "intensif", label: "Intensif", sub: "jusqu'à 5 000 exécutions / mois", addon: 1200 },
] as const;

function formatMAD(n: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(n)} MAD`;
}

const CARD_SHADOW = "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)";

const CARD: CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 14,
  padding: 22,
  boxShadow: CARD_SHADOW,
};

const BTN_PRIMARY: CSSProperties = {
  background: "var(--steel-deep)",
  color: "#f5f6f8",
  fontSize: 14,
  fontWeight: 600,
  padding: "13px 22px",
  borderRadius: 9,
  whiteSpace: "nowrap",
  display: "inline-block",
  border: "none",
  cursor: "pointer",
};

const BTN_SECONDARY: CSSProperties = {
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 14,
  fontWeight: 600,
  padding: "13px 22px",
  borderRadius: 9,
  border: "1px solid var(--line)",
  whiteSpace: "nowrap",
  display: "inline-block",
};

function Stepper({
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  suffix: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          border: "1px solid var(--line)",
          background: "var(--paper)",
          fontSize: 18,
          fontWeight: 600,
          color: value <= min ? "var(--line)" : "var(--ink)",
          cursor: value <= min ? "default" : "pointer",
        }}
      >
        −
      </button>
      <div style={{ minWidth: 84, textAlign: "center" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24 }}>{value}</span>
        <div style={{ fontSize: 11.5, color: "var(--graphite)" }}>{suffix}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          border: "1px solid var(--line)",
          background: "var(--paper)",
          fontSize: 18,
          fontWeight: 600,
          color: value >= max ? "var(--line)" : "var(--ink)",
          cursor: value >= max ? "default" : "pointer",
        }}
      >
        +
      </button>
    </div>
  );
}

export default function PricingSimulator() {
  const [agents, setAgents] = useState(AGENTS_INCLUS);
  const [workflows, setWorkflows] = useState(WORKFLOWS_INCLUS);
  const [volume, setVolume] = useState<(typeof VOLUME_OPTIONS)[number]["id"]>("leger");
  const [cabinet, setCabinet] = useState(false);

  const volumeOption = VOLUME_OPTIONS.find((v) => v.id === volume) ?? VOLUME_OPTIONS[0];

  const detail = useMemo(() => {
    const agentsAddon = Math.max(0, agents - AGENTS_INCLUS) * PRIX_AGENT;
    const workflowsAddon = Math.max(0, workflows - WORKFLOWS_INCLUS) * PRIX_WORKFLOW;
    const volumeAddon = volumeOption.addon;
    const total = SOCLE + agentsAddon + workflowsAddon + volumeAddon;
    return { agentsAddon, workflowsAddon, volumeAddon, total };
  }, [agents, workflows, volumeOption]);

  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
      {/* CONTROLES */}
      <div style={{ flex: "2 1 420px", minWidth: 320, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={CARD}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>Agents actifs</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--graphite)" }}>
              {AGENTS_INCLUS} inclus dans le socle
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--graphite)", margin: "0 0 14px" }}>
            Chaque agent au-delà des {AGENTS_INCLUS} inclus : {formatMAD(PRIX_AGENT)} / mois.
          </p>
          <Stepper value={agents} min={1} max={30} onChange={setAgents} suffix="agents" />
        </div>

        <div style={CARD}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>Workflows métier</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--graphite)" }}>
              {WORKFLOWS_INCLUS} inclus dans le socle
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--graphite)", margin: "0 0 14px" }}>
            Chaque workflow bout-en-bout au-delà de celui inclus : {formatMAD(PRIX_WORKFLOW)} / mois.
          </p>
          <Stepper value={workflows} min={0} max={10} onChange={setWorkflows} suffix="workflows" />
        </div>

        <div style={CARD}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>Volume d&apos;exécutions</span>
          <p style={{ fontSize: 12.5, color: "var(--graphite)", margin: "4px 0 14px" }}>
            Nombre d&apos;exécutions d&apos;agents estimé par mois, tous agents confondus.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 10 }}>
            {VOLUME_OPTIONS.map((opt) => {
              const active = opt.id === volume;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setVolume(opt.id)}
                  style={{
                    textAlign: "left",
                    border: active ? "1px solid var(--steel)" : "1px solid var(--line)",
                    background: active ? "var(--steel-tint)" : "var(--paper)",
                    borderRadius: 10,
                    padding: "12px 14px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: active ? "var(--steel-deep)" : "var(--ink)" }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize: 11.5, color: "var(--graphite)" }}>{opt.sub}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: active ? "var(--steel)" : "var(--graphite)" }}>
                    {opt.addon === 0 ? "Inclus" : `+ ${formatMAD(opt.addon)} / mois`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            ...CARD,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>
              Cabinet ou agence partenaire
            </span>
            <p style={{ fontSize: 12.5, color: "var(--graphite)", margin: "4px 0 0", maxWidth: 420 }}>
              Multi-tenant, marque blanche, plusieurs clients gérés depuis un seul compte — tarification sur devis,
              hors simulateur.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCabinet((v) => !v)}
            style={{
              width: 46,
              height: 26,
              borderRadius: 999,
              border: "1px solid var(--line)",
              background: cabinet ? "var(--steel)" : "var(--line-soft)",
              position: "relative",
              cursor: "pointer",
              flexShrink: 0,
            }}
            aria-pressed={cabinet}
          >
            <span
              style={{
                position: "absolute",
                top: 2,
                left: cabinet ? 22 : 2,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 120ms ease",
                boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
              }}
            />
          </button>
        </div>
      </div>

      {/* RESULTAT */}
      <div style={{ flex: "1 1 300px", minWidth: 280, position: "sticky", top: 96 }}>
        <div style={{ ...CARD, border: "1px solid var(--steel)", background: "var(--steel-tint)" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.06em", color: "var(--steel-deep)" }}>
            ESTIMATION MENSUELLE
          </span>

          {cabinet ? (
            <>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, margin: "10px 0 4px", color: "var(--steel-deep)" }}>
                Sur devis
              </div>
              <p style={{ fontSize: 12.5, color: "var(--steel-deep)", margin: "0 0 18px" }}>
                Le palier cabinet dépend du nombre de clients finaux et des intégrations à mettre en place.
              </p>
              <a href="mailto:contact@iachain.ai" style={{ ...BTN_PRIMARY, width: "100%", textAlign: "center" }}>
                Contacter l&apos;agence
              </a>
            </>
          ) : (
            <>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 34, margin: "10px 0 2px", color: "var(--steel-deep)" }}>
                {formatMAD(detail.total)}
              </div>
              <div style={{ fontSize: 12, color: "var(--steel-deep)", marginBottom: 16 }}>HT / mois</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "var(--steel-deep)", paddingTop: 12, borderTop: "1px solid rgba(24,38,53,0.15)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Socle ({AGENTS_INCLUS} agents, {WORKFLOWS_INCLUS} workflow)</span>
                  <span>{formatMAD(SOCLE)}</span>
                </div>
                {detail.agentsAddon > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Agents additionnels</span>
                    <span>+ {formatMAD(detail.agentsAddon)}</span>
                  </div>
                )}
                {detail.workflowsAddon > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Workflows additionnels</span>
                    <span>+ {formatMAD(detail.workflowsAddon)}</span>
                  </div>
                )}
                {detail.volumeAddon > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Volume {volumeOption.label.toLowerCase()}</span>
                    <span>+ {formatMAD(detail.volumeAddon)}</span>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 20 }}>
                <a href="mailto:contact@iachain.ai" style={{ ...BTN_PRIMARY, textAlign: "center" }}>
                  Démarrer avec cette estimation
                </a>
                <Link href="/dashboard" style={{ ...BTN_SECONDARY, textAlign: "center" }}>
                  Ouvrir la démo
                </Link>
              </div>
            </>
          )}
        </div>

        <p style={{ fontSize: 11.5, color: "var(--graphite)", margin: "12px 4px 0", lineHeight: 1.5 }}>
          Estimation indicative, hors taxes, sujette à confirmation lors d&apos;un diagnostic. Pas d&apos;engagement
          en la simulant.
        </p>
      </div>
    </div>
  );
}