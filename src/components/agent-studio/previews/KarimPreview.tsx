// src/components/agent-studio/previews/KarimPreview.tsx
export default function KarimPreview({ values }: { values: Record<string, string | boolean | string[]> }) {
  const segment = ((values.segment_marche as string[]) || ["PME"])[0] || "PME";
  const enjeux = (values.enjeux_prioritaires as string[]) || ["Réduction des coûts"];
  const budget = ((values.budget_estime as string[]) || ["50-200k MAD"])[0] || "50-200k MAD";

  const argumentsParEnjeu: Record<string, string> = {
    "Réduction des coûts": "ROI démontré sous 6 mois via automatisation des tâches répétitives",
    "Croissance": "Capacité à absorber la montée en charge sans recrutement supplémentaire",
    "Conformité": "Traçabilité complète et audit trail natif pour les contrôles réglementaires",
    "Transformation digitale": "Intégration progressive sans rupture avec les outils existants",
  };

  const angle = enjeux.includes("Réduction des coûts")
    ? "Optimisation opérationnelle & ROI rapide"
    : enjeux.includes("Transformation digitale")
    ? "Accélérateur de transformation digitale"
    : "Levier de croissance maîtrisée";

  const scorePriorite = (segment === "Grand compte" ? 40 : segment === "ETI" ? 25 : 15) + enjeux.length * 10;

  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "4px" }}>
        AGENT STUDIO · KARIM · STRATÉGIE COMMERCIALE
      </div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "2px" }}>
        {angle}
      </h2>
      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
        Segment {segment} · Budget cadre {budget}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
        <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>SEGMENT</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{segment}</div>
        </div>
        <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>BUDGET CADRE</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{budget}</div>
        </div>
        <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>SCORE PRIORITÉ</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{scorePriorite}/100</div>
        </div>
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ padding: "10px 14px", background: "var(--steel-tint)", fontSize: "12px", fontWeight: 600 }}>
          Proposition de valeur par enjeu
        </div>
        {enjeux.map((e) => (
          <div key={e} style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", fontSize: "13px" }}>
            <div style={{ fontWeight: 600, marginBottom: "2px" }}>{e}</div>
            <div style={{ color: "var(--muted-foreground)", fontSize: "12px" }}>{argumentsParEnjeu[e] || "Argumentaire à personnaliser"}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "12px 14px", fontSize: "12px", color: "var(--muted-foreground)" }}>
        <strong style={{ color: "var(--ink)" }}>TRAÇABILITÉ</strong> — Angle d&apos;approche généré par Karim à partir du profil qualifié CRM. Transmis à Salma (proposition) et Anas (séquence de nurturing). Cadre budgétaire soumis à validation humaine.
      </div>
    </div>
  );
}