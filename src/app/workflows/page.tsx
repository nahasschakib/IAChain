import Link from "next/link";
import AppShell from "@/components/AppShell";
import { sql } from "@/lib/db";

const CARD_SHADOW = "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)";
const CARD_SHADOW_HOVER = "0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.05)";

function plural(n: number, one: string, many: string) {
  return `${n} ${n > 1 ? many : one}`;
}

export default async function WorkflowsPage() {
    const rows = await sql`
    SELECT w.slug, w.name, w.version, w.status, w.code, w.description, w.chain,
      w.node_count, w.merge_count, w.approval_count, w.studio_ready, w.sort_order,
      COUNT(e.id) FILTER (WHERE e.status = 'en_cours') AS active_count,
      (SELECT COUNT(*) FROM workflow_nodes n
         WHERE n.workflow_slug = w.slug) AS n_nodes,
      (SELECT COUNT(*) FROM workflow_nodes n
         WHERE n.workflow_slug = w.slug AND n.kind = 'merge') AS n_merges,
      (SELECT COUNT(*) FROM workflow_nodes n
         WHERE n.workflow_slug = w.slug AND n.kind = 'condition') AS n_conditions,
      (SELECT COUNT(*) FROM workflow_nodes n
         WHERE n.workflow_slug = w.slug AND n.kind = 'approval'
           AND n.label ILIKE '%scalade%') AS n_escalations,
      (SELECT COUNT(*) FROM workflow_nodes n
         WHERE n.workflow_slug = w.slug AND n.kind = 'approval'
           AND n.label NOT ILIKE '%scalade%') AS n_approvals
    FROM workflows w
    LEFT JOIN workflow_executions e ON e.workflow_id = w.id
    GROUP BY w.id, w.slug, w.name, w.version, w.status, w.code, w.description, w.chain,
      w.node_count, w.merge_count, w.approval_count, w.studio_ready, w.sort_order
    ORDER BY w.sort_order NULLS LAST, w.id
  `;

  const workflows = rows.map((row) => {
     const total = Number(row.n_nodes ?? 0);
    const nodes = total > 0 ? total : Number(row.node_count ?? 0);
    const hasGraph = total > 0;
        const merges = hasGraph
      ? Number(row.n_conditions) > 0
        ? 0 // la fusion est implicite après une condition (comme dans le canvas)
        : Number(row.n_merges)
      : Number(row.merge_count ?? 0);
    const approvals = hasGraph ? Number(row.n_approvals) : Number(row.approval_count ?? 0);
    const conditions = hasGraph ? Number(row.n_conditions) : 0;
    const escalations = hasGraph ? Number(row.n_escalations) : 0;
    const meta = [
      nodes > 0 ? plural(nodes, "nœud", "nœuds") : null,
      merges > 0 ? plural(merges, "fusion", "fusions") : null,
      conditions > 0 ? plural(conditions, "condition", "conditions") : null,
      approvals > 0 ? plural(approvals, "approbation", "approbations") : null,
      escalations > 0 ? plural(escalations, "escalade", "escalades") : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return {
      slug: row.slug as string,
      name: row.name as string,
      version: row.version as string,
      active: row.status === "actif",
      code: (row.code as string | null) ?? "",
      description: (row.description as string | null) ?? "",
      chain: Array.isArray(row.chain) ? (row.chain as string[]) : [],
      meta,
      studioReady: Boolean(row.studio_ready),
      activeCount: Number(row.active_count),
    };
  });

  return (
    <AppShell
      topbar={
        <>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>Workflows</span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 9,
              padding: "8px 14px",
              width: 280,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="#5b6472" strokeWidth="1.6" />
              <path d="M20 20L16.5 16.5" stroke="#5b6472" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 13, color: "var(--graphite)" }}>Rechercher un workflow…</span>
          </div>
        </>
      }
    >
      <header style={{ marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid var(--line)" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--graphite)",
            marginBottom: 10,
          }}
        >
          Formule 2 · workflows métier
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: "-0.01em",
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          Processus complets, plusieurs agents en chaîne
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--graphite)", maxWidth: 640, margin: "12px 0 0" }}>
          Un workflow n&apos;est pas une liste d&apos;agents : la sortie de chacun est l&apos;entrée du suivant, avec mapping
          explicite, fusion de branches, approbation humaine et action métier finale.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        {workflows.map((wf) => {
          const cardStyle: React.CSSProperties = {
            display: "flex",
            flexDirection: "column",
            gap: 16,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 4,
            padding: "22px 24px 0",
            textDecoration: "none",
            color: "inherit",
            boxShadow: CARD_SHADOW,
            transition: "box-shadow 0.18s ease, transform 0.18s ease",
          };

          const content = (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--steel-strong, #2f4a63)",
                  }}
                >
                  {wf.code}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--graphite)" }}>
                  {wf.version} · {wf.active ? "actif" : "inactif"}
                </span>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, letterSpacing: "-0.01em" }}>
                  {wf.name}
                </div>
                <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--graphite)", margin: 0 }}>{wf.description}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignContent: "flex-start" }}>
                  {wf.chain.map((step, i) => (
                    <span
                      key={`${step}-${i}`}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11.5,
                        color: "var(--graphite)",
                        background: "var(--paper)",
                        border: "1px solid var(--line)",
                        padding: "3px 8px",
                      }}
                    >
                      {step}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  borderTop: "1px solid var(--line)",
                  padding: "14px 0 16px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 12.5, color: "var(--graphite)" }}>{wf.meta}</span>
                  {wf.activeCount > 0 && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 11,
                        fontFamily: "var(--font-mono)",
                        color: "var(--signal)",
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--signal)" }} />
                      {wf.activeCount} en cours
                    </span>
                  )}
                </div>
                <span
                  title={wf.studioReady ? undefined : "Studio bientôt disponible"}
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: wf.studioReady ? "var(--steel-strong, #2f4a63)" : "var(--graphite)",
                    opacity: wf.studioReady ? 1 : 0.55,
                  }}
                >
                  {wf.studioReady ? "Ouvrir le studio →" : "Aperçu →"}
                </span>
              </div>
            </>
          );

          return wf.studioReady ? (
            <Link key={wf.slug} href={`/workflows/${wf.slug}`} className="workflow-card is-link" style={cardStyle}>
              {content}
            </Link>
          ) : (
            <div key={wf.slug} className="workflow-card" style={{ ...cardStyle, cursor: "default" }}>
              {content}
            </div>
          );
        })}
      </div>

      <style>{`
        .workflow-card.is-link:hover {
          box-shadow: ${CARD_SHADOW_HOVER};
          transform: translateY(-1px);
        }
      `}</style>
    </AppShell>
  );
}