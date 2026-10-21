import type { AnasRelanceState } from "./AnasRelanceRun";
import { libelleNiveau } from "@/lib/anas-relance";

const card: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" };

function Box({ children, error }: { children: React.ReactNode; error?: boolean }) {
  return (
    <div style={{ padding: "40px", border: "1px dashed var(--border)", borderRadius: "12px", textAlign: "center", color: error ? "var(--red)" : "var(--muted-foreground)" }}>
      {children}
    </div>
  );
}

export default function AnasRelancePanel({ state }: { state: AnasRelanceState }) {
  const { pending, outcome } = state;
  if (pending) return <Box>Anas rédige la relance…</Box>;
  if (!outcome) return null;
  if (!outcome.ok) return <Box error>{outcome.error}</Box>;

  const r = outcome.result;
  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "4px" }}>AGENT STUDIO · ANAS · RÉSULTAT RÉEL</div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "2px" }}>Relance · {r.client}</h2>
      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
        {r.version ? `Version ${r.version} · ` : ""}
        {libelleNiveau(r.niveau)} · {r.jours_silence} jours sans réponse · Registre {r.registre} · Canal e-mail
      </p>

      <div style={card}>
        <div style={{ padding: "10px 14px", background: "var(--steel-tint)", fontSize: 12, fontWeight: 600 }}>Objet : {r.objet}</div>
        <p style={{ margin: 0, padding: 14, fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{r.texte}</p>
        <div style={{ padding: "0 14px 12px", fontSize: 11, color: "var(--muted-foreground)" }}>
          {r.texte_source === "ia"
            ? "Corps rédigé par l'IA, sans chiffre ; le rappel chiffré est ajouté par le système."
            : "Texte standard : la rédaction de l'IA contenait des chiffres ou était inutilisable."}
        </div>
      </div>

      <div style={card}>
        <div style={{ padding: "10px 14px", background: "var(--steel-tint)", fontSize: 12, fontWeight: 600 }}>Contrôles du code</div>
        <ul style={{ margin: 0, padding: "14px 14px 14px 32px", fontSize: 13, lineHeight: 1.6 }}>
          <li>
            Contrôle de remise de Nadia : {r.verdict_nadia ? r.verdict_nadia : "proposition non contrôlée"}.
          </li>
          <li>
            {r.approbation_creee ? (
              <>
                Brouillon soumis à approbation : décide-le dans <a href="/approvals">Approbations</a>. Aucun envoi automatique.
              </>
            ) : (
              "L'approbation n'a pas pu être créée : le brouillon est conservé, relance la préparation."
            )}
          </li>
        </ul>
      </div>

      <div style={{ background: "var(--steel-tint)", borderRadius: 10, padding: "12px 14px", fontSize: "12.5px", lineHeight: 1.5 }}>
        <strong>TRAÇABILITÉ</strong> — Proposition n° {r.proposition_run_id} de Salma ; niveau, objet et rappel chiffré calculés par le code ; corps
        rédigé par l&apos;IA. L&apos;envoi réel reste bloqué tant que Gmail est en lecture seule.
        {outcome.costMad !== undefined && <> Coût : {outcome.costMad.toFixed(3).replace(".", ",")} MAD.</>}
      </div>
    </div>
  );
}