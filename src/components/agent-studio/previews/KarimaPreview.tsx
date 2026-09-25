export default function KarimaPreview({ values }: { values: Record<string, string | boolean | string[]> }) {
  const tauxTva = Number((values.taux_tva as string) || "20");
  const mentions = (values.mentions_legales as string[]) || ["Raison sociale", "ICE", "RC", "Identifiant fiscal (IF)"];
  const retenue = values.retenue_source === true;

  const montantHT = 37667;
  const montantTVA = Math.round(montantHT * (tauxTva / 100));
  const montantRetenue = retenue ? Math.round(montantHT * 0.05) : 0;
  const montantTTC = montantHT + montantTVA - montantRetenue;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "16px" }}>
        <span>FACTURE — DRAFT</span>
        <span>RÉF · FAC-2026-0848-DRAFT · 22 SEPT. 2026</span>
      </div>

      <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>Facture · TVA {tauxTva} %</h2>
      <p style={{ color: "var(--muted-foreground)", fontSize: "13px", marginBottom: "20px" }}>
        {mentions.length} mentions légales incluses {retenue ? "· retenue à la source appliquée" : ""}
      </p>

      <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--muted-foreground)", padding: "4px 0" }}>
          <span>Total HT</span><span style={{ fontFamily: "monospace" }}>{montantHT.toLocaleString("fr-FR")} MAD</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--muted-foreground)", padding: "4px 0" }}>
          <span>TVA {tauxTva} %</span><span style={{ fontFamily: "monospace" }}>{montantTVA.toLocaleString("fr-FR")} MAD</span>
        </div>
        {retenue && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--muted-foreground)", padding: "4px 0" }}>
            <span>Retenue à la source (5 %)</span><span style={{ fontFamily: "monospace" }}>-{montantRetenue.toLocaleString("fr-FR")} MAD</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "4px" }}>
          <span style={{ fontWeight: 700, fontSize: "16px" }}>Total TTC</span>
          <span style={{ fontWeight: 700, fontSize: "18px", fontFamily: "monospace" }}>{montantTTC.toLocaleString("fr-FR")} MAD</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--muted-foreground)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        <span>MENTION LÉGALE</span>
        <span>STATUT</span>
      </div>

      {mentions.map((m) => (
        <div key={m} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--border)" }}>
          <span style={{ fontSize: "13px" }}>{m}</span>
          <span style={{ fontSize: "12px", color: "#166534", fontWeight: 600 }}>Incluse</span>
        </div>
      ))}

      <div style={{ marginTop: "20px", padding: "12px", background: "var(--steel-tint)", borderRadius: "8px", fontSize: "12px" }}>
        <strong>TRAÇABILITÉ</strong> — Export XML généré en parallèle du PDF. Aucune facture n&apos;est modifiable une fois émise.
      </div>
    </div>
  );
}