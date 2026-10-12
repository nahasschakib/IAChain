import { sql } from "@/lib/db";
import type { SerieCategorie } from "@/components/agent-studio/types";

// Nombre de brouillons acceptés d'affilée (sans correction ni rejet) avant de
// pouvoir proposer la promotion en automatique. Rendu configurable par
// organisation à la pièce 4.
export const SEUIL_PROMOTION = 30;

// Série en cours par catégorie : décisions « approuvé sans modification »
// postérieures à la dernière correction ou au dernier rejet de la catégorie.
export async function getSeriesReponses(
  orgId: string,
  agentId: number,
  canal = "email"
): Promise<SerieCategorie[]> {
  try {
    const rows = await sql`
      SELECT r.categorie,
             COUNT(*) FILTER (WHERE r.decided_at > COALESCE(d.derniere, '-infinity'::timestamptz)) AS serie,
             COUNT(*) AS total,
             COUNT(*) FILTER (WHERE r.modifie OR r.decision = 'rejete') AS corriges
      FROM reponse_revisions r
      LEFT JOIN (
        SELECT categorie, MAX(decided_at) AS derniere
        FROM reponse_revisions
        WHERE org_id = ${orgId} AND agent_id = ${agentId} AND canal = ${canal}
          AND (modifie OR decision = 'rejete')
        GROUP BY categorie
      ) d ON d.categorie = r.categorie
      WHERE r.org_id = ${orgId} AND r.agent_id = ${agentId} AND r.canal = ${canal}
      GROUP BY r.categorie
      ORDER BY r.categorie
    `;
    return rows.map((r) => ({
      categorie: r.categorie as string,
      serie: Number(r.serie),
      total: Number(r.total),
      corriges: Number(r.corriges),
    }));
  } catch (e) {
    console.error("getSeriesReponses", e);
    return [];
  }
}