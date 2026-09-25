import AppShell from "@/components/AppShell";
import { sql } from "@/lib/db";

const CARD_SHADOW = "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)";
const CARD_SHADOW_ELEVATED = "0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.05)";

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

export default async function ApprovalsPage() {
  const pendingRows = await sql`
    SELECT a.title, a.tag, a.agent_label, w.name AS workflow_name, a.created_at
    FROM approvals a
    LEFT JOIN workflows w ON w.id = a.workflow_id
    WHERE a.status = 'en_attente'
    ORDER BY a.created_at DESC
  `;
  const pending = pendingRows.map((row) => ({
    tag: row.tag as string,
    time: formatRelativeTime(new Date(row.created_at as string)),
    title: row.title as string,
    subtitle: `Agent ${row.agent_label} · ${row.workflow_name}`,
    agentLabel: row.agent_label as string,
    workflowName: row.workflow_name as string,
  }));
  const selected = pending[0];

  const historyRows = await sql`
    SELECT title, tag, status, resolved_at
    FROM approvals
    WHERE status IN ('approuve', 'rejete')
    ORDER BY resolved_at DESC
    LIMIT 5
  `;
  const history = historyRows.map((row) => ({
    title: row.title as string,
    status: `${row.status === "approuve" ? "Approuvé" : "Rejeté"} · ${formatHistoryDate(new Date(row.resolved_at as string))}`,
    tone: (row.status === "approuve" ? "signal" : "red") as "signal" | "red",
  }));

  return (
    <AppShell
      topbar={
        <>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>File d&apos;approbation</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "var(--graphite)" }}>{`${pending.length} actions nécessitent une validation humaine`}</span>
          </div>
        </>
      }
    >
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* LIST */}
        <div style={{ flex: "1 1 380px", minWidth: 320, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 8, fontSize: 13, fontWeight: 600 }}>
            <span
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                background: "var(--steel-deep)",
                color: "#f5f6f8",
                boxShadow: "0 2px 6px rgba(15, 23, 42, 0.15)",
              }}
            >
              {`En attente · ${pending.length}`}
            </span>
            <span style={{ padding: "8px 14px", borderRadius: 999, color: "var(--graphite)", cursor: "pointer" }}>Traitées</span>
          </div>

          {pending.map((item, i) => (
            <div
              key={item.title}
              style={{
                background: "var(--surface)",
                border: i === 0 ? "2px solid var(--steel)" : "1px solid var(--line)",
                borderRadius: 12,
                padding: 16,
                cursor: "pointer",
                boxShadow: i === 0 ? CARD_SHADOW_ELEVATED : CARD_SHADOW,
                transition: "box-shadow 0.18s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: i === 0 ? "var(--steel-tint)" : "var(--paper)",
                    color: i === 0 ? "var(--steel)" : "var(--graphite)",
                    padding: "3px 9px",
                    borderRadius: 999,
                  }}
                >
                  {item.tag}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--graphite)" }}>{item.time}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "var(--graphite)", marginTop: 3 }}>{item.subtitle}</div>
            </div>
          ))}
        </div>

        {/* DETAIL */}
        <div
          style={{
            flex: "1.4 1 480px",
            minWidth: 360,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 14,
            padding: 24,
            boxSizing: "border-box",
            boxShadow: CARD_SHADOW,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.06em", color: "var(--steel)" }}>
              DEMANDE D&apos;APPROBATION
            </span>
            <span
              style={{
                fontSize: 11,
                background: "var(--steel-tint)",
                color: "var(--steel)",
                padding: "3px 9px",
                borderRadius: 999,
                fontWeight: 600,
              }}
            >
              {selected?.tag} requis
            </span>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 21, margin: "10px 0 4px" }}>
            {selected?.title}
          </div>
          <div style={{ fontSize: 12, color: "var(--graphite)", marginBottom: 18 }}>
            Proposé par Agent {selected?.agentLabel} · Workflow {selected?.workflowName}
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
            {["score 82", "priority high", "montant 120 000 MAD"].map((tag) => (
              <span
                key={tag}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  background: "var(--paper)",
                  border: "1px solid var(--line)",
                  padding: "4px 9px",
                  borderRadius: 6,
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, padding: 16, marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: "var(--graphite)", marginBottom: 10 }}>Aperçu de l&apos;email à envoyer</div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: "var(--graphite)" }}>À :</span> achats@atlas.ma
            </div>
            <div style={{ fontSize: 12, marginBottom: 10 }}>
              <span style={{ color: "var(--graphite)" }}>Objet :</span> Votre proposition IAChain — Atlas SARL
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, color: "var(--ink)" }}>
              Bonjour, suite à notre échange, vous trouverez ci-joint notre proposition pour l&apos;automatisation de
              votre processus commercial. Elle inclut la mise en place de 3 agents spécialisés et leur intégration à
              votre CRM existant…
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a
              href="#"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--red)",
                border: "1px solid var(--line)",
                padding: "10px 18px",
                borderRadius: 8,
                transition: "background 0.15s ease",
              }}
            >
              Rejeter
            </a>
            <a
              href="#"
              style={{
                fontSize: 13,
                fontWeight: 600,
                border: "1px solid var(--line)",
                padding: "10px 18px",
                borderRadius: 8,
                transition: "background 0.15s ease",
              }}
            >
              Modifier
            </a>
            <a
              href="#"
              style={{
                fontSize: 13,
                fontWeight: 700,
                background: "var(--steel-deep)",
                color: "#f5f6f8",
                padding: "10px 20px",
                borderRadius: 8,
                marginLeft: "auto",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.18)",
              }}
            >
              Approuver et envoyer
            </a>
          </div>

          <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.06em", color: "var(--graphite)" }}>
              HISTORIQUE RÉCENT
            </span>
            {history.map((item, i) => (
              <div
                key={item.title}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  padding: "10px 0",
                  borderBottom: i < history.length - 1 ? "1px solid var(--line)" : "none",
                }}
              >
                <span>{item.title}</span>
                <span style={{ color: `var(--${item.tone})` }}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}