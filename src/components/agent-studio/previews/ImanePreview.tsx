// src/components/agent-studio/previews/ImanePreview.tsx
export default function ImanePreview({ values }: { values: Record<string, string | boolean | string[]> }) {
  const canal = ((values.canal as string[]) || ["Email"])[0] || "Email";
  const type = ((values.type_demande as string[]) || ["Question produit"])[0] || "Question produit";
  const urgence = ((values.urgence as string[]) || ["Normale"])[0] || "Normale";

  const escalade = type === "Réclamation" || type === "Problème technique";
  const priorite = urgence === "Haute" || type === "Réclamation" ? "Haute" : urgence === "Faible" ? "Faible" : "Normale";
  const routage = escalade ? "Escalade vers Hamza (analyse approfondie)" : "Réponse directe — traitement par Imane";

  const reponses: Record<string, string> = {
    "Question produit": "Merci pour votre message. Voici les informations demandées concernant notre offre...",
    "Problème technique": "Nous avons bien identifié le dysfonctionnement signalé et transmettons votre dossier à notre équipe technique.",
    "Demande de remboursement": "Votre demande de remboursement a été enregistrée et sera traitée sous 5 jours ouvrés.",
    "Réclamation": "Nous prenons votre réclamation très au sérieux et revenons vers vous avec une analyse détaillée sous peu.",
  };

  const prioriteColor = priorite === "Haute" ? "var(--red)" : priorite === "Normale" ? "var(--amber)" : "var(--emerald, #2f8f5b)";

  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "4px" }}>
        AGENT STUDIO · IMANE · TRI & RÉPONSE SUPPORT
      </div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "2px" }}>
        Triage — {type}
      </h2>
      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
        Canal : {canal}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
        <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>CATÉGORIE</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{type}</div>
        </div>
        <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>PRIORITÉ</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: prioriteColor }}>{priorite}</div>
        </div>
        <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>ROUTAGE</div>
          <div style={{ fontSize: "14px", fontWeight: 700 }}>{escalade ? "Escalade" : "Direct"}</div>
        </div>
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ padding: "10px 14px", background: "var(--steel-tint)", fontSize: "12px", fontWeight: 600 }}>
          Réponse suggérée
        </div>
        <div style={{ padding: "14px", fontSize: "13px", lineHeight: 1.5 }}>
          {reponses[type] || "Réponse à personnaliser selon le contexte du ticket."}
        </div>
      </div>

      <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "12px 14px", fontSize: "12px", color: "var(--muted-foreground)" }}>
        <strong style={{ color: "var(--ink)" }}>TRAÇABILITÉ</strong> — Triage généré par Imane à partir du contenu du ticket. {routage}. Envoi de la réponse soumis à validation humaine.
      </div>
    </div>
  );
}