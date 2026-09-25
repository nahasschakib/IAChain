export default function OthmanePreview({ values }: { values: Record<string, string | boolean | string[]> }) {
  const budget = (values.budget as string) || "38";
  const canaux = (values.canaux as string[]) || ["Acquisition payante", "Contenu organique", "Événementiel"];

  const repartition = [
    { canal: "Acquisition payante", pct: "55 %", montant: `${Math.round(Number(budget) * 0.55)} k MAD` },
    { canal: "Contenu organique", pct: "30 %", montant: `${Math.round(Number(budget) * 0.30)} k MAD` },
    { canal: "Événementiel", pct: "15 %", montant: `${Math.round(Number(budget) * 0.15)} k MAD` },
  ];

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "16px" }}>
        <span>PLAN MÉDIA — DRAFT</span>
        <span>RÉF · CMP-0923-DRAFT · 22 SEPT. 2026</span>
      </div>

      <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>Plan média Q4 · budget {budget} k MAD</h2>
      <p style={{ color: "var(--muted-foreground)", fontSize: "13px", marginBottom: "20px" }}>
        {canaux.length} canaux activés · point d&apos;arbitrage à mi-trimestre
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {repartition.map((r) => (
          <div key={r.canal} style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "12px" }}>
            <div style={{ fontSize: "20px", fontWeight: 700 }}>{r.pct}</div>
            <div style={{ fontSize: "10px", color: "var(--muted-foreground)", marginTop: "4px" }}>{r.canal.toUpperCase()}</div>
            <div style={{ fontSize: "12px", marginTop: "2px" }}>{r.montant}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--muted-foreground)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        <span>CANAL</span>
        <span>CALENDRIER</span>
      </div>

      {[
        { canal: "Acquisition payante", periode: "Semaines 1 à 12" },
        { canal: "Contenu organique", periode: "Semaines 1 à 13 (continu)" },
        { canal: "Événementiel", periode: "Semaine 8 — salon sectoriel" },
      ].map((row) => (
        <div key={row.canal} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid var(--border)" }}>
          <span style={{ fontWeight: 600, fontSize: "13px" }}>{row.canal}</span>
          <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{row.periode}</span>
        </div>
      ))}

      <div style={{ marginTop: "20px", padding: "12px", background: "var(--steel-tint)", borderRadius: "8px", fontSize: "12px" }}>
        <strong>TRAÇABILITÉ</strong> — Répartition basée sur la note de veille de Sofia. Le plan part vers Lina · Production de contenu après validation direction marketing.
      </div>
    </div>
  );
}