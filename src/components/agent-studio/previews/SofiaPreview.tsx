// src/components/agent-studio/previews/SofiaPreview.tsx
export default function SofiaPreview({ values }: { values: Record<string, string | boolean | string[]> }) {
  const sources = (values.sources as string[]) || ["Presse spécialisée", "Réseaux sociaux"];
  const zone = ((values.zone_geo as string[]) || ["Maroc"])[0] || "Maroc";
  const frequence = ((values.frequence as string[]) || ["Hebdomadaire"])[0] || "Hebdomadaire";

  const tendances = [
    { label: "Montée du social commerce", impact: "Fort" },
    { label: "Attentes accrues en livraison rapide", impact: "Moyen" },
    { label: "Sensibilité prix en hausse", impact: "Fort" },
  ].slice(0, sources.length >= 3 ? 3 : 2);

  const opportunites = zone === "International"
    ? "Expansion possible vers marchés adjacents (Maghreb, Afrique de l'Ouest)"
    : zone === "Maghreb"
    ? "Positionnement régional face à des concurrents encore peu structurés"
    : "Fenêtre d'opportunité locale avant intensification de la concurrence";

  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "4px" }}>
        AGENT STUDIO · SOFIA · VEILLE MARCHÉ
      </div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "2px" }}>
        Note de veille — {zone}
      </h2>
      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
        Sources : {sources.join(", ")} · Fréquence {frequence}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
        <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>SOURCES ACTIVES</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{sources.length}</div>
        </div>
        <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>TENDANCES DÉTECTÉES</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{tendances.length}</div>
        </div>
        <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>ZONE</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{zone}</div>
        </div>
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ padding: "10px 14px", background: "var(--steel-tint)", fontSize: "12px", fontWeight: 600 }}>
          Tendances identifiées
        </div>
        {tendances.map((t) => (
          <div
            key={t.label}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderTop: "1px solid var(--border)", fontSize: "13px" }}
          >
            <span>{t.label}</span>
            <span style={{ color: t.impact === "Fort" ? "var(--red)" : "var(--amber)", fontWeight: 600, fontSize: "12px" }}>
              Impact {t.impact}
            </span>
          </div>
        ))}
        <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", fontSize: "13px" }}>
          <span style={{ color: "var(--muted-foreground)" }}>Opportunité : </span>
          {opportunites}
        </div>
      </div>

      <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "12px 14px", fontSize: "12px", color: "var(--muted-foreground)" }}>
        <strong style={{ color: "var(--ink)" }}>TRAÇABILITÉ</strong> — Note de veille générée par Sofia à partir des sources sélectionnées. Transmise à Othmane pour construction du plan média. Diffusion soumise à validation humaine.
      </div>
    </div>
  );
}