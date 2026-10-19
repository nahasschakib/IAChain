"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { resolveTenant } from "@/lib/tenant";
import { getSeriesReponses,  getSeriesSuivi, getSeuilPromotion } from "@/lib/autonomie";

const ACTIONS_PROMOUVABLES = ["reponse_email",  "envoi_suivi"];

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
   const series =
    actionKey === "envoi_suivi"
      ? await getSeriesSuivi(orgId, agentId, canal)
      : await getSeriesReponses(orgId, agentId, canal);
  const s = series.find((x) => x.categorie === categorie);
    const seuil = await getSeuilPromotion(orgId, agentId, actionKey);
  if (!s || s.serie < seuil) {
    return { ok: false, error: `Seuil non atteint (${s?.serie ?? 0}/ ${seuil}).` };
  }

  const res = await sql`
    INSERT INTO org_autonomie
      (org_id, agent_id, action_key, categorie, canal, serie_atteinte, seuil_applique, granted_by)
       VALUES (${orgId}, ${agentId}, ${actionKey}, ${categorie}, ${canal}, ${s.serie}, ${seuil}, ${userId})
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
export async function signalerCorrection(
  journalId: number,
  motif?: string,
  actionKey = "reponse_email"
): Promise<Resultat> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { userId, orgId, isPlatformAdmin } = t.ctx;
  if (!isPlatformAdmin) return { ok: false, error: "Seul l'Admin SOCYTAY peut signaler une correction." };
  if (!ACTIONS_PROMOUVABLES.includes(actionKey)) return { ok: false, error: "Action non concernée." };

  const rows =
    actionKey === "envoi_suivi"
      ? await sql`
          SELECT id, org_id, agent_id, action_key, categorie, canal, correction_signalee_le
          FROM suivi_auto_journal
          WHERE id = ${journalId} AND org_id = ${orgId}
        `
      : await sql`
          SELECT id, org_id, agent_id, action_key, categorie, canal, correction_signalee_le
          FROM reponse_auto_journal
          WHERE id = ${journalId} AND org_id = ${orgId}
        `;
  const entree = rows[0];
  if (!entree) return { ok: false, error: "Entrée introuvable." };
  if (entree.correction_signalee_le) return { ok: false, error: "Correction déjà signalée." };

  const motifPropre = motif?.trim() ? motif.trim().slice(0, 500) : null;

  // 1. Marquer l'entrée du journal
  if (actionKey === "envoi_suivi") {
    await sql`
      UPDATE suivi_auto_journal
      SET correction_signalee_le = now(),
          correction_signalee_par = ${userId},
          correction_motif = ${motifPropre}
      WHERE id = ${journalId} AND org_id = ${orgId}
    `;
  } else {
    await sql`
      UPDATE reponse_auto_journal
      SET correction_signalee_le = now(),
          correction_signalee_par = ${userId},
          correction_motif = ${motifPropre}
      WHERE id = ${journalId} AND org_id = ${orgId}
    `;
  }
  // 2. Rétrograder : révoquer la promotion active de cette catégorie
  await sql`
    UPDATE org_autonomie
    SET revoked_at = now(),
        revoked_by = ${userId},
        revoked_reason = ${"Correction signalée" + (motifPropre ? " : " + motifPropre : "")}
    WHERE org_id = ${entree.org_id}
      AND agent_id = ${entree.agent_id}
      AND action_key = ${entree.action_key}
      AND categorie = ${entree.categorie}
      AND canal = ${entree.canal}
      AND revoked_at IS NULL
  `;

  revalidatePath("/agents/[slug]", "page");
  return { ok: true };
}
export async function definirSeuil(
  agentId: number,
  actionKey: string,
  seuil: number
): Promise<Resultat> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { userId, orgId, isPlatformAdmin } = t.ctx;
  if (!isPlatformAdmin) return { ok: false, error: "Seul l'Admin SOCYTAY peut régler le seuil." };
  if (!ACTIONS_PROMOUVABLES.includes(actionKey)) return { ok: false, error: "Action non concernée." };
  if (!Number.isInteger(seuil) || seuil < 5 || seuil > 200) {
    return { ok: false, error: "Le seuil doit être un entier entre 5 et 200." };
  }

  await sql`
    INSERT INTO org_autonomie_seuil (org_id, agent_id, action_key, seuil, modifie_par)
    VALUES (${orgId}, ${agentId}, ${actionKey}, ${seuil}, ${userId})
    ON CONFLICT (org_id, agent_id, action_key)
    DO UPDATE SET seuil = EXCLUDED.seuil, modifie_par = EXCLUDED.modifie_par, modifie_le = now()
  `;

  revalidatePath("/agents/[slug]", "page");
  return { ok: true };
}