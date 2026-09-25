import Link from "next/link";
import AppShell from "@/components/AppShell";
import { sql } from "@/lib/db";

const CARD_SHADOW = "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)";
const CARD_SHADOW_HOVER = "0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.05)";

export default async function WorkflowsPage() {
  const rows = await sql`
    SELECT w.slug, w.name, w.version, w.status,
      COUNT(e.id) FILTER (WHERE e.status = 'en_cours') AS active_count
    FROM workflows w
    LEFT JOIN workflow_executions e ON e.workflow_id = w.id
    GROUP BY w.id, w.slug, w.name, w.version, w.status
    ORDER BY w.id
  `;

  const workflows = rows.map((row) => ({
    slug: row.slug as string,
    name: row.name as string,
    version: row.version as string,
    active: row.status === "actif",
    activeCount: Number(row.active_count),
  }));

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
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {workflows.map((wf) => (
          <Link
            key={wf.slug}
            href={`/workflows/${wf.slug}`}
            className="workflow-row"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 14,
              padding: "18px 24px",
              textDecoration: "none",
              color: "inherit",
              boxShadow: CARD_SHADOW,
              transition: "box-shadow 0.18s ease, transform 0.18s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, var(--steel-tint), var(--steel-deep, #3d5f80))",
                  color: "var(--steel-strong, #2f4a63)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                  <circle cx="5" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="5" cy="18" r="2.4" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="19" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M7.3 7L16.7 11M7.3 17L16.7 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>{wf.name}</div>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 4,
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                    color: "var(--graphite)",
                    background: "var(--paper)",
                    border: "1px solid var(--line)",
                    borderRadius: 5,
                    padding: "1px 6px",
                  }}
                >
                  {wf.version}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  color: wf.active ? "var(--signal)" : "var(--graphite)",
                  background: wf.active ? "rgba(90,140,110,0.12)" : "var(--paper)",
                  border: `1px solid ${wf.active ? "var(--signal)" : "var(--line)"}`,
                  borderRadius: 20,
                  padding: "4px 10px",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: wf.active ? "var(--signal)" : "var(--graphite)" }} />
                {wf.activeCount} en cours
              </span>
              <span style={{ fontSize: 16, color: "var(--graphite)" }}>→</span>
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        .workflow-row:hover {
          box-shadow: ${CARD_SHADOW_HOVER};
          transform: translateY(-1px);
        }
      `}</style>
    </AppShell>
  );
}