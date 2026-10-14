import { sql } from "@/lib/db";
import type { SerieCategorie } from "@/components/agent-studio/types";

// Nombre de brouillons acceptés d'affilée (sans correction ni rejet) avant de
// pouvoir promouvoir en automatique. 30 par défaut ; AUTONOMIE_SEUIL permet de
// le réduire pour tester en local.
const seuilEnv = Number(process.env.AUTONOMIE_SEUIL);
export const SEUIL_PROMOTION = Number.isInteger(seuilEnv) && seuilEnv > 0 ? seuilEnv : 30;

// Série en cours par catégorie : décisions « approuvé sans modification »
// postérieures à la dernière correction ou au dernier rejet de la catégorie,
// avec l'état de la promotion en automatique.
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
             COUNT(*) FILTER (WHERE r.modifie OR r.decision = 'rejete') AS corriges,
             EXISTS (
               SELECT 1 FROM org_autonomie o
               WHERE o.org_id = ${orgId} AND o.agent_id = ${agentId}
                 AND o.action_key = 'reponse_email' AND o.canal = ${canal}
                 AND o.categorie = r.categorie AND o.revoked_at IS NULL
             ) AS promue
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
      promue: Boolean(r.promue),
    }));
  } catch (e) {
    console.error("getSeriesReponses", e);
    return [];
  }
}