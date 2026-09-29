export default function SalmaPreview({ values }: { values: Record<string, string | boolean | string[]> }) {
  const client = (values.client as string) || "Somaplast Industries";
  const remise = Number((values.remise as string) || "12");
  const totalHT = 40357;
  const totalTTC = Math.round(totalHT * (1 - remise / 100) * 1.2);
  const registre = (values.registre as string) || "Direct";
  const ttc = totalTTC.toLocaleString("fr-FR");

  const INTROS: Record<string, string> = {
    Direct: `Bonjour, voici notre proposition pour ${client}. Nous automatisons vos commandes sur 3 sites, reliées à votre ERP et à votre CRM, pour ${ttc} MAD TTC. Mise en service 8 semaines après signature.`,
    Institutionnel: `Madame, Monsieur, nous avons le plaisir de vous soumettre la présente proposition à l'attention de ${client}. Elle porte sur l'automatisation de vos commandes et leur intégration à votre système d'information, pour un montant de ${ttc} MAD TTC. Nous restons à votre entière disposition pour tout complément d'information.`,
    Technique: `Périmètre : automatisation du flux de commandes sur 3 sites, connecteurs ERP et CRM. Livraison : 8 semaines après signature, 2 sessions de formation incluses. Chiffrage : ${totalHT.toLocaleString("fr-FR")} MAD HT, remise de ${remise} %, soit ${ttc} MAD TTC.`,
  };

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "16px" }}>
        <span>PROPOSITION COMMERCIALE — DRAFT</span>
        <span>RÉF · PRP-0922-DRAFT · 22 SEPT. 2026</span>
      </div>

      <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>Proposition · {client}</h2>
            <p style={{ color: "var(--muted-foreground)", fontSize: "13px", marginBottom: "20px" }}>
        Remise appliquée {remise} % · mise en service 8 semaines après signature
      </p>

      <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "14px 16px", marginBottom: "24px" }}>
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", letterSpacing: "0.06em", color: "var(--muted-foreground)", marginBottom: "8px" }}>
          {`MOT D'INTRODUCTION · REGISTRE ${registre.toUpperCase()}`}
        </div>
        <p style={{ fontSize: "13px", lineHeight: 1.6, margin: 0 }}>{INTROS[registre] ?? INTROS.Direct}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { value: `${totalHT.toLocaleString("fr-FR")} MAD`, label: "TOTAL HT" },
          { value: `${remise} %`, label: "REMISE APPLIQUÉE" },
          { value: `${totalTTC.toLocaleString("fr-FR")} MAD`, label: "TOTAL TTC" },
        ].map((kpi) => (
          <div key={kpi.label} style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "12px" }}>
            <div style={{ fontSize: "20px", fontWeight: 700 }}>{kpi.value}</div>
            <div style={{ fontSize: "10px", color: "var(--muted-foreground)", marginTop: "4px" }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--muted-foreground)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        <span>PÉRIMÈTRE</span>
        <span>INCLUS</span>
      </div>

      {[
        { item: "Automatisation des commandes — 3 sites", inclus: true },
        { item: "Intégration ERP", inclus: true },
        { item: "Intégration CRM", inclus: true },
        { item: "Formation utilisateurs (2 sessions)", inclus: true },
        { item: "Support prioritaire 12 mois", inclus: remise <= 10 },
      ].map((row) => (
        <div key={row.item} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--border)" }}>
          <span style={{ fontSize: "13px" }}>{row.item}</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: row.inclus ? "#166534" : "var(--muted-foreground)" }}>
            {row.inclus ? "Inclus" : "Non inclus"}
          </span>
        </div>
      ))}

      <div style={{ marginTop: "20px", padding: "12px", background: "var(--steel-tint)", borderRadius: "8px", fontSize: "12px" }}>
        <strong>TRAÇABILITÉ</strong> — Objectif hérité de Karim, budget cadre hérité de Mehdi. Passe par Nadia (contrôle de remise) avant approbation.
      </div>
    </div>
  );
}