import AppShell from "@/components/AppShell";
import { sql } from "@/lib/db";

const CARD_SHADOW = "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)";

const CATEGORIES = [
  { label: "Tous", count: 24, active: true },
  { label: "Rapports", count: 6, active: false },
  { label: "Documents", count: 5, active: false },
  { label: "Emails", count: 4, active: false },
  { label: "Analyses", count: 3, active: false },
  { label: "Recommandations", count: 3, active: false },
  { label: "Exports", count: 2, active: false },
  { label: "Tâches", count: 1, active: false },
];

function DocIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M6 4H18V20L12 16.5L6 20V4Z" stroke="#2f5a82" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M4 6H20M4 12H20M4 18H14" stroke="#2f5a82" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M4 19L9 9L13 15L16 10L20 19" stroke="#2f5a82" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="#2f5a82" strokeWidth="1.5" />
      <path d="M8 9H16M8 13H13" stroke="#2f5a82" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const ICONS = {
  doc: DocIcon,
  list: ListIcon,
  chart: ChartIcon,
  ticket: TicketIcon,
} as const;

function formatDeliverableDate(date: Date): string {
  const now = new Date();
  const diffDays = Math.floor((now.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays <= 0) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Hier";
  return `${diffDays} j`;
}

export default async function DeliverablesPage() {
  const rows = await sql`
    SELECT d.title, d.agent_label, d.kind, d.version, d.created_at, w.name AS workflow_name
    FROM deliverables d
    LEFT JOIN workflows w ON w.id = d.workflow_id
    ORDER BY d.created_at DESC
  `;
  const deliverables = rows.map((row) => ({
    icon: ICONS[row.kind as keyof typeof ICONS] ?? DocIcon,
    name: row.title as string,
    agent: row.agent_label as string,
    workflow: row.workflow_name as string,
    created: formatDeliverableDate(new Date(row.created_at as string)),
    version: row.version as string,
  }));

  return (
    <AppShell
      topbar={
        <>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>Bibliothèque de livrables</span>
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
            <span style={{ fontSize: 13, color: "var(--graphite)" }}>Rechercher un livrable…</span>
          </div>
        </>
      }
    >
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* CATEGORY RAIL */}
        <div
          style={{
            width: 200,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: 10,
            boxShadow: CARD_SHADOW,
          }}
        >
          {CATEGORIES.map((cat) => (
            <a
              key={cat.label}
              href="#"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "9px 12px",
                borderRadius: 8,
                background: cat.active ? "var(--steel-tint)" : "transparent",
                color: cat.active ? "var(--steel)" : "var(--graphite)",
                fontSize: 13,
                fontWeight: cat.active ? 600 : 400,
              }}
            >
              {cat.label}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{cat.count}</span>
            </a>
          ))}
        </div>

        {/* TABLE */}
        <div
          style={{
            flex: 1,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: CARD_SHADOW,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2.4fr 1.2fr 1fr 1fr 90px",
              gap: 10,
              padding: "12px 20px",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--graphite)",
              borderBottom: "1px solid var(--line)",
              background: "var(--paper)",
            }}
          >
            <span>Livrable</span>
            <span>Agent</span>
            <span>Workflow</span>
            <span>Créé</span>
            <span>Version</span>
          </div>

          {deliverables.map((item, i) => (
            <div
              key={item.name}
              className="deliverable-row"
              style={{
                display: "grid",
                gridTemplateColumns: "2.4fr 1.2fr 1fr 1fr 90px",
                gap: 10,
                padding: "14px 20px",
                fontSize: 13,
                borderBottom: i < deliverables.length - 1 ? "1px solid var(--line)" : "none",
                alignItems: "center",
                transition: "background 0.15s ease",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: "var(--steel-tint)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <item.icon />
                </span>
                <span style={{ fontWeight: 600 }}>{item.name}</span>
              </span>
              <span style={{ color: "var(--graphite)" }}>{item.agent}</span>
              <span style={{ color: "var(--graphite)" }}>{item.workflow}</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--graphite)" }}>{item.created}</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--graphite)" }}>{item.version}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .deliverable-row:hover {
          background: var(--paper);
        }
      `}</style>
    </AppShell>
  );
}