import { SocialLink } from "./Chips";
import type { IlyasRunState } from "./IlyasLiveRun";

const tile: React.CSSProperties = { background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" };
const tileLabel: React.CSSProperties = { fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" };

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

export default function IlyasResultPanel({ state }: { state: IlyasRunState }) {
  const { pending, outcome } = state;

  if (pending) return <Box>Recherche et extraction en cours…</Box>;
  if (!outcome) {
    return (
      <Box>
        Décris la requête de ciblage, coche d&apos;éventuels signaux d&apos;achat, puis lance « Lancer le sourcing
        avec l&apos;IA ». La liste de comptes s&apos;affichera ici.
      </Box>
    );
  }
  if (!outcome.ok) return <Box error>{outcome.error}</Box>;

  const r = outcome.result;
  const retenus = r.comptes.filter((c) => !c.deja_en_portefeuille);

  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "4px" }}>
        AGENT STUDIO · ILYAS · RÉSULTAT RÉEL
      </div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "2px" }}>Liste de comptes ciblés</h2>
      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>{r.requete}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
        <div style={tile}>
          <div style={tileLabel}>COMPTES RETENUS</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{r.comptes_retenus}</div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>ÉCARTÉS · DÉJÀ EN PORTEFEUILLE</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{r.dedoublonnage_actif ? r.comptes_ecartes : "—"}</div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>CONTACT NOMINATIF TROUVÉ</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{r.pct_contact_trouve} %</div>
        </div>
      </div>

      {retenus.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
          Aucun compte neuf retenu pour cette requête — essaie d&apos;élargir les critères ou de décocher des signaux.
        </p>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--muted-foreground)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <span>COMPTE & CONTACT</span>
            <span>SCORE</span>
          </div>
          {retenus.map((c) => (
            <div key={c.nom + c.source_url} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "13px" }}>
                  <a href={c.source_url} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>
                    {c.nom}
                  </a>{" "}
                  <span style={{ fontWeight: 400, color: "var(--muted-foreground)" }}>
                    {[c.ville, c.secteur].filter(Boolean).join(" · ")}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                  {c.contact_nom ? `${c.contact_nom}${c.contact_role ? ` · ${c.contact_role}` : ""}` : "Aucun contact nominatif trouvé"}
                </div>
                 <div style={{ display: "flex", gap: "10px", fontSize: "11.5px", marginTop: "3px" }}>
                  {c.linkedin_url ? (
                    <SocialLink network="linkedin" href={c.linkedin_url} />
                  ) : (
                    <span style={{ color: "var(--muted-foreground)" }}>LinkedIn : non trouvé</span>
                  )}
                  {c.facebook_url && <SocialLink network="facebook" href={c.facebook_url} />}
                  {c.instagram_url && <SocialLink network="instagram" href={c.instagram_url} />}
                </div>
                <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                  {c.signal_detecte && (
                    <span style={{ fontSize: "10px", padding: "1px 7px", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      {c.signal_detecte}
                    </span>
                  )}
                  {c.effectif && <span style={{ fontSize: "10px", color: "var(--muted-foreground)" }}>{/^\d+$/.test(c.effectif) ? `${c.effectif} salariés` : c.effectif}</span>}
                </div>
              </div>
              <div style={{ fontWeight: 700 }}>{c.score}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "12px 14px", fontSize: "12.5px", lineHeight: 1.5, marginTop: "20px" }}>
        <strong>TRAÇABILITÉ</strong> — Chaque compte porte l&apos;URL de sa source. Sourcing réel via Brave Search ;
        aucun message n&apos;est envoyé par Ilyas, la liste part vers Yasmine · Capture.
        {outcome.costMad !== undefined && <> Coût de cette exécution : {outcome.costMad.toFixed(3).replace(".", ",")} MAD.</>}
      </div>
    </div>
  );
}