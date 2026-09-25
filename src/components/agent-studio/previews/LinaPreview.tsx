export default function LinaPreview({ values }: { values: Record<string, string | boolean | string[]> }) {
  const formats = (values.formats as string[]) || ["Article de blog", "Posts réseaux sociaux"];
  const ton = (values.ton_editorial as string) || "Expert";

  const items = [
    { type: "Article de blog", titre: "Pourquoi digitaliser sa supply chain en 2026", canal: "Blog", statut: "Prêt" },
    { type: "Post LinkedIn", titre: "3 chiffres clés sur l'automatisation industrielle", canal: "LinkedIn", statut: "Prêt" },
    { type: "Post LinkedIn", titre: "Étude de cas — gain de 18% de marge", canal: "LinkedIn", statut: "Prêt" },
    { type: "Post Instagram", titre: "Behind the scenes — visite d'usine", canal: "Instagram", statut: "À relire" },
    { type: "Newsletter", titre: "Récap septembre — nouveautés produit", canal: "Email", statut: "Brouillon" },
  ];

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "16px" }}>
        <span>JEU DE CONTENUS — DRAFT</span>
        <span>RÉF · CNT-0922-DRAFT · 22 SEPT. 2026 · TON {ton.toUpperCase()}</span>
      </div>

      <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>Campagne Q4 · {formats.length} formats</h2>
      <p style={{ color: "var(--muted-foreground)", fontSize: "13px", marginBottom: "20px" }}>
        {items.length} contenus générés · basés sur le plan média d&apos;Othmane
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { value: "5", label: "CONTENUS GÉNÉRÉS" },
          { value: "3", label: "PRÊTS À PUBLIER" },
          { value: "4", label: "CANAUX COUVERTS" },
          { value: "0:11", label: "TEMPS DE GÉNÉRATION" },
        ].map((kpi) => (
          <div key={kpi.label} style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "12px" }}>
            <div style={{ fontSize: "20px", fontWeight: 700 }}>{kpi.value}</div>
            <div style={{ fontSize: "10px", color: "var(--muted-foreground)", marginTop: "4px" }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--muted-foreground)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        <span>CONTENU</span>
        <span>STATUT</span>
      </div>

      {items.map((item) => (
        <div key={item.titre} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: "13px" }}>{item.titre}</div>
            <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{item.type} · {item.canal}</div>
          </div>
          <div style={{ fontWeight: 700, fontSize: "12px", color: item.statut === "Prêt" ? "#166534" : item.statut === "Brouillon" ? "var(--muted-foreground)" : "#854d0e" }}>
            {item.statut}
          </div>
        </div>
      ))}

      <div style={{ marginTop: "20px", padding: "12px", background: "var(--steel-tint)", borderRadius: "8px", fontSize: "12px" }}>
        <strong>TRAÇABILITÉ</strong> — Chaque contenu référence le plan média source. Aucune publication n&apos;est déclenchée sans validation éditoriale.
      </div>
    </div>
  );
}