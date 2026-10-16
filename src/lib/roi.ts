import { sql } from "@/lib/db";

export type SourceRoi = "hypothese" | "mesure" | "client";

export type RoiLigne = {
  agentId: number;
  agentNom: string;
  tache: string;
  profil: string;
  source: SourceRoi; // la moins fiable entre la tâche et le profil
  executions: number;
  tempsEviteMin: number;
  valeurMad: number;
  coutIaMad: number;
};

export type RoiResume = {
  jours: number;
  lignes: RoiLigne[];
  totalTempsEviteMin: number;
  totalValeurMad: number;
  totalCoutIaMad: number;
  // Agents qui ont tourné sur la période mais sans tâche de référence : « à renseigner »
  sansReferentiel: { agentId: number; agentNom: string; executions: number }[];
};

const ORDRE: SourceRoi[] = ["hypothese", "client", "mesure"];

function moinsFiable(a: SourceRoi, b: SourceRoi): SourceRoi {
  return ORDRE.indexOf(a) <= ORDRE.indexOf(b) ? a : b;
}

// ROI d'une organisation sur les `jours` derniers jours, calculé à la lecture depuis agent_runs.
// Temps évité = exécutions réussies × max(0, temps humain − temps de contrôle).
// Valeur estimée = temps évité (heures) × coût horaire du profil (coût mensuel ÷ heures mensuelles).
// Les deux chiffres restent séparés ; la valeur est un gain de capacité, pas une économie de trésorerie.
export async function getRoiOrganisation(orgId: string, jours = 30): Promise<RoiResume> {
  const rows = await sql`
    SELECT t.agent_id, a.name AS agent_nom, t.tache, t.profil,
           t.source AS source_tache, p.source AS source_profil,
           t.temps_humain_min, t.temps_controle_min,
           p.cout_mensuel_mad, p.heures_mensuelles,
           COUNT(r.id)::int AS executions,
           COALESCE(SUM(r.cost_mad), 0) AS cout_ia
    FROM roi_taches t
    JOIN roi_profils p ON p.org_id = t.org_id AND p.profil = t.profil
    JOIN agents a ON a.id = t.agent_id
    LEFT JOIN agent_runs r
      ON r.org_id = t.org_id AND r.agent_id = t.agent_id AND r.status = 'ok'
     AND r.created_at >= now() - make_interval(days => ${jours})
    WHERE t.org_id = ${orgId}
    GROUP BY t.agent_id, a.name, t.tache, t.profil, t.source, p.source,
             t.temps_humain_min, t.temps_controle_min, p.cout_mensuel_mad, p.heures_mensuelles
    ORDER BY a.name
  `;

  const lignes: RoiLigne[] = rows.map((r) => {
    const executions = Number(r.executions);
    const gainParRun = Math.max(0, Number(r.temps_humain_min) - Number(r.temps_controle_min));
    const tempsEviteMin = executions * gainParRun;
    const coutHoraire = Number(r.cout_mensuel_mad) / Number(r.heures_mensuelles);
    return {
      agentId: Number(r.agent_id),
      agentNom: String(r.agent_nom),
      tache: String(r.tache),
      profil: String(r.profil),
      source: moinsFiable(r.source_tache as SourceRoi, r.source_profil as SourceRoi),
      executions,
      tempsEviteMin,
      valeurMad: (tempsEviteMin / 60) * coutHoraire,
      coutIaMad: Number(r.cout_ia),
    };
  });

  const manquants = await sql`
    SELECT r.agent_id, a.name AS agent_nom, COUNT(*)::int AS executions
    FROM agent_runs r
    JOIN agents a ON a.id = r.agent_id
    WHERE r.org_id = ${orgId} AND r.status = 'ok'
      AND r.created_at >= now() - make_interval(days => ${jours})
      AND NOT EXISTS (
        SELECT 1 FROM roi_taches t WHERE t.org_id = r.org_id AND t.agent_id = r.agent_id
      )
    GROUP BY r.agent_id, a.name
    ORDER BY COUNT(*) DESC
  `;

  return {
    jours,
    lignes,
    totalTempsEviteMin: lignes.reduce((s, l) => s + l.tempsEviteMin, 0),
    totalValeurMad: lignes.reduce((s, l) => s + l.valeurMad, 0),
    totalCoutIaMad: lignes.reduce((s, l) => s + l.coutIaMad, 0),
    sansReferentiel: manquants.map((m) => ({
      agentId: Number(m.agent_id),
      agentNom: String(m.agent_nom),
      executions: Number(m.executions),
    })),
  };
}