export default function AminePreview({ values }: { values: Record<string, string | boolean | string[]> }) {
  const periode = (values.periode as string) || "T3 2026";
  const seuil = (values.seuils_alerte as string) || "10";
  const showRecos = values.inclure_recommandations !== false;

  const rows = [
    { poste: "Chiffre d'affaires", montant: "4 280 000 MAD", ecart: "+3,2 %", commentaire: "Conforme au budget", good: true },
    { poste: "Achats & approvisionnements", montant: "1 650 000 MAD", ecart: "+8,7 %", commentaire: "Dépassement — hausse matières premières", good: false },
    { poste: "Masse salariale", montant: "980 000 MAD", ecart: "+0,4 %", commentaire: "Conforme", good: true },
    { poste: "Charges financières", montant: "112 000 MAD", ecart: "-2,1 %", commentaire: "Meilleur que prévu", good: true },
    { poste: "Trésorerie nette", montant: "1 340 000 MAD", ecart: "-1,8 %", commentaire: "Sous surveillance", good: false },
  ];

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "16px" }}>
        <span>RAPPORT FINANCIER</span>
        <span>RÉF · ANF-1609-DRAFT · 22 SEPT. 2026 · SEUIL {seuil} %</span>
      </div>

      <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>Analyse financière · {periode}</h2>
      <p style={{ color: "var(--muted-foreground)", fontSize: "13px", marginBottom: "20px" }}>
        3 comptes analysés · 1 écart significatif détecté
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { value: "18 %", label: "MARGE GLOBALE" },
          { value: "1,34 M", label: "TRÉSORERIE NETTE (MAD)" },
          { value: "+8,7 %", label: "PLUS GRAND ÉCART BUDGET" },
          { value: "1,9", label: "RATIO DE LIQUIDITÉ" },
        ].map((kpi) => (
          <div key={kpi.label} style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "12px" }}>
            <div style={{ fontSize: "20px", fontWeight: 700 }}>{kpi.value}</div>
            <div style={{ fontSize: "10px", color: "var(--muted-foreground)", marginTop: "4px" }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--muted-foreground)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        <span>POSTE</span>
        <span>ÉCART VS BUDGET</span>
      </div>

      {rows.map((row) => (
        <div key={row.poste} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: "13px" }}>
              {row.poste} <span style={{ fontWeight: 400, color: "var(--muted-foreground)" }}>{row.montant}</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{row.commentaire}</div>
          </div>
          <div style={{ fontWeight: 700, color: row.good ? "#166534" : "#b91c1c" }}>{row.ecart}</div>
        </div>
      ))}

      {showRecos && (
        <div style={{ marginTop: "20px", padding: "12px", background: "var(--steel-tint)", borderRadius: "8px", fontSize: "12px" }}>
          <strong>RECOMMANDATIONS</strong> — Renégocier les conditions fournisseurs sur les achats (+8,7 % vs budget) et surveiller la trésorerie nette sur les 30 prochains jours.
        </div>
      )}
    </div>
  );
}