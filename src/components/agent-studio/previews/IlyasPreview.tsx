export default function IlyasPreview({ values }: { values: Record<string, string | boolean | string[]> }) {
  const volume = (values.volume_cible as string) || "120";

  const rows = [
    { name: "Somaplast Industries", city: "Casablanca · Plastique technique", contact: "A. Fettah", role: "Directrice financière", tag: "Recrutement", size: "140 salariés", score: 92 },
    { name: "Tanger Metal Works", city: "Tanger · Métallurgie", contact: "R. El Idrissi", role: "Directeur industriel", tag: "Nouveau site", size: "185 salariés", score: 88 },
    { name: "Atlas Emballage", city: "Kénitra · Packaging", contact: "S. Ouadi", role: "DAF", tag: "Levée", size: "96 salariés", score: 81 },
    { name: "Chimicor Maroc", city: "Mohammedia · Chimie fine", contact: "Y. Benhima", role: "Directeur des opérations", tag: "Recrutement", size: "72 salariés", score: 76 },
    { name: "Nordica Textile", city: "Tanger · Textile technique", contact: "L. Saïdi", role: "DAF", tag: "Appel d'offres", size: "158 salariés", score: 74 },
    { name: "Précimec Rabat", city: "Rabat · Mécanique de précision", contact: "— contact à enrichir", role: "", tag: "Recrutement", size: "64 salariés", score: 68 },
  ];

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "16px" }}>
        <span>LISTE DE COMPTES CIBLÉS</span>
        <span>RÉF · PRO-0117-DRAFT · 22 SEPT. 2026 · FRAÎCHEUR 7 JOURS</span>
      </div>

      <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>ETI manufacturières · axe atlantique</h2>
      <p style={{ color: "var(--muted-foreground)", fontSize: "13px", marginBottom: "20px" }}>
        {volume} comptes demandés · 2 signaux actifs · dédoublonnée CRM
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { value: "120", label: "COMPTES RETENUS" },
          { value: "34", label: "ÉCARTÉS · DÉJÀ EN PORTEFEUILLE" },
          { value: "78 %", label: "CONTACT NOMINATIF TROUVÉ" },
          { value: "7 j", label: "ANCIENNETÉ MAX" },
        ].map((kpi) => (
          <div key={kpi.label} style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "12px" }}>
            <div style={{ fontSize: "20px", fontWeight: 700 }}>{kpi.value}</div>
            <div style={{ fontSize: "10px", color: "var(--muted-foreground)", marginTop: "4px" }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--muted-foreground)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        <span>COMPTE & CONTACT</span>
        <span>SCORE</span>
      </div>

      {rows.map((row) => (
        <div key={row.name} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: "13px" }}>
              {row.name} <span style={{ fontWeight: 400, color: "var(--muted-foreground)" }}>{row.city}</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
              {row.contact} {row.role && `· ${row.role}`}
            </div>
            <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
              <span style={{ fontSize: "10px", padding: "1px 7px", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{row.tag}</span>
              <span style={{ fontSize: "10px", color: "var(--muted-foreground)" }}>{row.size}</span>
            </div>
          </div>
          <div style={{ fontWeight: 700 }}>{row.score}</div>
        </div>
      ))}

      <div style={{ fontSize: "12px", color: "var(--muted-foreground))", marginTop: "12px" }}>
        ... et 114 autres comptes, triés par score décroissant.
      </div>

      <div style={{ marginTop: "20px", padding: "12px", background: "var(--steel-tint)", borderRadius: "8px", fontSize: "12px" }}>
        <strong>TRAÇABILITÉ</strong> — Chaque ligne porte sa source et sa date de collecte. Aucun message n&apos;est envoyé par Ilyas : la liste part vers Mehdi · Qualification, qui décide de la suite.
      </div>
    </div>
  );
}