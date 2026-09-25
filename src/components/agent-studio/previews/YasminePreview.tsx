export default function YasminePreview({ values }: { values: Record<string, string | boolean | string[]> }) {
    const canaux = (values.canal_source as string[]) || [];
    const canalLabel = canaux.length > 0 ? canaux.join(", ") : "Formulaire web";
    const rows = [
            { name: "R. Fassi", company: "Somaplast Industries", role: "Directrice financière", source: "Salon Casablanca Expo", match: "Match CRM" },
            { name: "K. Amrani", company: "Tanger Metal Works", role: "Directeur industriel", source: "Formulaire web", match: "Nouveau contact" },
            { name: "M. Ouadi", company: "Atlas Emballage", role: "DAF", source: "Salon Casablanca Expo", match: "Nouveau contact" },
            { name: "Y. Benhima", company: "Chimicor Maroc", role: "Directeur des opérations", source: "Formulaire web", match: "Match CRM" },
            { name: "— à qualifier —", company: "Nordica Textile", role: "", source: "Import CSV", match: "Données incomplètes" },
        ];

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "16px" }}>
        <span>FICHE PROSPECT — LOT CAPTURÉ</span>
        <span>RÉF · CAP-0917-DRAFT · 22 SEPT. 2026</span>
      </div>

      <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>Signal entrant · {canalLabel}</h2>
      <p style={{ color: "var(--muted-foreground)", fontSize: "13px", marginBottom: "20px" }}>
        5 signaux traités · 2 dédoublonnés contre le CRM
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { value: "5", label: "SIGNAUX TRAITÉS" },
          { value: "2", label: "DÉDOUBLONNÉS CRM" },
          { value: "80 %", label: "IDENTITÉ COMPLÈTE" },
          { value: "0:04", label: "TEMPS DE TRAITEMENT" },
        ].map((kpi) => (
          <div key={kpi.label} style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "12px" }}>
            <div style={{ fontSize: "20px", fontWeight: 700 }}>{kpi.value}</div>
            <div style={{ fontSize: "10px", color: "var(--muted-foreground)", marginTop: "4px" }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--muted-foreground)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        <span>CONTACT & SOCIÉTÉ</span>
        <span>STATUT</span>
      </div>

      {rows.map((row) => (
        <div key={row.name + row.company} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: "13px" }}>
              {row.name} <span style={{ fontWeight: 400, color: "var(--muted-foreground)" }}>{row.company}</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
              {row.role && `${row.role} · `}{row.source}
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: "12px", color: row.match === "Données incomplètes" ? "#b91c1c" : "var(--ink)" }}>
            {row.match}
          </div>
        </div>
      ))}

      <div style={{ marginTop: "20px", padding: "12px", background: "var(--steel-tint)", borderRadius: "8px", fontSize: "12px" }}>
        <strong>TRAÇABILITÉ</strong> — Chaque fiche porte son canal source et sa date de capture. Aucune fusion CRM n&apos;est exécutée sans approbation : la fiche part vers Mehdi · Qualification.
      </div>
    </div>
  );
}