import type { Deliverable } from "./types";

export default function LivrablesTab({ deliverables }: { deliverables: Deliverable[] }) {
  if (deliverables.length === 0) {
    return (
      <Card>
        <SectionTitle>LIVRABLES PRODUITS PAR CET AGENT</SectionTitle>
        <div style={{ padding: "32px 0", textAlign: "center", color: "var(--muted-foreground)", fontSize: "13px" }}>
          Aucun livrable produit pour l&apos;instant.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle>LIVRABLES PRODUITS PAR CET AGENT</SectionTitle>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
            {["LIVRABLE", "VERSION", "ORIGINE", "APPROBATION", "COÛT"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "0 0 10px",
                  fontSize: "11px",
                  color: "var(--muted-foreground)",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {deliverables.map((d, idx) => (
            <tr key={d.id} style={{ borderBottom: idx === deliverables.length - 1 ? "none" : "1px solid var(--border)" }}>
              <td style={{ padding: "14px 0", fontWeight: 600, fontSize: "13px" }}>{d.name}</td>
              <td style={{ fontSize: "13px", color: "var(--muted-foreground)", fontFamily: "monospace" }}>{d.version || "—"}</td>
              <td style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>{d.origin}</td>
              <td>
                <ApprovalBadge status={d.approval_status} />
              </td>
              <td style={{ fontSize: "13px", color: "var(--muted-foreground)", fontFamily: "monospace" }}>
                {d.cost ? `${Number(d.cost).toFixed(2)} MAD` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
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
    <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", color: "var(--muted-foreground)", marginBottom: "12px" }}>
      {children}
    </div>
  );
}

function ApprovalBadge({ status }: { status: string | null }) {
  const s = (status || "").toUpperCase();
  const styles: Record<string, { bg: string; border: string; color: string }> = {
    VALIDÉ: { bg: "#16653408", border: "#16653440", color: "#166534" },
    APPROUVÉ: { bg: "#16653408", border: "#16653440", color: "#166534" },
    "EN ATTENTE": { bg: "#92400e08", border: "#92400e40", color: "#92400e" },
    REJETÉ: { bg: "#b91c1c08", border: "#b91c1c40", color: "#b91c1c" },
  };
  const c = styles[s] || { bg: "var(--steel-tint)", border: "var(--border)", color: "var(--muted-foreground)" };
  return (
    <span
      style={{
        fontSize: "10px",
        fontWeight: 600,
        padding: "3px 8px",
        borderRadius: "3px",
        border: `1px solid ${c.border}`,
        background: c.bg,
        color: c.color,
        fontFamily: "monospace",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {status || "—"}
    </span>
  );
}