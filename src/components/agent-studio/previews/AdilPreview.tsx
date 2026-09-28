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
  { label: "Taux d'erreur de saisie", content: "3,8 % (référence 1,2 %)", kind: "FAIT" },
  { label: "Tendance", content: "+0,9 pt par semaine depuis le 2 sept.", kind: "FAIT" },
  { label: "Dérive", content: "Seuil de 1,5 % franchi 3 semaines d'affilée", kind: "FAIT" },
];

export default function AdilPreview({ values }: { values: Record<string, FieldValue> }) {
  const saisies = typeof values.commandes_saisies === "string" && values.commandes_saisies ? values.commandes_saisies : "—";
  const corrigees = typeof values.commandes_corrigees === "string" && values.commandes_corrigees ? values.commandes_corrigees : "—";
  const cible = typeof values.cible_kpi === "string" && values.cible_kpi ? values.cible_kpi : "—";

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
          <div style={monoLabel}>Relevé KPI</div>
          <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.01em", marginTop: "4px" }}>Semaine 38</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ ...monoLabel, color: "var(--steel-strong, #2f4a63)" }}>RÉF · QK-0038</div>
          <div style={monoLabel}>SOURCE · ERP</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--border)" }}>
        {[
          { k: "Commandes saisies", v: saisies },
          { k: "Commandes corrigées", v: corrigees },
          { k: "Cible", v: cible },
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
        <span style={monoLabel}>KPI calculé</span>
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
          Erreur = commande modifiée après validation pour quantité ou unité, rapportée au total saisi. Calcul déterministe.
        </span>
        <span style={{ fontSize: "12px", color: "var(--muted-foreground)", lineHeight: 1.5, marginTop: "4px" }}>
          Décision humaine : aucune — calcul déterministe.
        </span>
      </div>
    </div>
  );
}