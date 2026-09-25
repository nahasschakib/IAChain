// src/components/agent-studio/previews/MehdiPreview.tsx
export default function MehdiPreview({ values }: { values: Record<string, string | boolean | string[]> }) {
  const budget = ((values.budget_estime as string[]) || ["50-200k MAD"])[0] || "50-200k MAD";
  const maturite = ((values.maturite_besoin as string[]) || ["Comparaison active"])[0] || "Comparaison active";
  const fit = ((values.fit_icp as string[]) || ["Fort"])[0] || "Fort";

  const scoreFit = fit === "Fort" ? 40 : fit === "Moyen" ? 25 : 10;
  const scoreBudget = budget === "200k+ MAD" ? 30 : budget === "50-200k MAD" ? 22 : 12;
  const scoreMaturite = maturite === "Prêt à acheter" ? 30 : maturite === "Comparaison active" ? 20 : 8;
  const score = scoreFit + scoreBudget + scoreMaturite;

  const verdict = score >= 75 ? "Qualifié" : score >= 50 ? "À nourrir" : "Rejeté";
  const verdictColor = verdict === "Qualifié" ? "var(--emerald, #2f8f5b)" : verdict === "À nourrir" ? "var(--amber)" : "var(--red)";

  const cadrage = verdict === "Qualifié"
    ? "Transmission immédiate à Karim pour définition de la stratégie commerciale."
    : verdict === "À nourrir"
    ? "À réintégrer dans une séquence de nurturing avant nouvelle qualification."
    : "Fit insuffisant — pas de suite commerciale recommandée pour l'instant.";

  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "4px" }}>
        AGENT STUDIO · MEHDI · QUALIFICATION
      </div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "2px" }}>
        Verdict — {verdict}
      </h2>
      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
        Fit ICP {fit} · Budget {budget} · Maturité {maturite}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
        <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>SCORE GLOBAL</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{score}/100</div>
        </div>
        <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>VERDICT</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: verdictColor }}>{verdict}</div>
        </div>
        <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>FIT ICP</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{fit}</div>
        </div>
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ padding: "10px 14px", background: "var(--steel-tint)", fontSize: "12px", fontWeight: 600 }}>
          Détail du score
        </div>
        <div style={{ padding: "14px", display: "grid", gap: "8px", fontSize: "13px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Fit ICP</span><span style={{ fontWeight: 600 }}>{scoreFit}/40</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Budget</span><span style={{ fontWeight: 600 }}>{scoreBudget}/30</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Maturité du besoin</span><span style={{ fontWeight: 600 }}>{scoreMaturite}/30</span>
          </div>
        </div>
      </div>

      <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "12px 14px", fontSize: "12px", color: "var(--muted-foreground)" }}>
        <strong style={{ color: "var(--ink)" }}>TRAÇABILITÉ</strong> — Score calculé par Mehdi à partir de la fiche prospect CRM. {cadrage} Décision de transmission soumise à validation humaine.
      </div>
    </div>
  );
}