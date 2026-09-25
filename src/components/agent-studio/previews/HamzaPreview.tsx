export default function HamzaPreview({ values }: { values: Record<string, string | boolean | string[]> }) {
  const segment = ((values.segment_client as string[]) || ["Régulier"])[0] || "Régulier";
  const recurrence = ((values.recurrence as string[]) || ["Première réclamation"])[0] || "Première réclamation";
  const canaux = (values.canal_reception as string[]) || ["Email"];
  const isRecurrente = recurrence === "Réclamation récurrente";
  const isVip = segment === "VIP";

  const gravite = isVip || isRecurrente ? "Critique" : segment === "Nouveau" ? "Modérée" : "Faible";
  const slaHeures = gravite === "Critique" ? 4 : gravite === "Modérée" ? 24 : 48;
  const categorie = isRecurrente ? "Qualité produit" : "Service client";
  const action = gravite === "Critique"
    ? "Escalade immédiate au responsable + appel client sous 4h"
    : gravite === "Modérée"
    ? "Réponse personnalisée + geste commercial à valider"
    : "Réponse standard avec excuses et suivi";

  const graviteColor = gravite === "Critique" ? "var(--red)" : gravite === "Modérée" ? "var(--amber)" : "var(--emerald, #2f8f5b)";

  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "4px" }}>
        AGENT STUDIO · HAMZA · ANALYSE DES RÉCLAMATIONS
      </div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "2px" }}>
        Analyse — Segment {segment} · {recurrence}
      </h2>
      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
        Canal{canaux.length > 1 ? "aux" : ""} : {canaux.join(", ")}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
        <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>GRAVITÉ</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: graviteColor }}>{gravite}</div>
        </div>
        <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>CATÉGORIE</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{categorie}</div>
        </div>
        <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>SLA CIBLE</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{slaHeures}h</div>
        </div>
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ padding: "10px 14px", background: "var(--steel-tint)", fontSize: "12px", fontWeight: 600 }}>
          Analyse détaillée
        </div>
        <div style={{ padding: "14px", display: "grid", gap: "10px", fontSize: "13px" }}>
          <div>
            <span style={{ color: "var(--muted-foreground)" }}>Sentiment détecté : </span>
            {isRecurrente || isVip ? "Négatif — client frustré" : "Négatif — modéré"}
          </div>
          <div>
            <span style={{ color: "var(--muted-foreground)" }}>Cause probable : </span>
            {isRecurrente ? "Défaut récurrent non résolu lors d'un précédent contact" : "Incident isolé"}
          </div>
          <div>
            <span style={{ color: "var(--muted-foreground)" }}>Action recommandée : </span>
            {action}
          </div>
        </div>
      </div>

      <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "12px 14px", fontSize: "12px", color: "var(--muted-foreground)" }}>
        <strong style={{ color: "var(--ink)" }}>TRAÇABILITÉ</strong> — Analyse générée par Hamza à partir du ticket support et de l&apos;historique CRM. Escalade soumise à validation humaine selon niveau de gravité.
      </div>
    </div>
  );
}