"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { resolveTenant } from "@/lib/tenant";
import { getSeriesReponses, SEUIL_PROMOTION } from "@/lib/autonomie";

const ACTIONS_PROMOUVABLES = ["reponse_email"];

type Resultat = { ok: boolean; error?: string };

// Règle de gouvernance : les clients demandent, seul l'Admin SOCYTAY applique.
export async function accorderPromotion(
  agentId: number,
  actionKey: string,
  categorie: string,
  canal = "email"
): Promise<Resultat> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { userId, orgId, isPlatformAdmin } = t.ctx;
  if (!isPlatformAdmin) return { ok: false, error: "Seul l'Admin SOCYTAY peut accorder une promotion." };
  if (!ACTIONS_PROMOUVABLES.includes(actionKey)) return { ok: false, error: "Action non promouvable." };

  const perm = await sql`
    SELECT 1 FROM agent_permissions WHERE agent_id = ${agentId} AND action_key = ${actionKey} LIMIT 1
  `;
  if (perm.length === 0) return { ok: false, error: "Permission introuvable." };

  // Le seuil est revérifié côté serveur, jamais d'après le client.
  const series = await getSeriesReponses(orgId, agentId, canal);
  const s = series.find((x) => x.categorie === categorie);
  if (!s || s.serie < SEUIL_PROMOTION) {
    return { ok: false, error: `Seuil non atteint (${s?.serie ?? 0} / ${SEUIL_PROMOTION}).` };
  }

  const res = await sql`
    INSERT INTO org_autonomie
      (org_id, agent_id, action_key, categorie, canal, serie_atteinte, seuil_applique, granted_by)
    VALUES (${orgId}, ${agentId}, ${actionKey}, ${categorie}, ${canal}, ${s.serie}, ${SEUIL_PROMOTION}, ${userId})
    ON CONFLICT (org_id, agent_id, action_key, categorie, canal) WHERE revoked_at IS NULL DO NOTHING
    RETURNING id
  `;
  if (res.length === 0) return { ok: false, error: "Cette catégorie est déjà en automatique." };

  revalidatePath("/agents/[slug]", "page");
  return { ok: true };
}

export async function revoquerPromotion(
  agentId: number,
  actionKey: string,
  categorie: string,
  canal = "email",
  motif?: string
): Promise<Resultat> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { userId, orgId, isPlatformAdmin } = t.ctx;
  if (!isPlatformAdmin) return { ok: false, error: "Seul l'Admin SOCYTAY peut révoquer une promotion." };

  const res = await sql`
    UPDATE org_autonomie
    SET revoked_at = now(), revoked_by = ${userId},
        revoked_reason = ${motif?.trim() || "Révoquée par l'Admin SOCYTAY"}
    WHERE org_id = ${orgId} AND agent_id = ${agentId} AND action_key = ${actionKey}
      AND categorie = ${categorie} AND canal = ${canal} AND revoked_at IS NULL
    RETURNING id
  `;
  if (res.length === 0) return { ok: false, error: "Aucune promotion active pour cette catégorie." };

  revalidatePath("/agents/[slug]", "page");
  return { ok: true };
}