"use client";

type FieldValue = string | boolean | string[];

const monoLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono, monospace)",
  fontSize: "10px",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--muted-foreground)",
};

const KINDS: Record<string, { label: string; bg: string; border: string; color: string }> = {
  FAIT: { label: "FAIT", bg: "var(--steel-tint)", border: "var(--border)", color: "var(--steel-strong, #2f4a63)" },
  PREUVE: { label: "PREUVE", bg: "#0f766e0c", border: "#0f766e40", color: "#0f766e" },
  HYPOTHESE: { label: "HYPOTHÈSE", bg: "#92400e08", border: "#92400e40", color: "#92400e" },
  INFERENCE: { label: "INFÉRENCE", bg: "#6d28d908", border: "#6d28d940", color: "#6d28d9" },
  RECOMMANDATION: { label: "RECOMMANDATION", bg: "#1d4ed808", border: "#1d4ed840", color: "#1d4ed8" },
  DECISION: { label: "DÉCISION", bg: "#b91c1c08", border: "#b91c1c40", color: "#b91c1c" },
  CONNAISSANCE: { label: "CONNAISSANCE", bg: "#16653408", border: "#16653440", color: "#166534" },
};

function KindTag({ kind }: { kind: keyof typeof KINDS }) {
  const s = KINDS[kind];
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
        fontFamily: "var(--font-mono, monospace)",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

const OUTPUTS: { label: string; content: string; kind: keyof typeof KINDS }[] = [
  { label: "Action", content: "Rétablir l'unité « carton » par défaut et bloquer au-delà de 500 unités", kind: "RECOMMANDATION" },
  { label: "Responsable", content: "Équipe ERP · Y. Filali", kind: "RECOMMANDATION" },
  { label: "Échéance", content: "19 sept. 2026", kind: "RECOMMANDATION" },
  { label: "Vérification", content: "Taux d'erreur ≤ 1,5 % sur 2 semaines consécutives", kind: "RECOMMANDATION" },
];

export default function MeryemPreview({ values }: { values: Record<string, FieldValue> }) {
  const cause = typeof values.cause_retenue === "string" && values.cause_retenue ? values.cause_retenue : "—";
  const ressources = typeof values.ressources_it === "string" && values.ressources_it ? values.ressources_it : "—";
  const methode = typeof values.methode_verification === "string" && values.methode_verification ? values.methode_verification : "—";

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "4px",
        background: "var(--surface, #fff)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={monoLabel}>Action corrective</div>
          <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.01em", marginTop: "4px" }}>AC-017</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ ...monoLabel, color: "var(--steel-strong, #2f4a63)" }}>RÉF · QX-0017</div>
          <div style={monoLabel}>SOURCE · DEC-0209 · PLANNING DSI</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--border)" }}>
        {[
          { k: "Cause retenue", v: cause },
          { k: "Ressources IT", v: ressources },
          { k: "Méthode de vérification", v: methode },
        ].map((row) => (
          <div
            key={row.k}
            style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: "13px" }}
          >
            <span style={{ color: "var(--muted-foreground)" }}>{row.k}</span>
            <span style={{ fontWeight: 600, textAlign: "right" }}>{row.v}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <span style={monoLabel}>Action corrective proposée</span>
        {OUTPUTS.map((o) => (
          <div key={o.label} style={{ display: "flex", flexDirection: "column", gap: "4px", border: "1px solid var(--border)", padding: "10px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>{o.label}</span>
              <KindTag kind={o.kind} />
            </div>
            <span style={{ fontSize: "12.5px", color: "var(--muted-foreground)", lineHeight: 1.5 }}>{o.content}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "3px" }}>
        <span style={monoLabel}>Raisonnement</span>
        <span style={{ fontSize: "12px", color: "var(--muted-foreground)", lineHeight: 1.5 }}>
          L&apos;action traite la cause retenue, et non le symptôme ; le contrôle bloquant limite la récidive. Recommandation soumise à approbation.
        </span>
        <span style={{ fontSize: "12px", color: "var(--muted-foreground)", lineHeight: 1.5, marginTop: "4px" }}>
          Décision humaine : approbation du manager obligatoire.
        </span>
      </div>
    </div>
  );
}