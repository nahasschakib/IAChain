import AppShell from "@/components/AppShell";
import { sql } from "@/lib/db";

const CARD_SHADOW = "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)";
const CARD_SHADOW_HOVER = "0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.05)";

function formatDate(date: Date): string {
  const now = new Date();
  const diffDays = Math.floor(
    (now.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86400000,
  );
  if (diffDays <= 0)
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  if (diffDays === 1) return "Hier";
  return `${diffDays} j`;
}

export default async function TasksPage() {
  const rows = await sql`
    SELECT a.title, a.detail, a.agent_label, a.created_at
    FROM approvals a
    WHERE a.status = 'en_attente'
    ORDER BY a.created_at DESC
  `;

  const tasks = rows.map((row) => ({
    title: row.title as string,
    detail: row.detail as string,
    agent: row.agent_label as string,
    created: formatDate(new Date(row.created_at as string)),
  }));

  return (
    <AppShell
      topbar={
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          Tâches en attente
        </span>
      }
    >
      <style>{`
        .task-row {
          transition: box-shadow 0.15s ease, transform 0.15s ease;
        }
        .task-row:hover {
          box-shadow: ${CARD_SHADOW_HOVER};
          transform: translateY(-1px);
        }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {tasks.length === 0 && (
          <div
            style={{
              color: "var(--graphite)",
              fontSize: 13,
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 14,
              padding: "16px 22px",
              boxShadow: CARD_SHADOW,
            }}
          >
            Aucune tâche en attente.
          </div>
        )}
        {tasks.map((task, i) => (
          <div
            key={`${task.title}-${i}`}
            className="task-row"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 14,
              padding: "16px 22px",
              boxShadow: CARD_SHADOW,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: "rgba(184,128,47,0.12)",
                  color: "var(--amber)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M12 7v5l3.2 2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 15,
                    marginBottom: 3,
                  }}
                >
                  {task.title}
                </div>
                <div style={{ fontSize: 12, color: "var(--graphite)" }}>
                  {task.detail}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  color: "var(--graphite)",
                  background: "var(--paper)",
                  border: "1px solid var(--line)",
                  borderRadius: 20,
                  padding: "3px 10px",
                }}
              >
                {task.agent}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  color: "var(--graphite)",
                  minWidth: 40,
                  textAlign: "right",
                }}
              >
                {task.created}
              </span>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}