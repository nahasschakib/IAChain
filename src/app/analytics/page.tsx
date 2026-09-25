import AppShell from "@/components/AppShell";
import { sql } from "@/lib/db";

const CARD_SHADOW = "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)";
const ICON_BADGE_BG = "linear-gradient(135deg, var(--steel-tint), #cddce7)";

export default async function AnalyticsPage() {
  const [activityByDay, approvalStats, deliverablesByKind] = await Promise.all([
    sql`
      SELECT to_char(created_at, 'DD/MM') AS day, COUNT(*) AS total
      FROM activity_log
      WHERE created_at >= now() - interval '7 days'
      GROUP BY to_char(created_at, 'DD/MM'), date_trunc('day', created_at)
      ORDER BY date_trunc('day', created_at)
    `,
    sql`
      SELECT status, COUNT(*) AS total
      FROM approvals
      WHERE status IN ('approuve', 'rejete')
      GROUP BY status
    `,
    sql`
      SELECT kind, COUNT(*) AS total
      FROM deliverables
      GROUP BY kind
    `,
  ]);

  const activity = activityByDay.map((r) => ({
    day: r.day as string,
    total: Number(r.total),
  }));
  const approved = Number(
    approvalStats.find((r) => r.status === "approuve")?.total ?? 0,
  );
  const rejected = Number(
    approvalStats.find((r) => r.status === "rejete")?.total ?? 0,
  );
  const kinds = deliverablesByKind.map((r) => ({
    kind: r.kind as string,
    total: Number(r.total),
  }));
  const maxActivity = Math.max(1, ...activity.map((a) => a.total));

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
          Analytics
        </span>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* ACTIVITÉ 7 JOURS */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 14,
            padding: 22,
            boxShadow: CARD_SHADOW,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: ICON_BADGE_BG,
                color: "var(--steel)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 19V13M10 19V9M16 19V5M22 19V11"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              Activité (7 derniers jours)
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 10,
              height: 110,
            }}
          >
            {activity.map((a) => (
              <div
                key={a.day}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                  }}
                >
                  {a.total}
                </span>
                <div
                  style={{
                    width: "100%",
                    height: `${(a.total / maxActivity) * 60}px`,
                    background: "linear-gradient(180deg, var(--steel), var(--steel-deep))",
                    borderRadius: "4px 4px 2px 2px",
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.15)",
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--graphite)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {a.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          {/* APPROBATIONS */}
          <div
            style={{
              flex: 1,
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 14,
              padding: 22,
              boxShadow: CARD_SHADOW,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: ICON_BADGE_BG,
                  color: "var(--steel)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                Approbations traitées
              </span>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              <div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: "var(--signal)",
                  }}
                >
                  {approved}
                </div>
                <div style={{ fontSize: 12, color: "var(--graphite)" }}>
                  Approuvées
                </div>
              </div>
              <div>
                <div
                  style={{ fontSize: 28, fontWeight: 700, color: "var(--red)" }}
                >
                  {rejected}
                </div>
                <div style={{ fontSize: 12, color: "var(--graphite)" }}>
                  Rejetées
                </div>
              </div>
            </div>
          </div>

          {/* LIVRABLES PAR TYPE */}
          <div
            style={{
              flex: 1,
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 14,
              padding: 22,
              boxShadow: CARD_SHADOW,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: ICON_BADGE_BG,
                  color: "var(--steel)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="4"
                    y="4"
                    width="7"
                    height="7"
                    rx="1.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <rect
                    x="13"
                    y="4"
                    width="7"
                    height="7"
                    rx="1.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <rect
                    x="4"
                    y="13"
                    width="7"
                    height="7"
                    rx="1.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <rect
                    x="13"
                    y="13"
                    width="7"
                    height="7"
                    rx="1.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                Livrables par type
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {kinds.map((k) => (
                <div
                  key={k.kind}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                  }}
                >
                  <span
                    style={{
                      color: "var(--graphite)",
                      textTransform: "capitalize",
                    }}
                  >
                    {k.kind}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>
                    {k.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}