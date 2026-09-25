import AppShell from "@/components/AppShell";
import { sql } from "@/lib/db";

const TONE_COLORS = {
  signal: "var(--signal)",
  amber: "var(--amber)",
  red: "var(--red)",
};

const CARD_SHADOW = "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)";

function WorkflowProgress({ done, total }: { done: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 16,
            height: 4,
            borderRadius: 2,
            background: i < done - 1 ? "var(--signal)" : i === done - 1 ? "var(--steel)" : "var(--line)",
          }}
        />
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const agentRows = await sql`SELECT name, status FROM agents ORDER BY id`;
  const workforce = agentRows.map((row) => ({
    name: row.name as string,
    status: row.status as string,
    on: row.status === "actif",
  }));

  const executionRows = await sql`
    SELECT w.name AS workflow_name, e.client_label, e.current_step, e.progress_done, e.progress_total
    FROM workflow_executions e
    JOIN workflows w ON w.id = e.workflow_id
    WHERE e.status = 'en_cours'
    ORDER BY e.id
  `;
  const activeWorkflows = executionRows.map((row) => ({
    name: `${row.workflow_name} — ${row.client_label}`,
    step: `Étape en cours : ${row.current_step}`,
    done: row.progress_done as number,
    total: row.progress_total as number,
  }));
  const activityRows = await sql`
    SELECT to_char(a.created_at, 'HH24:MI') AS time, a.agent_label, w.name AS workflow_name, a.status, a.tone
    FROM activity_log a
    JOIN workflows w ON w.id = a.workflow_id
    ORDER BY a.created_at DESC
    LIMIT 4
  `;
  const activity = activityRows.map((row) => ({
    time: row.time as string,
    agent: row.agent_label as string,
    workflow: row.workflow_name as string,
    status: row.status as string,
    tone: row.tone as "signal" | "amber" | "red",
  }));
  const approvalRows = await sql`
    SELECT title, detail
    FROM approvals
    WHERE status = 'en_attente'
    ORDER BY created_at
  `;
  const approvalQueue = approvalRows.map((row) => ({
    title: row.title as string,
    detail: row.detail as string,
  }));

  const kpiRows = await sql`
  SELECT
    (SELECT COUNT(*) FROM agents WHERE status = 'actif') AS active_agents,
    (SELECT COUNT(*) FROM agents) AS total_agents,
    (SELECT COUNT(*) FROM workflow_executions WHERE status = 'en_cours') AS active_workflows,
    (SELECT COUNT(*) FROM activity_log WHERE created_at::date = CURRENT_DATE) AS today_activity,
    (SELECT COUNT(*) FROM approvals WHERE status = 'en_attente') AS pending_approvals,
    (SELECT COUNT(*) FROM activity_log WHERE status = 'Échec' AND created_at >= now() - interval '7 days') AS errors_7d
`;
  const k = kpiRows[0];
  const KPIS = [
    { label: "Agents actifs", value: String(k.active_agents), suffix: `/ ${k.total_agents}` },
    { label: "Workflows en cours", value: String(k.active_workflows) },
    { label: "Exécutions aujourd'hui", value: String(k.today_activity) },
    { label: "En attente d'approbation", value: String(k.pending_approvals), tone: "amber" as const },
    { label: "Erreurs (7 jours)", value: String(k.errors_7d) },
  ];

  const todayLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <AppShell>
      <div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 26,
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Bonjour Chakib — voici votre AI Workforce aujourd&apos;hui
        </h1>
        <p style={{ fontSize: 13, color: "var(--graphite)", margin: "6px 0 0", textTransform: "capitalize" }}>{todayLabel}</p>
      </div>

      {/* KPI ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        {KPIS.map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: kpi.tone === "amber" ? "#fdf6ec" : "var(--surface)",
              border: kpi.tone === "amber" ? "1px solid #f0dfc3" : "1px solid var(--line)",
              borderRadius: 12,
              padding: 18,
              boxShadow: CARD_SHADOW,
            }}
          >
            <span style={{ fontSize: 12, color: kpi.tone === "amber" ? "var(--amber)" : "var(--graphite)" }}>
              {kpi.label}
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 26,
                  color: kpi.tone === "amber" ? "var(--amber)" : "var(--ink)",
                }}
              >
                {kpi.value}
              </span>
              {kpi.suffix && <span style={{ fontSize: 12, color: "var(--graphite)" }}>{kpi.suffix}</span>}
            </div>
          </div>
        ))}
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: 18, boxShadow: CARD_SHADOW }}>
          <span style={{ fontSize: 12, color: "var(--graphite)" }}>Consommation (plan Pro)</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26 }}>68%</span>
            <span style={{ fontSize: 11, color: "var(--graphite)" }}>du quota mensuel</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "var(--line)", marginTop: 8, overflow: "hidden" }}>
            <div style={{ height: "100%", width: "68%", background: "var(--steel)" }} />
          </div>
        </div>
      </div>

      {/* TWO COLUMN AREA */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* LEFT: workflows + activity */}
        <div style={{ flex: "2 1 480px", minWidth: 320, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 20, boxShadow: CARD_SHADOW }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Workflows actifs</span>
              <a href="/workflows" style={{ fontSize: 12, fontWeight: 600, color: "var(--steel)" }}>
                Voir tout →
              </a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {activeWorkflows.map((wf) => (
                <div key={wf.name} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{wf.name}</div>
                    <div style={{ fontSize: 11, color: "var(--graphite)", marginTop: 2 }}>{wf.step}</div>
                  </div>
                  <WorkflowProgress done={wf.done} total={wf.total} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--graphite)", flexShrink: 0 }}>
                    {wf.done}/{wf.total}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 20, boxShadow: CARD_SHADOW }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Activité récente</span>
              <a href="#" style={{ fontSize: 12, fontWeight: 600, color: "var(--steel)" }}>
                Journal complet →
              </a>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "70px 1.6fr 1fr 90px",
                gap: 8,
                fontSize: 11,
                color: "var(--graphite)",
                fontWeight: 600,
                paddingBottom: 8,
                borderBottom: "1px solid var(--line)",
              }}
            >
              <span>Heure</span>
              <span>Agent</span>
              <span>Workflow</span>
              <span>Statut</span>
            </div>
            {activity.map((row, i) => (
              <div
                key={`${row.time}-${row.agent}-${i}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px 1.6fr 1fr 90px",
                  gap: 8,
                  fontSize: 12,
                  padding: "10px 0",
                  borderBottom: i < activity.length - 1 ? "1px solid var(--line)" : "none",
                  alignItems: "center",
                }}
              >
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--graphite)" }}>{row.time}</span>
                <span>{row.agent}</span>
                <span style={{ color: "var(--graphite)" }}>{row.workflow}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: TONE_COLORS[row.tone] }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: TONE_COLORS[row.tone] }} />
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: approvals + agent status */}
        <div style={{ flex: "1 1 300px", minWidth: 280, display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              background: "var(--steel-deep)",
              color: "#f5f6f8",
              borderRadius: 14,
              padding: 20,
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.18), 0 2px 4px rgba(15, 23, 42, 0.10)",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 15 }}>File d&apos;approbation</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
              {approvalQueue.map((item) => (
                <div
                  key={item.title}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 10,
                    padding: 12,
                    transition: "background 0.15s ease",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: "#c7ccd4", marginTop: 2 }}>{item.detail}</div>
                </div>
              ))}
            </div>
            <a
              href="/approvals"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: 14,
                fontSize: 12,
                fontWeight: 600,
                background: "#f5f6f8",
                color: "var(--steel-deep)",
                padding: 9,
                borderRadius: 8,
              }}
            >
              Traiter les approbations
            </a>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 20, boxShadow: CARD_SHADOW }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Mon AI Workforce</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
              {workforce.map((agent) => (
                <div key={agent.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: agent.on ? "var(--signal)" : "var(--graphite)",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 13, flex: 1, color: agent.on ? "var(--ink)" : "var(--graphite)" }}>
                    {agent.name}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--graphite)" }}>
                    {agent.status}
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