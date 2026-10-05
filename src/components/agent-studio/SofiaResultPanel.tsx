import { CategoryChip } from "./Chips";
import type { SofiaRunState } from "./SofiaLiveRun";

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

export default function SofiaResultPanel({ state }: { state: SofiaRunState }) {
  const { pending, outcome } = state;

  if (pending) return <Box>Veille en cours : recherche et synthèse…</Box>;
  if (!outcome) {
    return (
      <Box>
        Décris la thématique, choisis les sources, la zone et la fréquence, puis lance « Lancer la veille avec
        l&apos;IA ». La note de veille s&apos;affichera ici.
      </Box>
    );
  }
  if (!outcome.ok) return <Box error>{outcome.error}</Box>;

  const r = outcome.result;
  const ready = r.statut === "Veille prête";

  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "4px" }}>
        AGENT STUDIO · SOFIA · RÉSULTAT RÉEL
      </div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "2px" }}>Note de veille — {r.statut}</h2>
      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
        {r.thematique} · {r.periode} · {r.zone}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
        <div style={tile}>
          <div style={tileLabel}>SIGNAUX RETENUS</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{r.signaux.length}</div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>ÉCARTS IDENTIFIÉS</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{r.ecarts.length}</div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>RÉSULTATS CONSULTÉS</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{r.nb_sources_consultees}</div>
        </div>
      </div>

      {r.opportunite && (
        <div style={card}>
          <div style={cardHead}>Opportunité · transmise à Othmane</div>
          <p style={{ margin: 0, padding: "14px", fontSize: "13px", lineHeight: 1.6 }}>{r.opportunite}</p>
        </div>
      )}

      {!ready && (
        <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
          Les signaux trouvés ne suffisent pas pour formuler une opportunité : précise la thématique ou élargis la période.
        </p>
      )}

      {r.signaux.length > 0 && (
        <div style={card}>
          <div style={cardHead}>Signaux de marché</div>
          {r.signaux.map((s) => (
            <div key={s.source_url} style={{ padding: "12px 14px", borderTop: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 600, fontSize: "13px" }}>
                <a href={s.source_url} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>
                  {s.titre}
                </a>
              </div>
              <div style={{ fontSize: "12.5px", lineHeight: 1.5, margin: "4px 0" }}>{s.resume}</div>
            
                <CategoryChip label={s.categorie} />
             
            </div>
          ))}
        </div>
      )}

      {r.ecarts.length > 0 && (
        <div style={card}>
          <div style={cardHead}>Écarts avec notre offre</div>
          <ul style={{ margin: 0, padding: "14px 14px 14px 32px", fontSize: "13px", lineHeight: 1.6 }}>
            {r.ecarts.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
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

      <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "12px 14px", fontSize: "12.5px", lineHeight: 1.5 }}>
        <strong>TRAÇABILITÉ</strong> — Chaque signal porte l&apos;URL de sa source. Recherche réelle via Brave Search ;
        l&apos;IA synthétise uniquement les extraits trouvés.
        {outcome.costMad !== undefined && <> Coût de cette exécution : {outcome.costMad.toFixed(3).replace(".", ",")} MAD.</>}
      </div>
    </div>
  );
}