import AppShell from "@/components/AppShell";
import { getTenantContext } from "@/lib/tenant";
import { getRoiOrganisation } from "@/lib/roi";
import { sql } from "@/lib/db";
import RoiReferentiel from "@/components/analytics/RoiReferentiel";

export const dynamic = "force-dynamic";

const CARD_SHADOW = "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)";

function formatMAD(n: number): string {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n)} MAD`;
}

function formatMAD3(n: number): string {
  return `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(n)} MAD`;
}

function formatTemps(minutes: number): string {
  const min = Math.round(minutes);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
}

const SOURCE_LIBELLE: Record<string, string> = {
  hypothese: "Hypothèse",
  client: "Saisi par le client",
  mesure: "Mesuré",
};

export default async function RoiPage() {
    const { orgId, isOrgAdmin } = await getTenantContext();
  const roi = await getRoiOrganisation(orgId, 30);

  let profilsSaisis: { profil: string; coutMensuel: number; heures: number; source: string }[] = [];
  let tachesSaisies: {
    agentId: number; agentNom: string; tache: string; profil: string;
    humainMin: number; controleMin: number; source: string;
  }[] = [];
  let agentsOptions: { id: number; nom: string }[] = [];
  if (isOrgAdmin) {
    const [pr, ta, ag] = await Promise.all([
      sql`SELECT profil, cout_mensuel_mad, heures_mensuelles, source FROM roi_profils WHERE org_id = ${orgId} ORDER BY profil`,
      sql`
        SELECT t.agent_id, a.name AS agent_nom, t.tache, t.profil, t.temps_humain_min, t.temps_controle_min, t.source
        FROM roi_taches t JOIN agents a ON a.id = t.agent_id
        WHERE t.org_id = ${orgId} ORDER BY a.name
      `,
      sql`SELECT id, name FROM agents ORDER BY name`,
    ]);
    profilsSaisis = pr.map((r) => ({
      profil: String(r.profil),
      coutMensuel: Number(r.cout_mensuel_mad),
      heures: Number(r.heures_mensuelles),
      source: String(r.source),
    }));
    tachesSaisies = ta.map((r) => ({
      agentId: Number(r.agent_id),
      agentNom: String(r.agent_nom),
      tache: String(r.tache),
      profil: String(r.profil),
      humainMin: Number(r.temps_humain_min),
      controleMin: Number(r.temps_controle_min),
      source: String(r.source),
    }));
    agentsOptions = ag.map((r) => ({ id: Number(r.id), nom: String(r.name) }));
  }
  const ratio = roi.totalCoutIaMad > 0 ? roi.totalValeurMad / roi.totalCoutIaMad : null;

  const carte: React.CSSProperties = {
    background: "var(--card, #fff)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    boxShadow: CARD_SHADOW,
    padding: "16px 18px",
  };
  const etiquette: React.CSSProperties = {
    fontSize: 12,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--muted-foreground)",
  };
  const cellule: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid var(--border)" };

  return (
    <AppShell
      topbar={
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
          ROI des agents
        </span>
      }
    >
      <div style={{ padding: "24px 32px", maxWidth: 1100 }}>
        <p style={{ margin: "0 0 20px", color: "var(--muted-foreground)", fontSize: 14 }}>
          {roi.jours} derniers jours. Le temps évité et la valeur estimée sont des estimations de gain de
          capacité (temps humain de référence moins temps de contrôle), pas des économies de trésorerie.
          Chaque ligne indique la source de ses chiffres.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 28 }}>
          <div style={carte}>
            <div style={etiquette}>Temps évité</div>
            <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{formatTemps(roi.totalTempsEviteMin)}</div>
          </div>
          <div style={carte}>
            <div style={etiquette}>Valeur estimée</div>
            <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{formatMAD(roi.totalValeurMad)}</div>
          </div>
          <div style={carte}>
            <div style={etiquette}>Coût des agents (IA)</div>
            <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{formatMAD3(roi.totalCoutIaMad)}</div>
          </div>
          <div style={carte}>
            <div style={etiquette}>Valeur / coût</div>
            <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>
              {ratio === null ? "—" : `× ${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(ratio)}`}
            </div>
          </div>
        </div>

        {roi.lignes.length === 0 ? (
          <div style={{ ...carte, color: "var(--muted-foreground)" }}>
            Aucune tâche de référence n&apos;est encore renseignée pour votre organisation. Le ROI s&apos;affiche
            dès que les profils métier et les tâches de référence sont saisis.
          </div>
        ) : (
          <div style={{ ...carte, padding: 0, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--muted-foreground)" }}>
                  <th style={cellule}>Agent</th>
                  <th style={cellule}>Tâche de référence</th>
                  <th style={cellule}>Profil</th>
                  <th style={{ ...cellule, textAlign: "right" }}>Exécutions</th>
                  <th style={{ ...cellule, textAlign: "right" }}>Temps évité</th>
                  <th style={{ ...cellule, textAlign: "right" }}>Valeur estimée</th>
                  <th style={{ ...cellule, textAlign: "right" }}>Coût IA</th>
                  <th style={cellule}>Source</th>
                </tr>
              </thead>
              <tbody>
                {roi.lignes.map((l) => (
                  <tr key={l.agentId}>
                    <td style={{ ...cellule, fontWeight: 600 }}>{l.agentNom}</td>
                    <td style={cellule}>{l.tache}</td>
                    <td style={cellule}>{l.profil}</td>
                    <td style={{ ...cellule, textAlign: "right" }}>{l.executions}</td>
                    <td style={{ ...cellule, textAlign: "right" }}>{formatTemps(l.tempsEviteMin)}</td>
                    <td style={{ ...cellule, textAlign: "right" }}>{formatMAD(l.valeurMad)}</td>
                    <td style={{ ...cellule, textAlign: "right" }}>{formatMAD3(l.coutIaMad)}</td>
                    <td style={cellule}>{SOURCE_LIBELLE[l.source] ?? l.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {roi.sansReferentiel.length > 0 && (
          <div style={{ ...carte, marginTop: 20 }}>
            <div style={{ ...etiquette, marginBottom: 8 }}>À renseigner</div>
            <div style={{ fontSize: 14, color: "var(--muted-foreground)" }}>
              Ces agents ont travaillé sur la période mais n&apos;ont pas de tâche de référence :{" "}
              {roi.sansReferentiel.map((m) => `${m.agentNom} (${m.executions})`).join(", ")}.
            </div>
          </div>
        )}
        {isOrgAdmin && (
          <RoiReferentiel profils={profilsSaisis} taches={tachesSaisies} agents={agentsOptions} />
        )}
      </div>
    </AppShell>
  );
}