export default function HindPreview({ values }: { values: Record<string, string | boolean | string[]> }) {
  const niveau = ((values.niveau_experience as string[]) || ["Confirmé"])[0] || "Confirmé";
  const canaux = (values.canal_sourcing as string[]) || ["LinkedIn"];
  const criteres = (values.criteres_eliminatoires as string[]) || [];

  const baseScore = niveau === "Senior" ? 90 : niveau === "Confirmé" ? 78 : 62;
  const bonusCanaux = Math.min(canaux.length * 3, 9);
  const maluscriteres = criteres.length * 2;

  const candidats = [
    { nom: "Yassine El Amrani", exp: niveau === "Senior" ? "9 ans" : niveau === "Confirmé" ? "5 ans" : "2 ans" },
    { nom: "Sara Bennis", exp: niveau === "Senior" ? "11 ans" : niveau === "Confirmé" ? "6 ans" : "1 an" },
    { nom: "Karim Fassi", exp: niveau === "Senior" ? "8 ans" : niveau === "Confirmé" ? "4 ans" : "3 ans" },
  ].map((c, i) => {
    const score = Math.max(40, Math.min(98, baseScore + bonusCanaux - maluscriteres - i * 4));
    const statut = score >= 80 ? "Présélectionné" : score >= 60 ? "À évaluer" : "Écarté";
    return { ...c, score, statut };
  });

  const statutColor = (s: string) =>
    s === "Présélectionné" ? "var(--emerald, #2f8f5b)" : s === "À évaluer" ? "var(--amber)" : "var(--red)";

  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "4px" }}>
        AGENT STUDIO · HIND · SOURCING & PRÉSÉLECTION
      </div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "2px" }}>
        Shortlist — Profil {niveau}
      </h2>
      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
        Canaux : {canaux.join(", ")}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
        <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>PROFILS ANALYSÉS</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{candidats.length}</div>
        </div>
        <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>PRÉSÉLECTIONNÉS</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{candidats.filter((c) => c.statut === "Présélectionné").length}</div>
        </div>
        <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>SCORE MOYEN</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>
            {Math.round(candidats.reduce((s, c) => s + c.score, 0) / candidats.length)}
          </div>
        </div>
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ padding: "10px 14px", background: "var(--steel-tint)", fontSize: "12px", fontWeight: 600 }}>
          Candidats
        </div>
        {candidats.map((c) => (
          <div
            key={c.nom}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderTop: "1px solid var(--border)", fontSize: "13px" }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{c.nom}</div>
              <div style={{ color: "var(--muted-foreground)", fontSize: "12px" }}>{c.exp} d&apos;expérience</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontWeight: 700 }}>{c.score}/100</span>
              <span style={{ color: statutColor(c.statut), fontWeight: 600, fontSize: "12px" }}>{c.statut}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "12px 14px", fontSize: "12px", color: "var(--muted-foreground)" }}>
        <strong style={{ color: "var(--ink)" }}>TRAÇABILITÉ</strong> — Shortlist générée par Hind à partir de la fiche de poste et des canaux de sourcing sélectionnés. Contact initial soumis à validation humaine.
      </div>
    </div>
  );
}