import type { KarimaRunState } from "./KarimaLiveRun";

const card: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" };
const tile: React.CSSProperties = { background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" };
const tileLabel: React.CSSProperties = { fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" };
const mad = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Box({ children, error }: { children: React.ReactNode; error?: boolean }) {
  return (
    <div style={{ padding: "40px", border: "1px dashed var(--border)", borderRadius: "12px", textAlign: "center", color: error ? "var(--red)" : "var(--muted-foreground)" }}>
      {children}
    </div>
  );
}

export default function KarimaResultPanel({ state }: { state: KarimaRunState }) {
  const { pending, outcome } = state;
  if (pending) return <Box>Karima établit la facture…</Box>;
  if (!outcome)
    return (
      <div style={{ padding: "28px", border: "1px dashed var(--border)", borderRadius: "12px", color: "var(--muted-foreground)", fontSize: 13, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Comment établir une facture</div>
        Choisis un devis validé par un humain, vérifie l&apos;identité légale du client, puis clique sur « Établir la facture ». Les montants sont repris
        du devis et recalculés par le code ; aucune IA n&apos;intervient. La facture est ensuite soumise à une validation humaine, qui lui attribue son numéro.
      </div>
    );
  if (!outcome.ok) return <Box error>{outcome.error}</Box>;

  const r = outcome.result;
  const taux = String(r.tva_pct).replace(".", ",");
  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "4px" }}>AGENT STUDIO · KARIMA · RÉSULTAT RÉEL</div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "2px" }}>Facture · {r.client}</h2>
      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
        {r.devis_version ? `Devis ${r.devis_version} · ` : ""}ICE client {r.client_ice} · Brouillon en attente de validation
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <div style={tile}>
          <div style={tileLabel}>TOTAL HT AVANT REMISE</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{mad(r.total_brut_ht)}</div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>REMISE</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{mad(r.remise_montant)}</div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>NET HT</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{mad(r.total_net_ht)}</div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>TOTAL TTC (MAD)</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{mad(r.total_ttc)}</div>
        </div>
      </div>

      <div style={card}>
        <div style={{ padding: "10px 14px", background: "var(--steel-tint)", fontSize: 12, fontWeight: 600 }}>Détail</div>
        <div style={{ padding: 14, fontSize: 13, lineHeight: 1.6 }}>
          <p style={{ margin: "0 0 8px" }}>
            TVA {taux} % sur {mad(r.total_net_ht)} : {mad(r.tva_montant)} MAD.
          </p>
          <p style={{ margin: "0 0 8px", color: "var(--muted-foreground)" }}>
            {r.compte_client === "cree" && "Fiche client créée avec cette identité légale."}
            {r.compte_client === "existant" && "Fiche client mise à jour avec cette identité légale."}
            {r.compte_client === "non_enregistre" && "L'identité n'a pas pu être enregistrée sur la fiche client ; elle figure sur la facture."}
          </p>
          <p style={{ margin: 0, fontWeight: 600 }}>
            Le numéro (AAAA-NNNN) est attribué à la validation : décide la facture dans <a href="/approvals">Approbations</a>.
          </p>
        </div>
      </div>

      <div style={{ background: "var(--steel-tint)", borderRadius: 10, padding: "12px 14px", fontSize: "12.5px", lineHeight: 1.5 }}>
        <strong>TRAÇABILITÉ</strong> — Montants repris du devis validé par un humain et recalculés par le code ; un écart d&apos;un centime refuse la facture.
        Aucune IA, coût nul. Aucun envoi : la transmission à la plateforme DGI n&apos;est pas branchée (spécifications non publiées).
      </div>
    </div>
  );
}