"use client";
import { useState } from "react";
import type { LinaRunState } from "./LinaLiveRun";

const tile: React.CSSProperties = { background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" };
const tileLabel: React.CSSProperties = { fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" };
const card: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: "12px", marginBottom: "16px", overflow: "hidden" };
const cardHead: React.CSSProperties = { background: "var(--steel-tint)", padding: "12px 16px", fontSize: "13px", fontWeight: 700 };

const FORMAT_COLOR: Record<string, string> = {
  "Article de blog": "#047857",
  "Posts réseaux sociaux": "#0369A1",
  Newsletter: "#B45309",
  "Landing page": "#6D28D9",
};
const colorOf = (f: string) => FORMAT_COLOR[f] ?? "#475569";

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

function FormatChip({ format }: { format: string }) {
  const c = colorOf(format);
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
      {format}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        } catch {}
      }}
      style={{
        font: "inherit",
        fontSize: "11px",
        fontWeight: 600,
        padding: "3px 10px",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        background: "transparent",
        cursor: "pointer",
        color: "var(--muted-foreground)",
      }}
    >
      {ok ? "Copié ✓" : "Copier"}
    </button>
  );
}

export default function LinaResultPanel({ state }: { state: LinaRunState }) {
    function Corps({ text }: { text: string }) {
  return (
    <div style={{ fontSize: "13.5px", lineHeight: 1.6 }}>
      {text.split("\n").map((l, i) =>
        l.startsWith("## ") ? (
          <div key={i} style={{ fontWeight: 700, fontSize: "14.5px", margin: "14px 0 4px" }}>
            {l.slice(3)}
          </div>
        ) : l.trim() === "" ? (
          <div key={i} style={{ height: "8px" }} />
        ) : (
          <div key={i}>{l}</div>
        ),
      )}
    </div>
  );
}
  const { pending, outcome } = state;
  if (pending) return <Box>Rédaction des contenus en cours…</Box>;
  if (!outcome) {
    return (
      <Box>
        Décris le brief (ou laisse-le vide pour reprendre l&apos;objectif du plan d&apos;Othmane), choisis les formats, le
        ton et le registre, puis lance « Rédiger les contenus avec l&apos;IA ». Les contenus s&apos;afficheront ici.
      </Box>
    );
  }
  if (!outcome.ok) return <Box error>{outcome.error}</Box>;

  const r = outcome.result;

  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "4px" }}>
        AGENT STUDIO · LINA · RÉSULTAT RÉEL
      </div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "2px" }}>Contenus rédigés</h2>
      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
        {r.brief_source === "plan" && <strong>Brief repris du plan d&apos;Othmane · </strong>}
        {r.brief}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
        <div style={tile}>
          <div style={tileLabel}>CONTENUS</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{r.contenus.length}</div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>MOTS</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{r.nb_mots_total}</div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>TON</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{r.ton}</div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>REGISTRE</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{r.registre}</div>
        </div>
      </div>

      {r.contenus.map((c, i) => {
                const full = `${c.titre}\n\n${c.corps.replace(/^## /gm, "")}${c.cta ? `\n\n${c.cta}` : ""}`;
        return (
          <div key={i} style={card}>
            <div style={{ ...cardHead, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <FormatChip format={c.format} />
                <span>{c.titre}</span>
              </span>
              <CopyButton text={full} />
            </div>
            <div style={{ padding: "14px 16px" }}>
                           <Corps text={c.corps} />
              {c.cta && (
                <div style={{ marginTop: "10px", fontSize: "13px", fontWeight: 700 }}>
                  Appel à l&apos;action : <span style={{ fontWeight: 400 }}>{c.cta}</span>
                </div>
              )}
              <div style={{ marginTop: "10px", fontSize: "11px", color: "var(--muted-foreground)" }}>
                {c.nb_mots} mots{c.semaine ? ` · semaine ${c.semaine} du plan` : ""}
              </div>
            </div>
          </div>
        );
      })}

      {r.briefs_visuels.length > 0 && (
        <div style={card}>
          <div style={cardHead}>Briefs visuels</div>
          <div style={{ padding: "12px 16px", fontSize: "13px", lineHeight: 1.6 }}>
            {r.briefs_visuels.map((b, i) => (
              <div key={i} style={{ marginBottom: "8px" }}>
                <strong>{b.contenu}</strong> — {b.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {r.points_a_verifier.length > 0 && (
        <div style={card}>
          <div style={cardHead}>Points à vérifier avant publication</div>
          <div style={{ padding: "12px 16px", fontSize: "13px", lineHeight: 1.6 }}>
            {r.points_a_verifier.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <span style={{ color: "var(--muted-foreground)" }}>•</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
      )}

           <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "12px 14px", fontSize: "12.5px", lineHeight: 1.5 }}>
        <strong>TRAÇABILITÉ</strong> —{" "}
        {r.plan_utilise ? "Rédigé à partir du dernier plan d'Othmane" : "Aucun plan d'Othmane disponible"}
        {r.veille_utilisee ? " et de la dernière veille de Sofia." : "."} Les affirmations à confirmer sont listées
        ci-dessus : relis-les avant toute publication. Rien n&apos;est publié : les contenus passent par la validation
        avant diffusion.
        {outcome.costMad !== undefined && <> Coût de cette exécution : {outcome.costMad.toFixed(3).replace(".", ",")} MAD.</>}
      </div>
    </div>
  );
}