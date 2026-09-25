import type { Permission, ExecutionHistoryEntry } from "./types";

export default function ConfiancePermissionsTab({ permissions, executionHistory }: { permissions: Permission[]; executionHistory: ExecutionHistoryEntry[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      <Card>
        <SectionTitle>PERMISSIONS PAR ACTION</SectionTitle>
        {permissions.map((p: Permission, idx: number) => (
          <div
            key={p.action_label}
            style={{
              borderBottom: idx === permissions.length - 1 ? "none" : "1px solid var(--border)",
              padding: "14px 0",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>{p.action_label}</span>
              <ModeBadge mode={p.mode} />
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "6px" }}>{p.stats_text}</div>
            {p.promotion_suggestion && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "10px 14px",
                  background: "var(--steel-tint)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  fontSize: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span style={{ color: "var(--muted-foreground)", lineHeight: 1.4 }}>{p.promotion_suggestion}</span>
                <button
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "6px 12px",
                    background: "var(--steel-strong, #2f4a63)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "3px",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                  }}
                >
                  Valider la promotion
                </button>
              </div>
            )}
          </div>
        ))}
      </Card>

      <Card>
        <SectionTitle>HISTORIQUE D&apos;EXÉCUTIONS</SectionTitle>
         {executionHistory.length === 0 && (
          <div style={{ padding: "24px 0", fontSize: "13px", color: "var(--muted-foreground)" }}>
            Aucune exécution pour le moment.
          </div>
        )}
        {executionHistory.map((h, idx) => (
          <div
            key={h.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              padding: "12px 0",
              borderBottom: idx === executionHistory.length - 1 ? "none" : "1px solid var(--border)",
            }}
          >
            <span style={{ fontSize: "11px", color: "var(--muted-foreground)", fontFamily: "monospace", width: "64px", flexShrink: 0 }}>
              {new Date(h.exec_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
            </span>
            <span style={{ fontSize: "13px", flex: 1 }}>{h.description}</span>
            <StatusBadge status={h.status} />
          </div>
        ))}
      </Card>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--surface, #fff)",
        border: "1px solid var(--border)",
        borderRadius: "4px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
        padding: "20px 24px",
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", color: "var(--muted-foreground)", marginBottom: "6px" }}>
      {children}
    </div>
  );
}

function normalizeMode(mode: string): { label: string; key: "auto" | "validation" | "bloque" } {
  const m = mode.toUpperCase().replace(/_/g, " ");
  if (m.includes("BLOQ")) return { label: "Bloqué", key: "bloque" };
  if (m.includes("APPROBATION") || m.includes("VALIDATION")) return { label: "Validation requise", key: "validation" };
  return { label: "Automatique", key: "auto" };
}

function normalizeStatus(status: string): { label: string; key: "ok" | "rejet" | "attente" } {
  const s = status.toUpperCase();
  if (s.includes("REJET")) return { label: "Rejeté", key: "rejet" };
  if (s.includes("ATTENTE") || s.includes("ESCALAD")) return { label: status, key: "attente" };
  return { label: status, key: "ok" };
}

function ModeBadge({ mode }: { mode: Permission["mode"] }) {
  const { label, key } = normalizeMode(mode);
  const styles: Record<string, { bg: string; border: string; color: string }> = {
    auto: { bg: "var(--steel-tint)", border: "var(--border)", color: "var(--steel-strong, #2f4a63)" },
    validation: { bg: "#92400e08", border: "#92400e40", color: "#92400e" },
    bloque: { bg: "#b91c1c08", border: "#b91c1c40", color: "#b91c1c" },
  };
  const s = styles[key];
  return (
    <span
      style={{
        fontSize: "10px",
        fontWeight: 600,
        padding: "3px 8px",
        borderRadius: "3px",
        border: `1px solid ${s.border}`,
        background: s.bg,
        color: s.color,
        fontFamily: "monospace",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: ExecutionHistoryEntry["status"] }) {
  const { label, key } = normalizeStatus(status);
  const colors: Record<string, string> = { ok: "#166534", rejet: "#b91c1c", attente: "#92400e" };
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 700,
        fontFamily: "monospace",
        color: colors[key],
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}