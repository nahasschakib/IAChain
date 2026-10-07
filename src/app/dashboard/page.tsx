import AppShell from "@/components/AppShell";
import { sql } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import type { CSSProperties } from "react";
export const dynamic = "force-dynamic";

const CARD: CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 14,
  padding: 20,
  boxShadow:
    "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
};

const CARD_HEADER: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 14,
};

const CARD_TITLE: CSSProperties = { fontWeight: 700, fontSize: 15 };

const CARD_LINK: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--steel)",
};

const TONE_COLORS = {
  signal: "var(--signal)",
  amber: "var(--amber)",
  red: "var(--red)",
};

const CARD_SHADOW =
  "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)";

function formatSla(minutesLeft: number | null): {
  label: string;
  late: boolean;
} {
  if (minutesLeft === null) return { label: "—", late: false };
  if (minutesLeft < 0) return { label: "En retard", late: true };
  const total = Math.round(minutesLeft);
  if (total < 60) return { label: `${total} min`, late: true };
  const h = Math.floor(total / 60);
  const m = total % 60;
  return {
    label: m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`,
    late: total < 120,
  };
}
function formatMAD(n: number, digits = 2): string {
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n)} MAD`;
}

export default async function DashboardPage() {
  const { orgId } = await getTenantContext();
  const user = await currentUser();
  const firstName = user?.firstName?.trim();
  const greeting = firstName
    ? `Bonjour ${firstName.charAt(0).toUpperCase()}${firstName.slice(1)} — voici votre AI Workforce aujourd'hui`
    : "Bonjour — voici votre AI Workforce aujourd'hui";

  const executionRows = await sql`
    SELECT w.name AS workflow_name, e.client_label, e.current_step, e.progress_done, e.progress_total,
      EXISTS (
        SELECT 1 FROM approvals a
        WHERE a.org_id = ${orgId} AND a.workflow_id = e.workflow_id AND a.status = 'en_attente'
      ) AS has_approval,
      EXISTS (
        SELECT 1 FROM activity_log l
        WHERE l.org_id = ${orgId} AND l.workflow_id = e.workflow_id AND l.status = 'Échec'
          AND l.created_at >= now() - interval '7 days'
      ) AS has_failure
    FROM workflow_executions e
    JOIN workflows w ON w.id = e.workflow_id
    WHERE e.org_id = ${orgId} AND e.status = 'en_cours'
    ORDER BY e.id
  `;
  const activeWorkflows = executionRows.map((row) => {
    const badge = row.has_failure
      ? { label: "ATTENTION", tone: "red" as const }
      : row.has_approval
        ? { label: "APPROBATION", tone: "amber" as const }
        : { label: "EN COURS", tone: "signal" as const };
    return {
      name: `${row.workflow_name} — ${row.client_label}`,
      step: `Étape ${row.progress_done}/${row.progress_total} · ${row.current_step}`,
      badge,
    };
  });

    const activityRows = await sql`
    SELECT to_char(t.at, 'HH24:MI') AS time, t.agent_label, t.workflow_name, t.status, t.tone
    FROM (
      SELECT r.created_at AS at,
             ag.name AS agent_label,
             COALESCE(w.name, 'Studio agent') AS workflow_name,
             CASE WHEN r.status = 'ok' THEN COALESCE(r.result->>'verdict', 'Terminé') ELSE 'Échec' END AS status,
             CASE WHEN r.status <> 'ok' THEN 'red'
                  WHEN r.result->>'verdict' IS NULL
                    OR r.result->>'verdict' IN ('Qualifié', 'Fiche complète') THEN 'signal'
                  ELSE 'amber' END AS tone
      FROM agent_runs r
      JOIN agents ag ON ag.id = r.agent_id
      LEFT JOIN workflow_node_runs nr ON nr.agent_run_id = r.id
      LEFT JOIN workflow_executions e ON e.id = nr.execution_id
      LEFT JOIN workflows w ON w.id = e.workflow_id
      WHERE r.org_id = ${orgId}
      UNION ALL
      SELECT a.created_at, a.agent_label, w.name, a.status, a.tone
      FROM activity_log a
      JOIN workflows w ON w.id = a.workflow_id
      WHERE a.org_id = ${orgId}
    ) t
    ORDER BY t.at DESC
    LIMIT 6
  `;
  const activity = activityRows.map((row) => ({
    time: row.time as string,
    agent: row.agent_label as string,
    workflow: row.workflow_name as string,
    status: row.status as string,
    tone: row.tone as "signal" | "amber" | "red",
  }));

  const approvalRows = await sql`
    SELECT title, EXTRACT(EPOCH FROM (due_at - now())) / 60 AS minutes_left
    FROM approvals
    WHERE org_id = ${orgId} AND status = 'en_attente'
    ORDER BY due_at ASC NULLS LAST, created_at
  `;
  const approvalQueue = approvalRows.map((row) => ({
    title: row.title as string,
    sla: formatSla(row.minutes_left === null ? null : Number(row.minutes_left)),
  }));

  const integrationRows = await sql`
    SELECT name, status, tone FROM integrations WHERE org_id = ${orgId} ORDER BY id
  `;
  const integrations = integrationRows.map((row) => ({
    name: row.name as string,
    status: row.status as string,
    tone: row.tone as "signal" | "amber" | "red",
  }));

  const kpiRows = await sql`
    SELECT
      (SELECT COUNT(*) FROM org_agents oa JOIN agents a ON a.id = oa.agent_id
         WHERE oa.org_id = ${orgId} AND a.status = 'actif') AS active_agents,
      (SELECT COUNT(*) FROM agents) AS total_agents,
      (SELECT COUNT(*) FROM workflow_executions
         WHERE org_id = ${orgId} AND status = 'en_cours') AS active_workflows,
      (SELECT STRING_AGG(DISTINCT w.name, ' · ')
         FROM workflow_executions e JOIN workflows w ON w.id = e.workflow_id
         WHERE e.org_id = ${orgId} AND e.status = 'en_cours') AS workflow_names,
      (SELECT COUNT(*) FROM approvals
         WHERE org_id = ${orgId} AND status = 'en_attente') AS pending_approvals,
           ((SELECT COUNT(*) FROM activity_log
         WHERE org_id = ${orgId} AND status = 'Échec'
           AND created_at >= now() - interval '7 days')
       + (SELECT COUNT(*) FROM agent_runs
         WHERE org_id = ${orgId} AND status = 'erreur'
           AND created_at >= now() - interval '7 days')) AS incidents_7d,
      (SELECT x.agent_label FROM (
         SELECT agent_label, created_at FROM activity_log
           WHERE org_id = ${orgId} AND status = 'Échec'
         UNION ALL
         SELECT ag.name, r.created_at FROM agent_runs r
           JOIN agents ag ON ag.id = r.agent_id
           WHERE r.org_id = ${orgId} AND r.status = 'erreur'
       ) x ORDER BY x.created_at DESC LIMIT 1) AS last_incident_agent,
      (SELECT COUNT(*) FROM deliverables
         WHERE org_id = ${orgId} AND created_at >= now() - interval '7 days') AS deliverables_7d,
      (SELECT COUNT(*) FROM deliverables
         WHERE org_id = ${orgId}
           AND created_at >= now() - interval '14 days'
           AND created_at <  now() - interval '7 days') AS deliverables_prev,
      (SELECT COALESCE(SUM(cost_mad), 0) FROM agent_runs
         WHERE org_id = ${orgId} AND created_at >= now() - interval '7 days') AS cost_7d,
      (SELECT COUNT(cost_mad) FROM agent_runs
         WHERE org_id = ${orgId} AND created_at >= now() - interval '7 days') AS costed_7d,
          (SELECT COUNT(*) FROM agent_runs
         WHERE org_id = ${orgId} AND created_at >= now() - interval '7 days') AS runs_7d,
      (SELECT COALESCE(SUM(a.temps_gagne_min), 0) FROM agent_runs r
         JOIN agents a ON a.id = r.agent_id
         WHERE r.org_id = ${orgId} AND r.status = 'ok'
           AND r.created_at >= now() - interval '7 days') AS saved_min_7d,
      (SELECT COUNT(*) FROM agent_runs r
         JOIN agents a ON a.id = r.agent_id
         WHERE r.org_id = ${orgId} AND r.status = 'ok' AND a.temps_gagne_min IS NULL
           AND r.created_at >= now() - interval '7 days') AS unestimated_7d
    `;
  const k = kpiRows[0];
  const deliverables = Number(k.deliverables_7d);
  const delta = deliverables - Number(k.deliverables_prev);
  const pending = Number(k.pending_approvals);
  const incidents = Number(k.incidents_7d);
  const cost = Number(k.cost_7d);
  const costed = Number(k.costed_7d);
  const runs = Number(k.runs_7d);
  const savedMin = Number(k.saved_min_7d);
  const unestimated = Number(k.unestimated_7d);
  const savedLabel =
    savedMin < 60
      ? `${savedMin} min`
      : `${Math.floor(savedMin / 60)} h ${String(savedMin % 60).padStart(2, "0")}`;

  type Tone = "amber" | "red" | undefined;

  const KPIS: { label: string; value: string; note: string; tone: Tone }[] = [
    {
      label: "Agents actifs",
      value: String(k.active_agents),
      note: `sur ${k.total_agents} disponibles`,
      tone: undefined,
    },
    {
      label: "Workflows en cours",
      value: String(k.active_workflows),
      note: (k.workflow_names as string | null) ?? "Aucun en cours",
      tone: undefined,
    },
    {
      label: "Approbations",
      value: String(pending),
      note: pending > 0 ? "en attente de décision" : "rien en attente",
      tone: pending > 0 ? "amber" : undefined,
    },
    {
      label: "Incidents",
      value: String(incidents),
      note:
        incidents > 0
          ? `${k.last_incident_agent} · dernier échec`
          : "aucun sur 7 jours",
      tone: incidents > 0 ? "red" : undefined,
    },
    {
      label: "Livrables / semaine",
      value: String(deliverables),
      note:
        Number(k.deliverables_prev) === 0
          ? "première semaine de données"
          : `${delta >= 0 ? "+" : ""}${delta} vs semaine passée`,
      tone: undefined,
    },
    {
      label: "Coût / semaine",
        value: formatMAD(cost, 3),
            note:
        costed > 0
          ? `${runs} exécution${runs > 1 ? "s" : ""} dont ${costed} chiffrée${costed > 1 ? "s" : ""} · ≈ ${formatMAD(cost / costed, 3)} / exécution chiffrée`
          : "aucune exécution chiffrée",
      tone: undefined,
    },
     {
      label: "Temps gagné / semaine",
      value: `≈ ${savedLabel}`,
      note:
        unestimated > 0
          ? `estimation · ${unestimated} exécution${unestimated > 1 ? "s" : ""} sans valeur`
          : "estimation d'après les hypothèses des agents",
      tone: undefined,
    },
  ];

  const rawDate = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const todayLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  return (
    <AppShell>
      <div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 34,
            margin: 0,
            letterSpacing: "0.005em",
          }}
        >
          {greeting}
        </h1>
        <p
          style={{ fontSize: 13, color: "var(--graphite)", margin: "6px 0 0" }}
        >
          {todayLabel}
        </p>
      </div>

      {/* KPI ROW */}
      <div className="kpi-grid">
        {KPIS.map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background:
                kpi.tone === "amber"
                  ? "#fdf6ec"
                  : kpi.tone === "red"
                    ? "#fdf0ef"
                    : "var(--surface)",
              border:
                kpi.tone === "amber"
                  ? "1px solid #f0dfc3"
                  : kpi.tone === "red"
                    ? "1px solid #f0d4d2"
                    : "1px solid var(--line)",
              borderRadius: 12,
              padding: 18,
              boxShadow: CARD_SHADOW,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: kpi.tone ? `var(--${kpi.tone})` : "var(--graphite)",
              }}
            >
              {kpi.label}
            </span>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 34,
                marginTop: 6,
                color: kpi.tone ? `var(--${kpi.tone})` : "var(--ink)",
              }}
            >
              {kpi.value}
            </div>
            <div
              style={{ fontSize: 11.5, color: "var(--graphite)", marginTop: 4 }}
            >
              {kpi.note}
            </div>
          </div>
        ))}
      </div>

      {/* TWO COLUMN AREA */}
      <div
        style={{
          display: "flex",
          gap: 20,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {/* LEFT: exécutions + activité */}
        <div
          style={{
            flex: "2 1 480px",
            minWidth: 320,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Exécutions en cours */}
          <div style={CARD}>
            <div style={CARD_HEADER}>
              <span style={CARD_TITLE}>Exécutions en cours</span>
              <Link href="/workflows" style={CARD_LINK}>
                Voir tout →
              </Link>
            </div>
              {activeWorkflows.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--graphite)", padding: "6px 0" }}>
                Aucune exécution en cours. Lancez-en une depuis un workflow.
              </div>
            )}
            {activeWorkflows.map((wf, i) => (
              <Link
                key={wf.name}
                href="/workflows"
                style={{
                  display: "grid",
                  gridTemplateColumns: "8px minmax(0, 1fr) auto",
                  gap: 12,
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom:
                    i < activeWorkflows.length - 1
                      ? "1px solid var(--line)"
                      : "none",
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: TONE_COLORS[wf.badge.tone],
                  }}
                />
                <span
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {wf.name}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--graphite)" }}>
                    {wf.step}
                  </span>
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: TONE_COLORS[wf.badge.tone],
                    whiteSpace: "nowrap",
                  }}
                >
                  {wf.badge.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Activité récente */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 14,
              padding: 20,
              boxShadow: CARD_SHADOW,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 15 }}>
                Activité récente
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "70px 1.6fr 1fr 140px",
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
                  gridTemplateColumns: "70px 1.6fr 1fr 140px",
                  gap: 8,
                  fontSize: 12,
                  padding: "10px 0",
                  borderBottom:
                    i < activity.length - 1 ? "1px solid var(--line)" : "none",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--graphite)",
                  }}
                >
                  {row.time}
                </span>
                <span>{row.agent}</span>
                <span style={{ color: "var(--graphite)" }}>{row.workflow}</span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    color: TONE_COLORS[row.tone],
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: TONE_COLORS[row.tone],
                    }}
                  />
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: approbations + integrations */}
        <div
          style={{
            flex: "1 1 300px",
            minWidth: 280,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Approbations */}
          <div style={CARD}>
            <div style={CARD_HEADER}>
              <span style={CARD_TITLE}>Approbations</span>
              <Link href="/approvals" style={CARD_LINK}>
                Ouvrir la boîte →
              </Link>
            </div>
            {approvalQueue.map((item, i) => (
              <div
                key={item.title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 0",
                  borderBottom:
                    i < approvalQueue.length - 1
                      ? "1px solid var(--line)"
                      : "none",
                }}
              >
                <span style={{ flex: 1, fontSize: 12 }}>{item.title}</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 6,
                    border: "1px solid",
                    whiteSpace: "nowrap",
                    borderColor: item.sla.late ? "var(--red)" : "var(--line)",
                    color: item.sla.late ? "var(--red)" : "var(--graphite)",
                  }}
                >
                  {item.sla.label}
                </span>
              </div>
            ))}
          </div>

          {/* Intégrations */}
          <div style={CARD}>
            <div style={CARD_HEADER}>
              <span style={CARD_TITLE}>Intégrations</span>
              <Link href="/integrations" style={CARD_LINK}>
                Gérer les connecteurs →
              </Link>
            </div>
            {integrations.map((item, i) => (
              <div
                key={item.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 0",
                  borderBottom:
                    i < integrations.length - 1
                      ? "1px solid var(--line)"
                      : "none",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: TONE_COLORS[item.tone],
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, fontSize: 13 }}>{item.name}</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color:
                      item.tone === "signal"
                        ? "var(--graphite)"
                        : TONE_COLORS[item.tone],
                  }}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}