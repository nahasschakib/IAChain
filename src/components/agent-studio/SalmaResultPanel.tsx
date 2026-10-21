import type { SalmaRunState } from "./SalmaLiveRun";
import { formatMAD } from "@/lib/catalogue-regle";
import type { SalmaResult } from "@/lib/salma";

const card: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" };
const cardHead: React.CSSProperties = { padding: "10px 14px", background: "var(--steel-tint)", fontSize: "12px", fontWeight: 600 };
const tile: React.CSSProperties = { background: "var(--steel-tint)", borderRadius: "10px", padding: "14px" };
const tileLabel: React.CSSProperties = { fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" };
const pct = (n: number) => `${String(n).replace(".", ",")} %`;

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

function controleRemise(r: SalmaResult): string {
  const p = r.remise_plafond;
  switch (r.remise_info) {
    case "dans_plafond":
      return p.defini ? `Remise de ${pct(r.remise_pct)} dans le plafond de ${pct(p.plafond_pct)} (politique tarifaire v${p.politique_version}).` : "";
    case "au_dela_plafond":
      return p.defini
        ? `Remise de ${pct(r.remise_pct)} au-delà du plafond de ${pct(p.plafond_pct)} : un motif d'exception et l'approbation de la direction seront requis (jusqu'à ${pct(p.plafond_derogation_pct)}).`
        : "";
    case "au_dela_derogation":
      return p.defini ? `Remise de ${pct(r.remise_pct)} au-delà du plafond absolu de ${pct(p.plafond_derogation_pct)} : elle sera refusée par le contrôle de remise.` : "";
    default:
      return `Plafond non défini : ${p.defini ? "" : p.raison}. La remise sera contrôlée manuellement.`;
  }
}

function controleBudget(r: SalmaResult): string {
  switch (r.position_budget) {
    case "dans_cadre":
      return `Total TTC dans le cadre budgétaire retenu (${r.budget}).`;
    case "sous_cadre":
      return `Total TTC en dessous du cadre budgétaire retenu (${r.budget}).`;
    case "au_dela_cadre":
      return `Total TTC au-delà du cadre budgétaire retenu (${r.budget}).`;
    default:
      return "Cadre budgétaire non précisé : aucun rapprochement possible.";
  }
}

export default function SalmaResultPanel({ state }: { state: SalmaRunState }) {
  const { pending, outcome } = state;

  if (pending) return <Box>Salma travaille sur la proposition…</Box>;
  if (!outcome) {
    const etapes: [string, string][] = [
      ["Décris le dossier", "Saisis le client, l'objectif du prospect et le cadre budgétaire, puis choisis la remise et le registre de rédaction."],
      ["Demande les lignes à l'IA", "Clique sur « Proposer les lignes avec l'IA » : elle choisit, dans ton catalogue de prestations, celles qui répondent au besoin."],
      ["Ajuste, puis chiffre", "Corrige les quantités, ajoute ou retire des lignes, indique le segment du client, puis clique sur « Chiffrer la proposition »."],
    ];
    return (
      <div style={{ padding: "28px", border: "1px dashed var(--border)", borderRadius: "12px", color: "var(--muted-foreground)" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "inherit", marginBottom: "14px" }}>
          Comment préparer une proposition
        </div>
        <div style={{ display: "grid", gap: "12px" }}>
          {etapes.map(([titre, aide], i) => (
            <div key={titre} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  border: "1px solid var(--border)",
                }}
              >
                {i + 1}
              </span>
              <div style={{ fontSize: "13px", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--foreground, inherit)" }}>{titre}.</strong> {aide}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: "12px", lineHeight: 1.5, marginTop: "16px" }}>
          La proposition s&apos;affichera ici. Les montants, la TVA et le délai sont calculés par le code ; rien n&apos;est envoyé au
          client avant le contrôle de la remise et l&apos;approbation.
        </div>
      </div>
    );
  }
  if (!outcome.ok) return <Box error>{outcome.error}</Box>;

  const r = outcome.result;

  return (
    <div>
      <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "4px" }}>
        AGENT STUDIO · SALMA · RÉSULTAT RÉEL
      </div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "2px" }}>Proposition · {r.client}</h2>
      <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
        {r.version ? `Version ${r.version} · ` : ""}Registre {r.registre}
        {r.segment ? ` · Segment ${r.segment}` : ""} · Remise {pct(r.remise_pct)}
        {r.delai_jours !== null ? ` · Mise en service ${r.delai_jours} jours après signature` : " · Délai à définir"}
      </p>

      <div style={card}>
        <div style={cardHead}>Mot d&apos;introduction</div>
        <p style={{ margin: 0, padding: "14px", fontSize: "13px", lineHeight: 1.6 }}>{r.introduction}</p>
        <div style={{ padding: "0 14px 12px", fontSize: "11px", color: "var(--muted-foreground)" }}>
          {r.introduction_source === "ia"
            ? "Rédigé par l'IA, sans montant : les chiffres sont ajoutés par le système."
            : "Texte standard : la rédaction de l'IA contenait des chiffres et a été écartée."}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
        <div style={tile}>
          <div style={tileLabel}>TOTAL HT</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{formatMAD(r.total_ht)} MAD</div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>REMISE</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>
            {pct(r.remise_pct)} · {formatMAD(r.remise_montant)} MAD
          </div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>TOTAL TTC</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{formatMAD(r.total_ttc)} MAD</div>
        </div>
      </div>

      <div style={card}>
        <div style={cardHead}>Détail du chiffrage</div>
        <div style={{ padding: "6px 14px" }}>
          {r.lignes.map((l, i) => (
            <div
              key={l.prestation_id}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                gap: 12,
                padding: "10px 0",
                borderTop: i === 0 ? "none" : "1px solid var(--border)",
                fontSize: "13px",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{l.libelle}</div>
                <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                  {l.quantite} × {formatMAD(l.prix_unitaire_ht)} MAD HT / {l.unite}
                  {l.delai_jours !== null ? ` · délai ${l.delai_jours} j` : ""}
                </div>
                {l.description && <div style={{ fontSize: "12px", marginTop: 2 }}>{l.description}</div>}
              </div>
              <div style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{formatMAD(l.total_ht)} MAD</div>
            </div>
          ))}
          <div style={{ borderTop: "1px solid var(--border)", padding: "10px 0", fontSize: "13px", display: "grid", gap: 4 }}>
            {[
              ["Total HT", `${formatMAD(r.total_ht)} MAD`],
              [`Remise ${pct(r.remise_pct)}`, `− ${formatMAD(r.remise_montant)} MAD`],
              ["Total net HT", `${formatMAD(r.total_net_ht)} MAD`],
              [`TVA ${pct(r.tva_pct)}`, `${formatMAD(r.tva_montant)} MAD`],
              ["Total TTC", `${formatMAD(r.total_ttc)} MAD`],
            ].map(([a, b], i, t) => (
              <div key={a} style={{ display: "flex", justifyContent: "space-between", fontWeight: i === t.length - 1 ? 700 : 400 }}>
                <span>{a}</span>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={cardHead}>Contrôles du code</div>
        <ul style={{ margin: 0, padding: "14px 14px 14px 32px", fontSize: "13px", lineHeight: 1.6 }}>
          <li>{controleRemise(r)}</li>
          <li>{controleBudget(r)}</li>
        </ul>
      </div>

      <div style={{ background: "var(--steel-tint)", borderRadius: "10px", padding: "12px 14px", fontSize: "12.5px", lineHeight: 1.5 }}>
        <strong>TRAÇABILITÉ</strong> — Lignes issues du catalogue de prestations de l&apos;organisation ; totaux, TVA, remise et délai
        calculés par le code ; introduction rédigée par l&apos;IA. Cette proposition passe par le contrôle de remise de Nadia puis
        par une approbation avant tout envoi.
        {outcome.costMad !== undefined && <> Coût de cette exécution : {outcome.costMad.toFixed(3).replace(".", ",")} MAD.</>}
      </div>
    </div>
  );
}