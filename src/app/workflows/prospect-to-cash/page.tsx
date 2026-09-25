import AppShell from "@/components/AppShell";
import { sql } from "@/lib/db";

const NODES = [
  { label: "Prospecting", left: 0, top: 136, width: 105, tone: "default" as const },
  { label: "Lead Capture", left: 140, top: 136, width: 105, tone: "default" as const },
  { label: "Qualification", left: 265, top: 136, width: 105, tone: "default" as const },
  { label: "Sales Strategy", left: 395, top: 136, width: 105, tone: "default" as const },
  { label: "Proposal", left: 525, top: 20, width: 105, tone: "active" as const },
  { label: "Nurturing", left: 525, top: 252, width: 105, tone: "default" as const },
  { label: "Human Approval", left: 655, top: 20, width: 110, tone: "approval" as const },
  { label: "CRM Action", left: 785, top: 136, width: 100, tone: "final" as const },
];

const NODE_STYLES = {
  default: {
    background: "var(--paper)",
    border: "1px solid var(--line)",
    color: "var(--ink)",
    fontWeight: 600,
    fontSize: 11,
  },
  active: {
    background: "var(--steel-tint)",
    border: "1.5px solid var(--steel)",
    color: "var(--steel)",
    fontWeight: 700,
    fontSize: 11,
  },
  approval: {
    background: "#fff",
    border: "1.5px dashed var(--steel)",
    color: "var(--steel)",
    fontWeight: 700,
    fontSize: 10,
  },
  final: {
    background: "var(--steel-deep)",
    border: "none",
    color: "#f5f6f8",
    fontWeight: 700,
    fontSize: 11,
  },
};

const VERSIONS = [
  { label: "v3 — actuelle", detail: "Ajout de l'étape Prospecting · 23 sept", current: true },
  { label: "v2", detail: "Ajout de la branche Nurturing · 14 sept", current: false },
  { label: "v1", detail: "Version initiale · 2 sept", current: false },
];


export default async function ProspectToCashWorkflowPage() {
  const stepRows = await sql`
    SELECT s.label, s.position
    FROM workflow_steps s
    JOIN workflows w ON w.id = s.workflow_id
    WHERE w.slug = 'prospect-to-cash'
    ORDER BY s.position
  `;
  const executionRows = await sql`
    SELECT e.progress_done
    FROM workflow_executions e
    JOIN workflows w ON w.id = e.workflow_id
    WHERE w.slug = 'prospect-to-cash' AND e.status = 'en_cours'
    ORDER BY e.id DESC
    LIMIT 1
  `;
  const progressDone = (executionRows[0]?.progress_done as number) ?? 0;

  const executionMonitor = stepRows.map((row) => {
    const position = row.position as number;
    const state = position < progressDone ? "done" : position === progressDone ? "active" : "pending";
    return {
      label: state === "active" ? `${row.label} — en cours` : (row.label as string),
      state: state as "done" | "active" | "pending",
    };
  });
  return (
    <AppShell
      topbar={
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/workflows" style={{ fontSize: 13, color: "var(--graphite)" }}>
              Workflows /
            </a>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>Prospect to Cash</span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--graphite)",
                border: "1px solid var(--line)",
                padding: "3px 8px",
                borderRadius: 999,
              }}
            >
              v3
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a href="#" style={{ fontSize: 13, fontWeight: 600, color: "var(--graphite)", padding: "8px 12px" }}>
              Journal d&apos;exécution
            </a>
            <a
              href="#"
              style={{
                background: "var(--steel-deep)",
                color: "#f5f6f8",
                fontSize: 13,
                fontWeight: 600,
                padding: "9px 18px",
                borderRadius: 8,
              }}
            >
              ▶ Lancer le workflow
            </a>
          </div>
        </>
      }
    >
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* CANVAS PANEL */}
        <div
          style={{
            flex: "1 1 600px",
            minWidth: 420,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 14,
            padding: 22,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.06em", color: "var(--steel)" }}>
              GRAPHE DU WORKFLOW
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--graphite)" }}>
                <span style={{ width: 14, height: 2, background: "var(--graphite)", display: "inline-block" }} />
                séquence
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--graphite)", marginLeft: 10 }}>
                <span style={{ width: 14, height: 2, background: "var(--steel)", display: "inline-block" }} />
                branche
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--graphite)", marginLeft: 10 }}>
                <span style={{ width: 10, height: 10, border: "1px dashed var(--steel)", display: "inline-block" }} />
                approbation
              </span>
            </div>
          </div>

          <div style={{ position: "relative", width: "100%", maxWidth: 888, margin: "0 auto" }}>
            <svg width="100%" height="auto" viewBox="0 0 888 320" style={{ display: "block" }}>
              <path d="M110 160 L130 160" stroke="#c7ccd4" strokeWidth="1.6" fill="none" />
              <path d="M250 160 L270 160" stroke="#c7ccd4" strokeWidth="1.6" fill="none" />
              <path d="M380 160 L400 160" stroke="#c7ccd4" strokeWidth="1.6" fill="none" />
              <path d="M510 160 C560 160 560 44 530 44" stroke="#2f5a82" strokeWidth="1.6" fill="none" />
              <path d="M510 160 C560 160 560 276 530 276" stroke="#2f5a82" strokeWidth="1.6" fill="none" />
              <path d="M640 44 L660 44" stroke="#c7ccd4" strokeWidth="1.6" strokeDasharray="4 3" fill="none" />
              <path d="M770 44 C810 44 810 160 790 160" stroke="#2f5a82" strokeWidth="1.6" fill="none" />
              <path d="M640 276 C810 276 810 160 790 160" stroke="#2f5a82" strokeWidth="1.6" fill="none" />
              <path d="M118 156L130 160L118 164" fill="#c7ccd4" />
              <path d="M258 156L270 160L258 164" fill="#c7ccd4" />
              <path d="M388 156L400 160L388 164" fill="#c7ccd4" />
              <path d="M785 156L790 160L782 165" fill="#2f5a82" />
            </svg>

            {NODES.map((node) => (
              <div
                key={node.label}
                style={{
                  position: "absolute",
                  left: node.left,
                  top: node.top,
                  width: node.width,
                  height: 46,
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: 4,
                  boxSizing: "border-box",
                  ...NODE_STYLES[node.tone],
                }}
              >
                <span style={{ fontWeight: NODE_STYLES[node.tone].fontWeight, fontSize: NODE_STYLES[node.tone].fontSize, color: NODE_STYLES[node.tone].color }}>
                  {node.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* INSPECTOR */}
        <div style={{ flex: "1 1 340px", minWidth: 300, maxWidth: 380, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 18 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.06em", color: "var(--steel)" }}>
              INSPECTEUR — AGENT SÉLECTIONNÉ
            </span>
            <div style={{ fontWeight: 700, fontSize: 16, margin: "12px 0 4px" }}>Proposal Agent</div>
            <p style={{ fontSize: 12, color: "var(--graphite)", lineHeight: 1.55, margin: "0 0 14px" }}>
              Rédige une proposition commerciale à partir de la stratégie de vente définie en amont.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12 }}>
              <div>
                <div style={{ color: "var(--graphite)", marginBottom: 4 }}>Inputs</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["strategy", "positioning"].map((tag) => (
                    <span key={tag} style={{ fontFamily: "var(--font-mono)", background: "var(--paper)", padding: "3px 8px", borderRadius: 6 }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--graphite)", marginBottom: 4 }}>Outputs</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      background: "var(--steel-tint)",
                      color: "var(--steel)",
                      padding: "3px 8px",
                      borderRadius: 6,
                    }}
                  >
                    proposal_document
                  </span>
                </div>
              </div>
              <div>
                <div style={{ color: "var(--graphite)", marginBottom: 4 }}>Permissions</div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Lire CRM</span>
                  <span style={{ color: "var(--signal)", fontWeight: 600 }}>✓</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Envoyer email</span>
                  <span style={{ color: "var(--amber)", fontWeight: 600 }}>Approbation</span>
                </div>
              </div>
              <div>
                <div style={{ color: "var(--graphite)", marginBottom: 4 }}>Étape suivante</div>
                <div style={{ fontWeight: 600 }}>Human Approval</div>
              </div>
            </div>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 18 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.06em", color: "var(--steel)" }}>
              MAPPING OUTPUT → INPUT
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, fontSize: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: "var(--graphite)", fontSize: 11, marginBottom: 4 }}>Sales Strategy</div>
                <div style={{ background: "var(--paper)", borderRadius: 6, padding: "5px 8px", marginBottom: 4, fontFamily: "var(--font-mono)", fontSize: 11 }}>
                  strategy
                </div>
                <div style={{ background: "var(--paper)", borderRadius: 6, padding: "5px 8px", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                  positioning
                </div>
              </div>
              <svg width="20" height="40" viewBox="0 0 20 40">
                <path d="M2 20H16" stroke="#5b6472" strokeWidth="1.6" />
                <path d="M11 14L17 20L11 26" stroke="#5b6472" strokeWidth="1.6" fill="none" />
              </svg>
              <div style={{ flex: 1 }}>
                <div style={{ color: "var(--graphite)", fontSize: 11, marginBottom: 4 }}>Proposal</div>
                <div
                  style={{
                    background: "var(--steel-tint)",
                    borderRadius: 6,
                    padding: "5px 8px",
                    marginBottom: 4,
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--steel)",
                  }}
                >
                  strategy
                </div>
                <div
                  style={{
                    background: "var(--steel-tint)",
                    borderRadius: 6,
                    padding: "5px 8px",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--steel)",
                  }}
                >
                  positioning
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.06em", color: "var(--steel)" }}>
                VERSIONS
              </span>
              <a href="#" style={{ fontSize: 11, fontWeight: 600, color: "var(--steel)" }}>
                Comparer →
              </a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {VERSIONS.map((v) => (
                <div
                  key={v.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: v.current ? "var(--steel-tint)" : "transparent",
                    borderRadius: 8,
                    padding: "8px 10px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: v.current ? 700 : 600, color: v.current ? "var(--steel)" : "var(--ink)" }}>
                      {v.label}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--graphite)" }}>{v.detail}</div>
                  </div>
                  {!v.current && (
                    <a href="#" style={{ fontSize: 11, fontWeight: 600, color: "var(--steel)" }}>
                      Restaurer
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--steel-deep)", color: "#f5f6f8", borderRadius: 14, padding: 18 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.06em", color: "#9fb4c6" }}>
              MONITEUR D&apos;EXÉCUTION
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 12, fontSize: 12 }}>
              {executionMonitor.map((step) => (
                <div
                  key={step.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: step.state === "active" ? 600 : 400,
                    color: step.state === "pending" ? "#8b93a1" : "#f5f6f8",
                  }}
                >
                  {step.state === "done" && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12L10 17L19 7" stroke="#3e8e6f" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {step.state === "active" && (
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#cfa15b", flexShrink: 0 }} />
                  )}
                  {step.state === "pending" && (
                    <span style={{ width: 9, height: 9, borderRadius: "50%", border: "1px solid #445164", flexShrink: 0 }} />
                  )}
                  {step.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}