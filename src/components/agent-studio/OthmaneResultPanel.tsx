import type { OthmaneRunState } from "./OthmaneLiveRun";

const tile: React.CSSProperties = { background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" };
const tileLabel: React.CSSProperties = { fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" };
const card: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: "12px", marginBottom: "16px", overflow: "hidden" };
const cardHead: React.CSSProperties = { background: "var(--steel-tint)", padding: "12px 16px", fontSize: "13px", fontWeight: 700 };
const row: React.CSSProperties = { padding: "12px 16px", borderTop: "1px solid var(--border)" };

const CANAL_COLOR: Record<string, string> = {
  "Acquisition payante": "#B45309",
  "Contenu organique": "#047857",
  "Événementiel": "#6D28D9",
  "Email": "#0369A1",
};
const colorOf = (c: string) => CANAL_COLOR[c] ?? "#475569";

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

function CanalChip({ canal }: { canal: string }) {
  const c = colorOf(canal);
  return (
    <span
      style={{
        display: "inline-block",
        whiteSpace: "nowrap",
        flexShrink: 0,
        fontSize: "10.5px",
        fontWeight: 600,
        padding: "1px 8px",
        borderRadius: "5px",
        color: c,
        background: `${c}14`,
        border: `1px solid ${c}40`,
        textTransform: "uppercase",
        letterSpacing: "0.03em",
      }}
    >
      {canal}
    </span>
  );
}

const fmtK = (n: number) => `${n.toFixed(1).replace(".", ",")} k€`;

export default function OthmaneResultPanel({ state }: { state: OthmaneRunState }) {
  const { pending, outcome } = state;

  if (pending) return <Box>Construction du plan marketing en cours…</Box>;
  if (!outcome) {
    return (
      <Box>
        Décris l&apos;objectif (ou laisse-le vide pour reprendre l&apos;opportunité de la veille de Sofia), choisis le
        budget et les canaux, puis lance « Construire le plan avec l&apos;IA ». Le plan s&apos;affichera ici.
      </Box>
    );
  }
  if (!outcome.ok) return <Box error>{outcome.error}</Box>;

  const r = outcome.result;
  const semaines = Array.from(new Set(r.calendrier.map((e) => e.semaine))).sort((a, b) => a - b);

  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "4px" }}>
        AGENT STUDIO · OTHMANE · RÉSULTAT RÉEL
      </div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "2px" }}>Plan marketing</h2>
      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
        {r.objectif_source === "veille" && <strong>Objectif repris de la veille de Sofia · </strong>}
        {r.objectif}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
        <div style={tile}>
          <div style={tileLabel}>BUDGET</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{fmtK(r.budget_k)}</div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>HORIZON</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{r.horizon_semaines} sem.</div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>CANAUX</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{r.canaux.length}</div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>ÉTAPES</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{r.calendrier.length}</div>
        </div>
      </div>

      {r.synthese && (
        <p style={{ fontSize: "13.5px", lineHeight: 1.55, marginBottom: "16px" }}>{r.synthese}</p>
      )}

      <div style={card}>
        <div style={cardHead}>Répartition du budget</div>
        {r.canaux.map((c) => (
          <div key={c.canal} style={row}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <CanalChip canal={c.canal} />
              <span style={{ fontWeight: 700, fontSize: "13px" }}>
                {c.part_pct} % · {fmtK(c.budget_k)}
              </span>
            </div>
            <div style={{ height: "6px", background: "var(--steel-tint)", borderRadius: "3px", marginBottom: "6px" }}>
              <div style={{ width: `${c.part_pct}%`, height: "100%", background: colorOf(c.canal), borderRadius: "3px" }} />
            </div>
            <div style={{ fontSize: "12.5px", color: "var(--muted-foreground)" }}>{c.role}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={cardHead}>Calendrier</div>
        {semaines.map((sem) => (
          <div key={sem} style={row}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted-foreground)", marginBottom: "6px" }}>
              SEMAINE {sem}
            </div>
            {r.calendrier
              .filter((e) => e.semaine === sem)
              .map((e, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "baseline", marginBottom: "4px" }}>
                  <CanalChip canal={e.canal} />
                  <span style={{ fontSize: "13px" }}>
                    {e.action}
                    {e.livrable && <span style={{ color: "var(--muted-foreground)" }}> — {e.livrable}</span>}
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>

      {r.kpis.length > 0 && (
        <div style={card}>
          <div style={cardHead}>Indicateurs de suivi · cibles proposées</div>
          {r.kpis.map((k, i) => (
            <div key={i} style={{ ...row, display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span>{k.indicateur}</span>
              <strong>{k.cible}</strong>
            </div>
          ))}
        </div>
      )}

      {r.risques.length > 0 && (
        <div style={card}>
          <div style={cardHead}>Risques</div>
                    <div style={{ padding: "12px 16px", fontSize: "13px", lineHeight: 1.6 }}>
            {r.risques.map((x, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <span style={{ color: "var(--muted-foreground)" }}>•</span>
                <span>{x}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "12px 14px", fontSize: "12.5px", lineHeight: 1.5 }}>
        <strong>TRAÇABILITÉ</strong> —{" "}
        {r.veille_utilisee
          ? `Plan construit à partir de la dernière veille de Sofia (${r.nb_signaux_veille} signaux).`
          : "Aucune note de veille disponible : plan construit à partir de l'objectif et de l'offre seulement."}{" "}
        Les montants sont calculés par le code à partir du budget ; les cibles des indicateurs sont des objectifs
        proposés, pas des prévisions. Le plan est destiné à Lina (contenus) et Anas (nurturing).
        {outcome.costMad !== undefined && <> Coût de cette exécution : {outcome.costMad.toFixed(3).replace(".", ",")} MAD.</>}
      </div>
    </div>
  );
}