import AppShell from "@/components/AppShell";
import { sql } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant";

const CARD_SHADOW = "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)";
const ICON_BADGE_BG = "linear-gradient(135deg, var(--steel-tint), #cddce7)";

function formatMAD(n: number, digits = 3): string {
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n)} MAD`;
}

function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
}

export default async function AnalyticsPage() {
  const { orgId } = await getTenantContext();
    const [activityByDay, approvalStats, deliverablesByKind, valueByAgent] = await Promise.all([
    sql`
      SELECT to_char(created_at, 'DD/MM') AS day, COUNT(*) AS total
      FROM activity_log
      WHERE org_id = ${orgId} AND created_at >= now() - interval '7 days'
      GROUP BY to_char(created_at, 'DD/MM'), date_trunc('day', created_at)
      ORDER BY date_trunc('day', created_at)
    `,
    sql`
      SELECT status, COUNT(*) AS total
      FROM approvals
      WHERE org_id = ${orgId} AND status IN ('approuve', 'rejete')
      GROUP BY status
    `,
    sql`
      SELECT kind, COUNT(*) AS total
      FROM deliverables
      WHERE org_id = ${orgId}
      GROUP BY kind
    `,
     sql`
      SELECT ag.name AS agent,
        COUNT(*) AS runs,
        COUNT(r.cost_mad) AS costed,
        COALESCE(SUM(r.cost_mad), 0) AS cost,
        COALESCE(SUM(CASE WHEN r.status = 'ok' THEN ag.temps_gagne_min END), 0) AS saved_min,
        COUNT(*) FILTER (WHERE r.status = 'ok' AND ag.temps_gagne_min IS NULL) AS unestimated
      FROM agent_runs r
      JOIN agents ag ON ag.id = r.agent_id
      WHERE r.org_id = ${orgId} AND r.created_at >= now() - interval '7 days'
      GROUP BY ag.id, ag.name
      ORDER BY saved_min DESC, runs DESC
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
   const valueRows = valueByAgent.map((r) => ({
    agent: r.agent as string,
    runs: Number(r.runs),
    costed: Number(r.costed),
    cost: Number(r.cost),
    savedMin: Number(r.saved_min),
    unestimated: Number(r.unestimated),
  }));
  const totalRuns = valueRows.reduce((s, r) => s + r.runs, 0);
  const totalCosted = valueRows.reduce((s, r) => s + r.costed, 0);
  const totalCost = valueRows.reduce((s, r) => s + r.cost, 0);
  const totalSavedMin = valueRows.reduce((s, r) => s + r.savedMin, 0);
  const totalUnestimated = valueRows.reduce((s, r) => s + r.unestimated, 0);
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
                {/* COÛT ET TEMPS GAGNÉ (7 JOURS) */}
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
                <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M12 8v4l3 2"
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
              Coût et temps gagné (7 derniers jours)
            </span>
          </div>

          <div style={{ display: "flex", gap: 32, flexWrap: "wrap", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{totalRuns}</div>
              <div style={{ fontSize: 12, color: "var(--graphite)" }}>
                Exécutions dont {totalCosted} chiffrée{totalCosted > 1 ? "s" : ""}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{formatMAD(totalCost)}</div>
              <div style={{ fontSize: 12, color: "var(--graphite)" }}>
                {totalCosted > 0
                  ? `≈ ${formatMAD(totalCost / totalCosted)} / exécution chiffrée`
                  : "Coût mesuré"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>
                ≈ {formatMinutes(totalSavedMin)}
              </div>
              <div style={{ fontSize: 12, color: "var(--graphite)" }}>
                Temps gagné (estimation)
                {totalUnestimated > 0
                  ? ` · ${totalUnestimated} exécution${totalUnestimated > 1 ? "s" : ""} sans valeur`
                  : ""}
              </div>
            </div>
          </div>

          {valueRows.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--graphite)" }}>
              Aucune exécution sur les 7 derniers jours.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.6fr 90px 130px 110px",
                  gap: 8,
                  fontSize: 11,
                  color: "var(--graphite)",
                  fontWeight: 600,
                  paddingBottom: 8,
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <span>Agent</span>
                <span style={{ textAlign: "right" }}>Exécutions</span>
                <span style={{ textAlign: "right" }}>Coût</span>
                <span style={{ textAlign: "right" }}>Temps gagné</span>
              </div>
              {valueRows.map((r, i) => (
                <div
                  key={r.agent}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.6fr 90px 130px 110px",
                    gap: 8,
                    fontSize: 12,
                    padding: "10px 0",
                    borderBottom:
                      i < valueRows.length - 1 ? "1px solid var(--line)" : "none",
                    alignItems: "center",
                  }}
                >
                  <span>{r.agent}</span>
                  <span style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                    {r.runs}
                  </span>
                  <span style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                    {r.costed > 0 ? formatMAD(r.cost) : "—"}
                  </span>
                  <span style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                    {r.savedMin > 0 ? formatMinutes(r.savedMin) : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
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