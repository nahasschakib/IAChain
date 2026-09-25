// src/components/agent-studio/previews/RachidPreview.tsx
export default function RachidPreview({ values }: { values: Record<string, string | boolean | string[]> }) {
  const periode = ((values.periode as string[]) || ["Mois"])[0] || "Mois";
  const departements = (values.departements as string[]) || ["Production", "Logistique"];
  const indicateurs = (values.indicateurs as string[]) || ["Taux de service", "Temps d'arrêt"];

  const defs: Record<string, { valeur: number; unite: string; seuil: number; mieuxSiPlusHaut: boolean }> = {
    "Taux de service": { valeur: 94.2, unite: "%", seuil: 95, mieuxSiPlusHaut: true },
    "Taux de rebut": { valeur: 3.2, unite: "%", seuil: 3, mieuxSiPlusHaut: false },
    "Temps d'arrêt": { valeur: 6.5, unite: "h", seuil: 5, mieuxSiPlusHaut: false },
    "Coût unitaire": { valeur: 42.8, unite: " MAD", seuil: 40, mieuxSiPlusHaut: false },
  };

  const kpis = indicateurs.map((label) => {
    const d = defs[label] || { valeur: 0, unite: "", seuil: 0, mieuxSiPlusHaut: true };
    const ok = d.mieuxSiPlusHaut ? d.valeur >= d.seuil : d.valeur <= d.seuil;
    return { label, ...d, statut: ok ? "OK" : "Alerte" };
  });

  const nbAlertes = kpis.filter((k) => k.statut === "Alerte").length;

  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "4px" }}>
        AGENT STUDIO · RACHID · REPORTING OPÉRATIONNEL
      </div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "2px" }}>
        Tableau de bord — {periode}
      </h2>
      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
        Départements : {departements.join(", ")}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
        <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>INDICATEURS SUIVIS</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{kpis.length}</div>
        </div>
        <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>DÉPARTEMENTS</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{departements.length}</div>
        </div>
        <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>ALERTES</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: nbAlertes > 0 ? "var(--red)" : "var(--emerald, #2f8f5b)" }}>
            {nbAlertes}
          </div>
        </div>
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ padding: "10px 14px", background: "var(--steel-tint)", fontSize: "12px", fontWeight: 600 }}>
          Indicateurs
        </div>
        {kpis.map((k) => (
          <div
            key={k.label}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderTop: "1px solid var(--border)", fontSize: "13px" }}
          >
            <span style={{ fontWeight: 600 }}>{k.label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span>{k.valeur}{k.unite}</span>
              <span style={{ color: k.statut === "OK" ? "var(--emerald, #2f8f5b)" : "var(--red)", fontWeight: 600, fontSize: "12px" }}>
                {k.statut}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "12px 14px", fontSize: "12px", color: "var(--muted-foreground)" }}>
        <strong style={{ color: "var(--ink)" }}>TRAÇABILITÉ</strong> — Tableau de bord généré par Rachid à partir des données opérationnelles brutes et des seuils configurés. Diffusion soumise à validation humaine.
      </div>
    </div>
  );
}