export default function NadiaPreview({ values }: { values: Record<string, string | boolean | string[]> }) {
  const plafond = Number((values.plafond as string) || "10");
  const remiseProposee = 8;
  const conforme = remiseProposee <= plafond;
  const ecart = remiseProposee - plafond;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "16px" }}>
        <span>VERDICT — DRAFT</span>
        <span>RÉF · REM-0922-DRAFT · 22 SEPT. 2026</span>
      </div>

      <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>
        {conforme ? "Conforme" : "Non conforme"} · plafond {plafond} %
      </h2>
      <p style={{ color: "var(--muted-foreground)", fontSize: "13px", marginBottom: "20px" }}>
        Remise proposée {remiseProposee} % {conforme ? "— dans les limites autorisées" : `— dépassement de ${Math.abs(ecart)} pts`}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { value: `${remiseProposee} %`, label: "REMISE PROPOSÉE" },
          { value: `${plafond} %`, label: "PLAFOND AUTORISÉ" },
          { value: conforme ? "0 pt" : `+${Math.abs(ecart)} pt`, label: "ÉCART" },
        ].map((kpi) => (
          <div key={kpi.label} style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "12px" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: kpi.label === "ÉCART" && !conforme ? "#b91c1c" : "var(--ink)" }}>{kpi.value}</div>
            <div style={{ fontSize: "10px", color: "var(--muted-foreground)", marginTop: "4px" }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "16px", border: "1px solid var(--border)", borderRadius: "8px", marginBottom: "16px" }}>
        <div style={{ fontSize: "10px", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>MOTIF</div>
        <div style={{ fontSize: "13px", lineHeight: 1.5 }}>
          {conforme
            ? "La remise proposée respecte le plafond défini par la politique tarifaire en vigueur. Aucune action requise."
            : "La remise proposée dépasse le plafond autorisé. Un arbitrage de la direction commerciale est requis avant envoi au client."}
        </div>
      </div>

      <div style={{ padding: "12px", background: "var(--steel-tint)", borderRadius: "8px", fontSize: "12px" }}>
        <strong>TRAÇABILITÉ</strong> — Vérification basée sur la proposition de Salma et la politique tarifaire sélectionnée. Nadia signale, elle ne modifie jamais.
      </div>
    </div>
  );
}