import type { Contract, ContractInput, ContractOutput, ContractWorkflowUsage } from "./types";

export default function ContratTab({ contract }: { contract: Contract }) {
  const { inputs, outputs, meta, workflowUsage } = contract;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      <Card>
        <SectionTitle>
          ENTRÉES TYPÉES <span style={{ fontWeight: 400, fontSize: "11px" }}>required · derivable · optional</span>
        </SectionTitle>
        {inputs.map((i: ContractInput, idx: number) => (
          <div
            key={i.field_key}
            style={{
              borderBottom: idx === inputs.length - 1 ? "none" : "1px solid var(--border)",
              padding: "14px 0",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: 600 }}>{i.field_key}</span>
              <span style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <RequirementBadge requirement={i.requirement} />
                <span style={{ fontSize: "11px", color: "var(--muted-foreground)", fontFamily: "monospace" }}>{i.data_type}</span>
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "6px" }}>
              Chaîne de résolution : <span style={{ fontFamily: "monospace" }}>{i.resolution_chain}</span>
            </div>
          </div>
        ))}
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <Card>
          <SectionTitle>SORTIE STRUCTURÉE</SectionTitle>
          {outputs.map((o: ContractOutput, idx: number) => (
            <div
              key={o.field_key}
              style={{
                borderBottom: idx === outputs.length - 1 ? "none" : "1px solid var(--border)",
                padding: "14px 0",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: 600 }}>{o.field_key}</span>
                <span style={{ fontSize: "11px", color: "var(--muted-foreground)", fontFamily: "monospace" }}>{o.data_type}</span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "6px" }}>{o.description}</div>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle>VERSION & IMPACT</SectionTitle>
          <p style={{ fontSize: "13px", color: "var(--muted-foreground)", lineHeight: 1.6, marginBottom: "14px" }}>
            Le contrat <strong style={{ color: "var(--ink)" }}>{meta?.version ?? "v1.0"}</strong> est consommé par{" "}
            <strong style={{ color: "var(--ink)" }}>{workflowUsage.length}</strong> workflow{workflowUsage.length > 1 ? "s" : ""}.
            Toute modification déclenche un contrôle de compatibilité avant publication.
          </p>
          {workflowUsage.map((w: ContractWorkflowUsage) => (
            <div
              key={w.workflow_name}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--border)" }}
            >
              <span style={{ fontSize: "13px", fontWeight: 500 }}>{w.workflow_name}</span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  fontFamily: "monospace",
                  letterSpacing: "0.04em",
                  padding: "3px 8px",
                  borderRadius: "3px",
                  border: "1px solid #16653440",
                  background: "#16653408",
                  color: "#166534",
                }}
              >
                {w.status}
              </span>
            </div>
          ))}
          {meta?.compatibility_note && (
            <div
              style={{
                marginTop: "14px",
                padding: "12px 14px",
                background: "var(--steel-tint)",
                borderRadius: "4px",
                border: "1px solid var(--border)",
                fontSize: "12px",
                color: "var(--muted-foreground)",
                lineHeight: 1.5,
              }}
            >
              {meta.compatibility_note}
            </div>
          )}
        </Card>
      </div>
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

function RequirementBadge({ requirement }: { requirement: string }) {
  const styles: Record<string, { bg: string; border: string; color: string }> = {
    required: { bg: "var(--steel-tint)", border: "var(--border)", color: "var(--steel-strong, #2f4a63)" },
    derivable: { bg: "#92400e08", border: "#92400e40", color: "#92400e" },
    optional: { bg: "transparent", border: "var(--border)", color: "var(--muted-foreground)" },
  };
  const s = styles[requirement] || styles.optional;
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
      }}
    >
      {requirement}
    </span>
  );
}