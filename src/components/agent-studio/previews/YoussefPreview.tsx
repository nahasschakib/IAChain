export default function YoussefPreview({ values }: { values: Record<string, string | boolean | string[]> }) {
  const anciennete = Number((values.anciennete as string) || "30");
  const canaux = (values.canaux as string[]) || ["Email", "Téléphone"];

  const escalade = anciennete >= 90 ? "Mise en demeure" : anciennete >= 60 ? "Relance ferme" : "Relance standard";

  const paliers = [
    { seuil: "J+0", action: "Rappel amical par email", canal: "Email" },
    { seuil: "J+30", action: "Relance téléphonique", canal: "Téléphone" },
    { seuil: "J+60", action: "Relance ferme écrite", canal: "Courrier" },
    { seuil: "J+90", action: "Mise en demeure", canal: "Courrier recommandé" },
  ].filter((p) => parseInt(p.seuil.replace("J+", "")) <= anciennete + 30);

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "16px" }}>
        <span>PLAN DE RELANCE — DRAFT</span>
        <span>RÉF · REC-0922-DRAFT · 22 SEPT. 2026</span>
      </div>

      <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>Ancienneté {anciennete} jours · {escalade}</h2>
      <p style={{ color: "var(--muted-foreground)", fontSize: "13px", marginBottom: "20px" }}>
        Canaux : {canaux.join(", ")}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { value: `${anciennete} j`, label: "ANCIENNETÉ CRÉANCE" },
          { value: String(paliers.length), label: "PALIERS PROGRAMMÉS" },
          { value: escalade === "Mise en demeure" ? "Niveau 3" : escalade === "Relance ferme" ? "Niveau 2" : "Niveau 1", label: "NIVEAU D'ESCALADE" },
        ].map((kpi) => (
          <div key={kpi.label} style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "12px" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: kpi.label === "NIVEAU D'ESCALADE" && escalade === "Mise en demeure" ? "#b91c1c" : "var(--ink)" }}>{kpi.value}</div>
            <div style={{ fontSize: "10px", color: "var(--muted-foreground)", marginTop: "4px" }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--muted-foreground)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        <span>PALIER</span>
        <span>CANAL</span>
      </div>

      {paliers.map((p) => (
        <div key={p.seuil} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: "13px" }}>
              {p.seuil} <span style={{ fontWeight: 400, color: "var(--muted-foreground)" }}>{p.action}</span>
            </div>
          </div>
          <div style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--muted-foreground)" }}>{p.canal}</div>
        </div>
      ))}

      <div style={{ marginTop: "20px", padding: "12px", background: "var(--steel-tint)", borderRadius: "8px", fontSize: "12px" }}>
        <strong>TRAÇABILITÉ</strong> — Escalade calculée selon l&apos;ancienneté et l&apos;historique de paiement. Toute mise en demeure nécessite une validation.
      </div>
    </div>
  );
}