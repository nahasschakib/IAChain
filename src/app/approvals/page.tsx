import AppShell from "@/components/AppShellClient";
import ApprovalsInbox, {
  type ApprovalPayload,
  type HistoryItem,
  type PendingItem,
  type ProcessedItem,
  type Stats,
} from "@/components/approvals/ApprovalsInbox";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatRelativeTime(date: Date): string {
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMin < 60) return `il y a ${diffMin} min`;
  return `il y a ${Math.round(diffMin / 60)} h`;
}

function formatHistoryDate(date: Date): string {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (date.toDateString() === now.toDateString()) return `aujourd'hui ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `hier ${time}`;
  return `${date.toLocaleDateString("fr-FR")} ${time}`;
}

function formatSla(minutesLeft: number | null): { label: string; late: boolean } | null {
  if (minutesLeft === null) return null;
  const total = Math.round(minutesLeft);
  if (total < 0) return { label: "en retard", late: true };
  if (total < 60) return { label: `${total} min`, late: true };
  const h = Math.floor(total / 60);
  const m = total % 60;
  return { label: m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`, late: total < 120 };
}

function formatDuration(min: number | null): string {
  if (min === null || Number.isNaN(min)) return "—";
  const t = Math.round(min);
  if (t < 60) return `${t} min`;
  if (t < 1440) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
  }
  return `${Math.round(t / 1440)} j`;
}
export default async function ApprovalsPage() {
  const pendingRows = await sql`
    SELECT a.id, a.title, a.tag, a.agent_label, a.payload, a.created_at,
           w.name AS workflow_name,
           EXTRACT(EPOCH FROM (a.due_at - now())) / 60 AS minutes_left
    FROM approvals a
    LEFT JOIN workflows w ON w.id = a.workflow_id
    WHERE a.status = 'en_attente'
    ORDER BY a.created_at DESC
  `;
  const pending: PendingItem[] = pendingRows.map((row) => ({
    id: Number(row.id),
    tag: row.tag as string,
    time: formatRelativeTime(new Date(row.created_at as string)),
    title: row.title as string,
    subtitle: `Agent ${row.agent_label} · ${row.workflow_name}`,
    agentLabel: row.agent_label as string,
    workflowName: row.workflow_name as string,
    sla: formatSla(row.minutes_left === null ? null : Number(row.minutes_left)),
    payload: (row.payload as ApprovalPayload | null) ?? null,
  }));

  const historyRows = await sql`
    SELECT title, tag, status, resolved_at
    FROM approvals
    WHERE status IN ('approuve', 'rejete')
    ORDER BY resolved_at DESC
    LIMIT 5
  `;
  const history: HistoryItem[] = historyRows.map((row) => ({
    title: row.title as string,
    status: `${row.status === "approuve" ? "Approuvé" : "Rejeté"} · ${formatHistoryDate(new Date(row.resolved_at as string))}`,
    tone: (row.status === "approuve" ? "signal" : "red") as "signal" | "red",
  }));

    const processedRows = await sql`
    SELECT id, title, tag, agent_label, status, resolved_at, decision_reason,
           payload->>'ref' AS ref
    FROM approvals
    WHERE status IN ('approuve', 'rejete')
    ORDER BY resolved_at DESC
    LIMIT 50
  `;
  const processed: ProcessedItem[] = processedRows.map((row) => ({
    id: Number(row.id),
    ref: (row.ref as string | null) ?? null,
    title: row.title as string,
    tag: row.tag as string,
    agentLabel: row.agent_label as string,
    approved: row.status === "approuve",
    when: formatHistoryDate(new Date(row.resolved_at as string)),
    reason: (row.decision_reason as string | null) ?? null,
  }));

  const statsRows = await sql`
    SELECT COUNT(*) FILTER (WHERE status = 'approuve') AS approved,
           COUNT(*) FILTER (WHERE status = 'rejete') AS rejected,
           AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60) AS avg_min
    FROM approvals
    WHERE status IN ('approuve', 'rejete')
  `;
  const stats: Stats = {
    approved: Number(statsRows[0].approved),
    rejected: Number(statsRows[0].rejected),
    avgSla: formatDuration(statsRows[0].avg_min === null ? null : Number(statsRows[0].avg_min)),
  };

  return (
    <AppShell
      topbar={
        <>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>File d&apos;approbation</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: "var(--graphite)" }}>
                {pending.length === 0
                  ? "Aucune action en attente"
                  : pending.length === 1
                    ? "1 action nécessite une validation humaine"
                    : `${pending.length} actions nécessitent une validation humaine`}
              </span>
          </div>
        </>
      }
    >
    <ApprovalsInbox pending={pending} history={history} processed={processed} stats={stats} />
    </AppShell>
  );
}