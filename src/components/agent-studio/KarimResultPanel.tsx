import type { KarimRunState } from "./KarimLiveRun";

const tile: React.CSSProperties = { background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" };
const tileLabel: React.CSSProperties = { fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" };
const cardHead: React.CSSProperties = { padding: "10px 14px", background: "var(--steel-tint)", fontSize: "12px", fontWeight: 600 };
const card: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" };

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

export default function KarimResultPanel({ state }: { state: KarimRunState }) {
  const { pending, outcome } = state;

  if (pending) return <Box>Préparation du plan d&apos;approche en cours…</Box>;
  if (!outcome) {
    return (
      <Box>
        Collez le profil du prospect qualifié, puis lancez « Préparer le plan avec l&apos;IA ». L&apos;angle
        d&apos;approche, la proposition de valeur et le cadre budgétaire s&apos;afficheront ici.
      </Box>
    );
  }
  if (!outcome.ok) return <Box error>{outcome.error}</Box>;

  const r = outcome.result;
  const ready = r.statut === "Plan prêt";

  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "4px" }}>
        AGENT STUDIO · KARIM · RÉSULTAT RÉEL
      </div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "2px" }}>
        {r.prospect ? `${r.prospect} · ` : ""}{r.statut}
      </h2>
      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
        Segment {r.segment} · Registre {r.registre}
        {r.enjeux.length > 0 ? ` · Enjeux : ${r.enjeux.join(", ")}` : ""}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
        <div style={tile}>
          <div style={tileLabel}>STATUT</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: ready ? "var(--emerald, #2f8f5b)" : "var(--amber)" }}>
            {r.statut}
          </div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>SEGMENT</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{r.segment}</div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>ENJEUX RETENUS</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{r.enjeux.length}</div>
        </div>
      </div>

      <div style={card}>
        <div style={cardHead}>Angle d&apos;approche</div>
        <p style={{ margin: 0, padding: "14px", fontSize: "13px", lineHeight: 1.6 }}>
          {r.approach_angle || "Profil trop pauvre pour proposer un angle d'approche."}
        </p>
      </div>

      <div style={card}>
        <div style={cardHead}>Proposition de valeur par enjeu</div>
        {r.value_proposition.length === 0 ? (
          <p style={{ margin: 0, padding: "14px", fontSize: "13px", color: "var(--muted-foreground)" }}>
            Aucune proposition possible avec ce profil.
          </p>
        ) : (
          <div style={{ padding: "14px", display: "grid", gap: "10px", fontSize: "13px", lineHeight: 1.55 }}>
            {r.value_proposition.map((v) => (
              <div key={v.enjeu}>
                <div style={{ fontWeight: 600 }}>{v.enjeu}</div>
                <div>{v.argument}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={card}>
        <div style={cardHead}>Cadre budgétaire</div>
        <p style={{ margin: 0, padding: "14px", fontSize: "13px", lineHeight: 1.6 }}>{r.budget_cadre}</p>
      </div>

      {r.informations_manquantes.length > 0 && (
        <div style={card}>
          <div style={cardHead}>Informations manquantes</div>
          <ul style={{ margin: 0, padding: "14px 14px 14px 32px", fontSize: "13px", lineHeight: 1.6 }}>
            {r.informations_manquantes.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "12px 14px", fontSize: "12.5px", lineHeight: 1.5 }}>
        <strong>TRAÇABILITÉ</strong> — Plan rédigé par l&apos;IA à partir du profil fourni, sans prix ni référence
        inventés ; le cadre budgétaire est calculé par le code à partir du budget retenu. La décision de transmission
        reste humaine.
        {outcome.costMad !== undefined && (
          <> Coût de cette exécution : {outcome.costMad.toFixed(3).replace(".", ",")} MAD.</>
        )}
      </div>
    </div>
  );
}