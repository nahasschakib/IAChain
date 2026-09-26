"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

export type DetailRow = { k?: string; v: string };
export type DetailBlock = {
  label: string;
  type?: "kv" | "pairs" | "rules";
  rows: DetailRow[];
};
export type NodeDetails = {
  intro?: string;
  blocks?: DetailBlock[];
  note?: string;
  link?: { label: string; href: string };
};
export type RunBanner = {
  title: string;
  tone: "alert" | "info";
  text: string;
  actions: string[];
};
export type SwitchItem = { slug: string; code: string };

export type StudioNode = {
  node_key: string;
  kind: "agent" | "merge" | "approval" | "action" | "condition";
  label: string;
  agent_slug: string | null;
  version: string | null;
  tag: string | null;
  design_note: string | null;
  blurb: string | null;
  row_index: number;
  col_index: number;
  parents: string[];
  mapping: { from: string; to: string }[];
  outputs: string[];
  details: NodeDetails;
  run_state: "done" | "running" | "failed" | "waiting" | "pending";
  run_note: string | null;
  agent_name: string | null;
  agent_code: string | null;
  agent_role: string | null;
};
export type PaletteAgent = { slug: string; name: string; role: string };
export type VersionItem = { label: string; detail: string; current: boolean };

type Mode = "design" | "run";

const W_MIN = 480; // en dessous de cette largeur, le panneau défile horizontalement
const W_MAX = 900; // au-delà, le graphe reste centré
const NODE_H = 76;
const ROW_PITCH = 112;
const PAD = 12;

const panel: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 14,
  padding: 18,
  boxSizing: "border-box",
};
const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--steel)",
};
const sectionLabel: React.CSSProperties = {
  ...mono,
  color: "var(--graphite)",
  marginBottom: 6,
};
const ghostBtn: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "var(--surface)",
  color: "var(--ink)",
  WebkitTextFillColor: "var(--ink)",
  cursor: "pointer",
};
const smallBtn: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  padding: "7px 12px",
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "var(--surface)",
  color: "var(--ink)",
  WebkitTextFillColor: "var(--ink)",
  cursor: "pointer",
  textDecoration: "none",
};

const CONTROL_CHIPS = ["Condition", "Merge", "Approbation", "Fallback"];

const KIND_HEADER: Record<string, string> = {
  merge: "MERGE · JOIN",
  approval: "APPROVAL",
  action: "ACTION",
  condition: "CONDITION",
};

function stateView(n: StudioNode) {
  const t = n.run_note;
  switch (n.run_state) {
    case "done":
      return { text: `✓ ${t ?? "terminé"}`, color: "var(--signal)" };
    case "failed":
      return { text: `⚠ ${t ?? "échec"}`, color: "var(--red)" };
    case "waiting":
      return { text: t ?? "en attente", color: "var(--amber)" };
    case "running":
      return { text: `● ${t ?? "en cours"}`, color: "var(--amber)" };
    default:
      return { text: t ?? "à venir", color: "var(--muted-foreground)" };
  }
}

function DetailBlocks({ details }: { details: NodeDetails }) {
  return (
    <>
      {details.intro && (
        <p
          style={{
            fontSize: 12,
            color: "var(--graphite)",
            lineHeight: 1.55,
            margin: "0 0 14px",
          }}
        >
          {details.intro}
        </p>
      )}

      {(details.blocks ?? []).map((b) => (
        <div key={b.label} style={{ marginBottom: 14 }}>
          <div style={sectionLabel}>{b.label}</div>

          {(b.type === "kv" || !b.type) && (
            <div style={{ display: "grid", gap: 8 }}>
              {b.rows.map((r, i) => (
                <div key={i}>
                  {r.k && (
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "var(--ink)",
                      }}
                    >
                      {r.k}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 12,
                      color: r.k ? "var(--graphite)" : "var(--ink)",
                      lineHeight: 1.5,
                    }}
                  >
                    {r.v}
                  </div>
                </div>
              ))}
            </div>
          )}

          {b.type === "pairs" && (
            <div style={{ display: "grid", gap: 6 }}>
              {b.rows.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    background: "var(--paper)",
                    borderRadius: 6,
                    padding: "6px 10px",
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: "var(--ink)" }}>{r.k}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--steel)",
                    }}
                  >
                    {r.v}
                  </span>
                </div>
              ))}
            </div>
          )}

          {b.type === "rules" && (
            <div style={{ display: "grid", gap: 8 }}>
              {b.rows.map((r, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--paper)",
                    borderRadius: 8,
                    padding: "8px 10px",
                    fontSize: 12,
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        color: "var(--graphite)",
                        marginRight: 6,
                      }}
                    >
                      SI
                    </span>
                    {r.k}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        color: "var(--graphite)",
                        marginRight: 6,
                      }}
                    >
                      ALORS →
                    </span>
                    <strong style={{ color: "var(--steel)" }}>{r.v}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {details.note && (
        <div
          style={{
            background: "var(--steel-tint)",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 12,
            color: "var(--steel)",
            lineHeight: 1.5,
            marginBottom: 14,
          }}
        >
          {details.note}
        </div>
      )}
    </>
  );
}

export default function WorkflowStudio({
  nodes,
  palette,
  versions,
  costEstimate,
  costUnit,
  runLabel,
  runBanner,
  switcher,
  currentSlug,
}: {
  nodes: StudioNode[];
  palette: PaletteAgent[];
  versions: VersionItem[];
  costEstimate: number;
  costUnit: string;
  runLabel: string | null;
  runBanner: RunBanner | null;
  switcher: SwitchItem[];
  currentSlug: string;
}) {
  const [mode, setMode] = useState<Mode>("design");
  const [selectedKey, setSelectedKey] = useState<string>(
    () =>
      (
        nodes.find((n) => n.kind === "condition") ??
        nodes.find((n) => n.mapping.length > 2) ??
        nodes[0]
      )?.node_key ?? "",
  );
  // Largeur du graphe : suit la largeur disponible du panneau
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(W_MAX);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setBoxW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const graphW = Math.min(W_MAX, Math.max(W_MIN, boxW));

  const layout = useMemo(() => {
    const perRow = new Map<number, number>();
    nodes.forEach((n) =>
      perRow.set(n.row_index, (perRow.get(n.row_index) ?? 0) + 1),
    );
    const pos: Record<string, { x: number; y: number; w: number }> = {};
    nodes.forEach((n) => {
      const count = perRow.get(n.row_index) ?? 1;
      const slot = graphW / count;
      const w = Math.min(250, slot - 16);
      pos[n.node_key] = {
        x: slot * n.col_index + slot / 2 - w / 2,
        y: PAD + n.row_index * ROW_PITCH,
        w,
      };
    });
    const maxRow = Math.max(0, ...nodes.map((n) => n.row_index));
    return { pos, height: PAD * 2 + maxRow * ROW_PITCH + NODE_H };
  }, [nodes, graphW]);

  const edges = useMemo(() => {
    const out: { key: string; d: string }[] = [];
    nodes.forEach((n) =>
      n.parents.forEach((p) => {
        const from = layout.pos[p];
        const to = layout.pos[n.node_key];
        if (!from || !to) return;
        const x1 = from.x + from.w / 2;
        const y1 = from.y + NODE_H;
        const x2 = to.x + to.w / 2;
        const y2 = to.y;
        const mid = y1 + (y2 - y1) / 2;
        out.push({
          key: `${p}-${n.node_key}`,
          d: `M ${x1} ${y1} L ${x1} ${mid} L ${x2} ${mid} L ${x2} ${y2}`,
        });
      }),
    );
    return out;
  }, [nodes, layout]);

  const selected = nodes.find((n) => n.node_key === selectedKey) ?? nodes[0];
  const cost = costEstimate.toFixed(2).replace(".", ",");
  const showsIO =
    selected && (selected.kind === "agent" || selected.kind === "action");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* BARRE D'OUTILS */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {/* Navigation entre workflows */}
          <div
            style={{
              display: "inline-flex",
              border: "1px solid var(--line)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {switcher.map((w) => (
              <Link
                key={w.slug}
                href={`/workflows/${w.slug}`}
                style={{
                  padding: "8px 12px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  background:
                    w.slug === currentSlug ? "var(--paper)" : "var(--surface)",
                  fontWeight: w.slug === currentSlug ? 700 : 400,
                  color: "var(--ink)",
                  borderRight: "1px solid var(--line)",
                }}
              >
                {w.code}
              </Link>
            ))}
          </div>

          <div
            style={{
              display: "inline-flex",
              border: "1px solid var(--line)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {(
              [
                ["design", "Conception"],
                ["run", "Exécution"],
              ] as [Mode, string][]
            ).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background:
                    mode === m ? "var(--steel-deep)" : "var(--surface)",
                  color: mode === m ? "#f5f6f8" : "var(--ink)",
                  WebkitTextFillColor: mode === m ? "#f5f6f8" : "var(--ink)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--graphite)",
              border: "1px solid var(--line)",
              padding: "4px 10px",
              borderRadius: 999,
            }}
          >
            {mode === "design"
              ? "brouillon"
              : `run ${runLabel ?? "#—"} · en cours`}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--graphite)",
            }}
          >
            Coût estimé ≈ {cost} MAD / {costUnit}
          </span>
          {/* Simulation : affiche l'état d'un run d'exemple. À remplacer par l'appel au moteur d'exécution. */}
          <button onClick={() => setMode("run")} style={ghostBtn}>
            Simuler
          </button>
          <button
            disabled
            title="Bientôt disponible"
            style={{
              ...ghostBtn,
              background: "var(--steel-deep)",
              color: "#f5f6f8",
              WebkitTextFillColor: "#f5f6f8",
              border: "none",
              opacity: 0.5,
              cursor: "not-allowed",
            }}
          >
            Publier
          </button>
        </div>
      </div>

      {/* PALETTE */}
      <div
        style={{
          ...panel,
          padding: "12px 16px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ ...mono, marginRight: 4 }}>Palette</span>
        {palette.map((a) => (
          <span
            key={a.slug}
            title="Glisser-déposer : bientôt disponible"
            style={{
              fontSize: 12,
              padding: "5px 10px",
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: "var(--paper)",
              color: "var(--ink)",
            }}
          >
            {a.name} · {a.role}
          </span>
        ))}
        <span
          style={{
            width: 1,
            height: 18,
            background: "var(--line)",
            margin: "0 4px",
          }}
        />
        {CONTROL_CHIPS.map((c) => (
          <span
            key={c}
            title="Glisser-déposer : bientôt disponible"
            style={{
              fontSize: 12,
              padding: "5px 10px",
              borderRadius: 8,
              border: "1px dashed var(--steel)",
              color: "var(--ink)",
            }}
          >
            {c}
          </span>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 20,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {/* GRAPHE */}
        <div
          style={{
            ...panel,
            flex: "1 1 560px",
            minWidth: 0,
            overflowX: "auto",
          }}
        >
          <div style={{ ...mono, marginBottom: 14 }}>Graphe du workflow</div>
          <div ref={boxRef} style={{ width: "100%" }}>
            <div
              style={{
                position: "relative",
                width: graphW,
                height: layout.height,
                margin: "0 auto",
              }}
            >
              <svg
                width={graphW}
                height={layout.height}
                style={{ position: "absolute", inset: 0 }}
              >
                {edges.map((e) => (
                  <path
                    key={e.key}
                    d={e.d}
                    stroke="#c7ccd4"
                    strokeWidth="1.6"
                    fill="none"
                  />
                ))}
              </svg>

              {nodes.map((n) => {
                const p = layout.pos[n.node_key];
                const isSel = n.node_key === selected?.node_key;
                const dashed =
                  n.kind === "merge" ||
                  n.kind === "approval" ||
                  n.kind === "condition";
                const dark = n.kind === "action";
                const sv = stateView(n);
                const rightTag = n.version ?? n.tag;
                const sub =
                  mode === "run" ? sv.text : (n.design_note ?? "conçu");
                return (
                  <button
                    key={n.node_key}
                    onClick={() => setSelectedKey(n.node_key)}
                    style={{
                      position: "absolute",
                      left: p.x,
                      top: p.y,
                      width: p.w,
                      height: NODE_H,
                      boxSizing: "border-box",
                      textAlign: "left",
                      padding: "8px 12px",
                      borderRadius: 10,
                      cursor: "pointer",
                      font: "inherit",
                      background: dark
                        ? "var(--steel-deep)"
                        : isSel
                          ? "var(--steel-tint)"
                          : "var(--surface)",
                      border: dashed
                        ? "1.5px dashed var(--steel)"
                        : isSel
                          ? "1.5px solid var(--steel-deep)"
                          : "1px solid var(--line)",
                      boxShadow: isSel
                        ? "0 2px 8px rgba(15, 23, 42, 0.12)"
                        : "none",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: 3,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        title={n.label}
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          lineHeight: 1.2,
                          color: dark ? "#f5f6f8" : "var(--ink)",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {n.label}
                      </span>
                      {rightTag && (
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 10,
                            color: dark ? "#9fb4c6" : "var(--graphite)",
                            flexShrink: 0,
                          }}
                        >
                          {rightTag}
                        </span>
                      )}
                    </div>
                    <span
                      title={sub}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color:
                          mode === "run"
                            ? sv.color
                            : dark
                              ? "#9fb4c6"
                              : "var(--muted-foreground)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : bandeau d'exécution, inspecteur, versions */}
        <div
          style={{
            flex: "1 1 340px",
            minWidth: 300,
            maxWidth: 380,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {mode === "run" && runBanner && (
            <div
              style={{
                ...panel,
                borderLeft: `3px solid ${runBanner.tone === "alert" ? "var(--red)" : "var(--amber)"}`,
              }}
            >
              <div
                style={{
                  ...mono,
                  color:
                    runBanner.tone === "alert" ? "var(--red)" : "var(--amber)",
                }}
              >
                {runBanner.title}
              </div>
              <p
                style={{
                  fontSize: 12.5,
                  color: "var(--ink)",
                  lineHeight: 1.55,
                  margin: "8px 0 12px",
                }}
              >
                {runBanner.text}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {runBanner.actions.map((a) =>
                  a.startsWith("Ouvrir") ? (
                    <Link key={a} href="/approvals" style={smallBtn}>
                      {a}
                    </Link>
                  ) : (
                    <button
                      key={a}
                      disabled
                      title="Bientôt disponible"
                      style={{
                        ...smallBtn,
                        opacity: 0.5,
                        cursor: "not-allowed",
                      }}
                    >
                      {a}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          {selected && (
            <div style={panel}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <span style={mono}>Inspecteur</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--graphite)",
                  }}
                >
                  {selected.kind === "agent"
                    ? `AGENT · ${selected.agent_code ?? "—"}`
                    : KIND_HEADER[selected.kind]}
                </span>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 18,
                  margin: "12px 0 4px",
                }}
              >
                {selected.label}
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--graphite)",
                  lineHeight: 1.55,
                  margin: "0 0 14px",
                }}
              >
                {selected.blurb ??
                  (selected.kind === "agent" && selected.agent_name
                    ? `${selected.agent_name} — ${selected.agent_role ?? ""}`
                    : "")}
              </p>

              {mode === "run" && (
                <div
                  style={{
                    fontSize: 12,
                    marginBottom: 14,
                    color: stateView(selected).color,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {stateView(selected).text}
                </div>
              )}

              <DetailBlocks details={selected.details ?? {}} />

              {showsIO && (
                <>
                  <div style={sectionLabel}>Mapping entrée ← amont</div>
                  {selected.mapping.length === 0 ? (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--muted-foreground)",
                        marginBottom: 14,
                      }}
                    >
                      Mapping à définir.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 6, marginBottom: 14 }}>
                      {selected.mapping.map((m) => (
                        <div
                          key={m.from + m.to}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto 1fr",
                            gap: 8,
                            background: "var(--paper)",
                            borderRadius: 6,
                            padding: "6px 10px",
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                          }}
                        >
                          <span>{m.from}</span>
                          <span style={{ color: "var(--graphite)" }}>→</span>
                          <span
                            style={{
                              color: "var(--steel)",
                              textAlign: "right",
                            }}
                          >
                            {m.to}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={sectionLabel}>Sortie publiée</div>
                  {selected.outputs.length === 0 ? (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--muted-foreground)",
                        marginBottom: 14,
                      }}
                    >
                      Sorties définies par le contrat de l&apos;agent.
                    </div>
                  ) : (
                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        margin: "0 0 14px",
                        display: "grid",
                        gap: 4,
                      }}
                    >
                      {selected.outputs.map((o) => (
                        <li
                          key={o}
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                          }}
                        >
                          · {o}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              {selected.details?.link && (
                <Link
                  href={selected.details.link.href}
                  style={{
                    display: "block",
                    textAlign: "center",
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--line)",
                    color: "var(--ink)",
                  }}
                >
                  {selected.details.link.label}
                </Link>
              )}

              {selected.kind === "agent" && selected.agent_slug && (
                <Link
                  href={`/agents/${selected.agent_slug}`}
                  style={{
                    display: "block",
                    textAlign: "center",
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--line)",
                    color: "var(--ink)",
                  }}
                >
                  Ouvrir le studio de cet agent →
                </Link>
              )}
            </div>
          )}

          {versions.length > 0 && (
            <div style={panel}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <span style={mono}>Versions</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--steel)",
                  }}
                >
                  Comparer →
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {versions.map((v) => (
                  <div
                    key={v.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: v.current
                        ? "var(--steel-tint)"
                        : "transparent",
                      borderRadius: 8,
                      padding: "8px 10px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: v.current ? 700 : 600,
                          color: v.current ? "var(--steel)" : "var(--ink)",
                        }}
                      >
                        {v.label}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--graphite)" }}>
                        {v.detail}
                      </div>
                    </div>
                    {!v.current && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--steel)",
                        }}
                      >
                        Restaurer
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
