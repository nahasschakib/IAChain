import { sql } from "@/lib/db";
import type { SerieCategorie, JournalAuto  } from "@/components/agent-studio/types";

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
        SELECT categorie, MAX(quand) AS derniere
        FROM (
          SELECT categorie, decided_at AS quand
          FROM reponse_revisions
          WHERE org_id = ${orgId} AND agent_id = ${agentId} AND canal = ${canal}
            AND (modifie OR decision = 'rejete')
          UNION ALL
          SELECT categorie, correction_signalee_le AS quand
          FROM reponse_auto_journal
          WHERE org_id = ${orgId} AND agent_id = ${agentId} AND canal = ${canal}
            AND action_key = 'reponse_email'
            AND correction_signalee_le IS NOT NULL
        ) c
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
const FORMAT_DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Casablanca",
});

// Dernières entrées du journal des brouillons traités en automatique, et nombre
// d'entrées des 7 derniers jours. La date est formatée ici (côté serveur) pour
// éviter tout écart d'affichage entre serveur et navigateur.
export async function getJournalAuto(
  orgId: string,
  agentId: number,
  actionKey: string
): Promise<JournalAuto> {
  try {
    const rows = await sql`
      SELECT id, categorie, priorite, cree_le,
             LEFT(brouillon, 160) AS apercu,
             correction_signalee_le IS NOT NULL AS corrigee,
             COUNT(*) FILTER (WHERE cree_le > now() - interval '7 days') OVER () AS recents7j
      FROM reponse_auto_journal
      WHERE org_id = ${orgId} AND agent_id = ${agentId} AND action_key = ${actionKey}
      ORDER BY cree_le DESC
      LIMIT 10
    `;
    return {
      recents7j: rows.length > 0 ? Number(rows[0].recents7j) : 0,
      entrees: rows.map((r) => ({
        id: Number(r.id),
        categorie: r.categorie as string,
        priorite: (r.priorite as string | null) ?? null,
        date: FORMAT_DATE.format(new Date(r.cree_le as string | Date)),
        apercu: (r.apercu as string).replace(/\s+/g, " ").trim(),
        corrigee: Boolean(r.corrigee),
      })),
    };
  } catch (e) {
    console.error("getJournalAuto", e);
    return { recents7j: 0, entrees: [] };
  }
}
export async function getSeuilPromotion(
  orgId: string,
  agentId: number,
  actionKey: string
): Promise<number> {
  try {
    const rows = await sql`
      SELECT seuil FROM org_autonomie_seuil
      WHERE org_id = ${orgId} AND agent_id = ${agentId} AND action_key = ${actionKey}
    `;
    const v = Number(rows[0]?.seuil);
    return Number.isInteger(v) && v > 0 ? v : SEUIL_PROMOTION;
  } catch (e) {
    console.error("getSeuilPromotion", e);
    return SEUIL_PROMOTION;
  }
}