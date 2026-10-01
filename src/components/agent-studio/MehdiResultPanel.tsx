import type { MehdiRunState } from "./MehdiLiveRun";

const tile: React.CSSProperties = { background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" };
const tileLabel: React.CSSProperties = { fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" };
const cardHead: React.CSSProperties = { padding: "10px 14px", background: "var(--steel-tint)", fontSize: "12px", fontWeight: 600 };

function Box({ children, error }: { children: React.ReactNode; error?: boolean }) {
  return (
    <div
      style={{
        padding: "40px",
        border: "1px dashed var(--border)",
        borderRadius: "12px",
        textAlign: "center",
        color: error ? "var(--red)" : "var(--muted-foreground)",
      }}
    >
      {children}
    </div>
  );
}

export default function MehdiResultPanel({ state }: { state: MehdiRunState }) {
  const { pending, outcome } = state;

  if (pending) return <Box>Analyse de la fiche en cours…</Box>;
  if (!outcome) {
    return (
      <Box>
        Collez la fiche du prospect, puis lancez « Qualifier avec l&apos;IA ». Le verdict, le score et les
        informations manquantes s&apos;afficheront ici.
      </Box>
    );
  }
  if (!outcome.ok) return <Box error>{outcome.error}</Box>;

  const r = outcome.result;
  const incomplete = r.verdict === "À compléter";
  const color =
    r.verdict === "Qualifié"
      ? "var(--emerald, #2f8f5b)"
      : incomplete || r.verdict === "À nourrir"
      ? "var(--amber)"
      : "var(--red)";

  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "4px" }}>
        AGENT STUDIO · MEHDI · RÉSULTAT RÉEL
      </div>
           <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "2px" }}>
        {r.prospect ? `${r.prospect} · ` : ""}Verdict — {r.verdict}
      </h2>
      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
        Fit ICP {r.fit_icp} · Budget {r.budget_estime} · Maturité {r.maturite_besoin}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
        <div style={tile}>
          <div style={tileLabel}>SCORE GLOBAL</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{incomplete ? "—" : `${r.score}/100`}</div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>VERDICT</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color }}>{r.verdict}</div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>FIT ICP</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{r.fit_icp}</div>
        </div>
      </div>

      {incomplete ? (
        <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
          Score non calculé : au moins deux critères sont indéterminés avec cette fiche.
        </p>
      ) : (
        <div style={{ border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" }}>
          <div style={cardHead}>Détail du score</div>
          <div style={{ padding: "14px", display: "grid", gap: "8px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Fit ICP</span>
              <span style={{ fontWeight: 600 }}>{r.detail.fit}/40</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Budget</span>
              <span style={{ fontWeight: 600 }}>{r.detail.budget}/30</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Maturité du besoin</span>
              <span style={{ fontWeight: 600 }}>{r.detail.maturite}/30</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" }}>
        <div style={cardHead}>Justification</div>
        <p style={{ margin: 0, padding: "14px", fontSize: "13px", lineHeight: 1.6 }}>{r.justification}</p>
      </div>

      {r.informations_manquantes.length > 0 && (
        <div style={{ border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" }}>
          <div style={cardHead}>Informations manquantes</div>
          <ul style={{ margin: 0, padding: "14px 14px 14px 32px", fontSize: "13px", lineHeight: 1.6 }}>
            {r.informations_manquantes.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "12px 14px", fontSize: "12.5px", lineHeight: 1.5 }}>
        <strong>TRAÇABILITÉ</strong> — Évaluation générée par l&apos;IA à partir de la fiche prospect. Le score est calculé
               par la grille IAChain ; la décision de transmission reste humaine.
        {outcome.costMad !== undefined && (
          <> Coût de cette exécution : {outcome.costMad.toFixed(3).replace(".", ",")} MAD.</>
        )}
      </div>
    </div>
  );
}