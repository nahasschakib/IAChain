import type { NadiaRunState } from "./NadiaLiveRun";

const card: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" };
const tile: React.CSSProperties = { background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" };
const tileLabel: React.CSSProperties = { fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" };
const pct = (n: number) => `${String(n).replace(".", ",")} %`;

function Box({ children, error }: { children: React.ReactNode; error?: boolean }) {
  return (
    <div style={{ padding: "40px", border: "1px dashed var(--border)", borderRadius: "12px", textAlign: "center", color: error ? "var(--red)" : "var(--muted-foreground)" }}>
      {children}
    </div>
  );
}

const SUITE: Record<string, string> = {
  Conforme: "La remise respecte la politique : la proposition peut suivre son cours.",
  "Dérogation requise": "La remise dépasse le plafond avec un motif d'exception : l'approbation de la direction est requise avant envoi.",
  "Non conforme": "La remise ne respecte pas la politique : elle doit être corrigée (Nadia ne la modifie pas).",
  "À contrôler manuellement": "La politique ne permet pas de conclure : un contrôle humain est nécessaire.",
};

export default function NadiaResultPanel({ state }: { state: NadiaRunState }) {
  const { pending, outcome } = state;
  if (pending) return <Box>Nadia contrôle la remise…</Box>;
  if (!outcome)
    return (
      <div style={{ padding: "28px", border: "1px dashed var(--border)", borderRadius: "12px", color: "var(--muted-foreground)", fontSize: 13, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Comment contrôler une remise</div>
        Choisis une proposition chiffrée par Salma, indique si besoin le motif d&apos;exception, puis clique sur « Contrôler la remise ».
        Le verdict est calculé par le code à partir de ta politique tarifaire ; aucune IA n&apos;intervient.
      </div>
    );
  if (!outcome.ok) return <Box error>{outcome.error}</Box>;

  const r = outcome.result;
  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "4px" }}>AGENT STUDIO · NADIA · RÉSULTAT RÉEL</div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "2px" }}>Contrôle de remise · {r.client}</h2>
      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
        {r.version ? `Version ${r.version} · ` : ""}
        {r.segment ? `Segment ${r.segment}${r.segment_saisi ? " (choisi au contrôle)" : ""}` : "Segment non précisé"}
        {r.politique_version !== null ? ` · Politique tarifaire v${r.politique_version}` : " · Aucune politique active"}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <div style={tile}>
          <div style={tileLabel}>VERDICT</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{r.verdict}</div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>REMISE PROPOSÉE</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{pct(r.remise_pct)}</div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>PLAFOND</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{r.plafond_pct !== null ? pct(r.plafond_pct) : "—"}</div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>ÉCART</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {r.ecart_pts !== null ? `${r.ecart_pts > 0 ? "+" : ""}${String(r.ecart_pts).replace(".", ",")} pt` : "—"}
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={{ padding: "10px 14px", background: "var(--steel-tint)", fontSize: 12, fontWeight: 600 }}>Motif du verdict</div>
        <div style={{ padding: 14, fontSize: 13, lineHeight: 1.6 }}>
          <p style={{ margin: "0 0 8px" }}>{r.motif}.</p>
          {r.plafond_derogation_pct !== null && (
            <p style={{ margin: "0 0 8px", color: "var(--muted-foreground)" }}>Plafond absolu avec dérogation : {pct(r.plafond_derogation_pct)}.</p>
          )}
          {r.motif_exception && <p style={{ margin: "0 0 8px" }}>Motif d&apos;exception invoqué : {r.motif_exception}.</p>}
          {r.commentaire && <p style={{ margin: "0 0 8px" }}>Commentaire : {r.commentaire}</p>}
          <p style={{ margin: 0, fontWeight: 600 }}>{SUITE[r.verdict]}</p>
        </div>
      </div>

      <div style={{ background: "var(--steel-tint)", borderRadius: 10, padding: "12px 14px", fontSize: "12.5px", lineHeight: 1.5 }}>
        <strong>TRAÇABILITÉ</strong> — Verdict calculé par le code à partir de la politique tarifaire de l&apos;organisation et de la proposition
        de Salma (exécution n° {r.proposition_run_id}). Aucune IA, coût nul. Nadia signale, elle ne modifie jamais une remise.
      </div>
    </div>
  );
}