import type { YasmineRunState } from "./YasmineLiveRun";
import { ficheToText } from "@/lib/yasmine";

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

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
      <span style={{ color: "var(--muted-foreground)" }}>{k}</span>
      <span style={{ fontWeight: 600, textAlign: "right" }}>{v || "—"}</span>
    </div>
  );
}

export default function YasmineResultPanel({ state }: { state: YasmineRunState }) {
  const { pending, outcome } = state;

  if (pending) return <Box>Analyse du signal en cours…</Box>;
  if (!outcome) {
    return (
      <Box>
        Collez le signal brut, puis lancez « Capturer avec l&apos;IA ». La fiche prospect et les informations
        manquantes s&apos;afficheront ici.
      </Box>
    );
  }
  if (!outcome.ok) return <Box error>{outcome.error}</Box>;

  const r = outcome.result;
  const color =
    r.verdict === "Fiche complète"
      ? "var(--emerald, #2f8f5b)"
      : r.verdict === "Fiche partielle"
        ? "var(--amber)"
        : "var(--red)";

  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "4px" }}>
        AGENT STUDIO · YASMINE · RÉSULTAT RÉEL
      </div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "2px" }}>
        {r.societe ? `${r.societe} · ` : ""}
        {r.verdict}
      </h2>
      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
        Source : {r.source || "non précisée"}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
        <div style={tile}>
          <div style={tileLabel}>COMPLÉTUDE</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{r.completude}/4</div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>VERDICT</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color }}>{r.verdict}</div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>DOUBLON CRM</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{r.doublon_crm}</div>
        </div>
      </div>

      <div style={card}>
        <div style={cardHead}>Fiche prospect</div>
        <div style={{ padding: "14px", display: "grid", gap: "8px", fontSize: "13px" }}>
          <Row k="Société" v={r.societe} />
          <Row k="Contact" v={r.contact_nom} />
          <Row k="Fonction" v={r.contact_fonction} />
          <Row k="E-mail" v={r.email} />
          <Row k="Téléphone" v={r.telephone} />
          <Row k="Secteur" v={r.secteur} />
          <Row k="Besoin exprimé" v={r.besoin} />
        </div>
      </div>

      {r.notes && (
        <div style={card}>
          <div style={cardHead}>Notes</div>
          <p style={{ margin: 0, padding: "14px", fontSize: "13px", lineHeight: 1.6 }}>{r.notes}</p>
        </div>
      )}

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

      <div style={card}>
        <div style={cardHead}>Texte prêt pour l&apos;agent Mehdi</div>
        <pre
          style={{
            margin: 0,
            padding: "14px",
            fontSize: "12.5px",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            userSelect: "all",
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          {ficheToText(r)}
        </pre>
      </div>

      <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "12px 14px", fontSize: "12.5px", lineHeight: 1.5 }}>
        <strong>TRAÇABILITÉ</strong> — Fiche générée par l&apos;IA à partir du signal brut. La complétude est calculée
        par le code ; l&apos;e-mail et le téléphone ne sont conservés que s&apos;ils figurent dans le signal.
        {outcome.costMad !== undefined && (
          <> Coût de cette exécution : {outcome.costMad.toFixed(3).replace(".", ",")} MAD.</>
        )}
      </div>
    </div>
  );
}