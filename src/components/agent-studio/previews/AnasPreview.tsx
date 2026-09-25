export default function AnasPreview({ values }: { values: Record<string, string | boolean | string[]> }) {
  const maturite = (values.maturite as string) || "Tiède";
  const canaux = (values.canaux as string[]) || ["Email", "LinkedIn"];
  const nbTouches = Number((values.nb_touches as string) || "5");

  const allTouches = [
    { jour: "J0", canal: "Email", sujet: "Merci pour votre intérêt — ressource dédiée" },
    { jour: "J+3", canal: "LinkedIn", sujet: "Connexion + message court sur le sujet" },
    { jour: "J+7", canal: "Email", sujet: "Étude de cas similaire à votre secteur" },
    { jour: "J+14", canal: "SMS", sujet: "Rappel rapide + lien de prise de RDV" },
    { jour: "J+21", canal: "Email", sujet: "Dernière relance avant clôture" },
    { jour: "J+28", canal: "Appel", sujet: "Appel de qualification finale" },
    { jour: "J+35", canal: "Email", sujet: "Message de clôture — porte ouverte" },
  ];
  const touches = allTouches.slice(0, nbTouches);

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "16px" }}>
        <span>SÉQUENCE DE NURTURING — DRAFT</span>
        <span>RÉF · NUR-0922-DRAFT · 22 SEPT. 2026</span>
      </div>

      <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>Séquence {nbTouches} touches · maturité {maturite}</h2>
      <p style={{ color: "var(--muted-foreground)", fontSize: "13px", marginBottom: "20px" }}>
        Canaux : {canaux.join(", ")}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { value: String(nbTouches), label: "TOUCHES PROGRAMMÉES" },
          { value: String(canaux.length), label: "CANAUX ACTIVÉS" },
          { value: "35 j", label: "DURÉE DE LA SÉQUENCE" },
          { value: "0", label: "CONTACTS OPT-OUT" },
        ].map((kpi) => (
          <div key={kpi.label} style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "12px" }}>
            <div style={{ fontSize: "20px", fontWeight: 700 }}>{kpi.value}</div>
            <div style={{ fontSize: "10px", color: "var(--muted-foreground)", marginTop: "4px" }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--muted-foreground)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        <span>TOUCHE</span>
        <span>CANAL</span>
      </div>

      {touches.map((t) => (
        <div key={t.jour} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: "13px" }}>
              {t.jour} <span style={{ fontWeight: 400, color: "var(--muted-foreground)" }}>{t.sujet}</span>
            </div>
          </div>
          <div style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--muted-foreground)" }}>{t.canal}</div>
        </div>
      ))}

      <div style={{ marginTop: "20px", padding: "12px", background: "var(--steel-tint)", borderRadius: "8px", fontSize: "12px" }}>
        <strong>TRAÇABILITÉ</strong> — Chaque message est généré à partir du thème hérité de Karim. Les contacts en liste d&apos;exclusion sont automatiquement écartés.
      </div>
    </div>
  );
}