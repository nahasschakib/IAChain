"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { resolveTenant } from "@/lib/tenant";
import { ensureOrgOptions } from "@/lib/org-profile";

export type ProfileResult = { ok: true } | { ok: false; error: string };

const MAX_OFFER = 2000;
const MAX_LABEL = 60;
const MAX_PER_KIND = 12;
const REFUS = "Réservé aux administrateurs de l'organisation.";

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

async function adminCtx() {
  const t = await resolveTenant();
  return t.ok && t.ctx.isOrgAdmin ? t.ctx : null;
}

export async function saveOffer(offer: string): Promise<ProfileResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: REFUS };
  const text = String(offer ?? "").trim();
  if (text.length > MAX_OFFER) return { ok: false, error: `Offre trop longue (${MAX_OFFER} caractères maximum).` };
  await sql`
    INSERT INTO org_profile (org_id, offer, updated_at)
    VALUES (${ctx.orgId}, ${text}, now())
    ON CONFLICT (org_id) DO UPDATE SET offer = EXCLUDED.offer, updated_at = now()
  `;
  revalidatePath("/settings");
  return { ok: true };
}

export async function addOption(kind: string, label: string): Promise<ProfileResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: REFUS };
  if (kind !== "segment" && kind !== "enjeu") return { ok: false, error: "Type de liste inconnu." };

  const clean = String(label ?? "").replace(/\s+/g, " ").trim();
  if (clean.length < 2) return { ok: false, error: "Libellé trop court." };
  if (clean.length > MAX_LABEL) return { ok: false, error: `Libellé trop long (${MAX_LABEL} caractères maximum).` };
  if (norm(clean) === "indetermine")
    return { ok: false, error: "« Indéterminé » est réservé : l'IA l'utilise quand elle ne peut pas trancher." };

  await ensureOrgOptions(ctx.orgId);
  const rows = await sql`SELECT id, label, active FROM org_options WHERE org_id = ${ctx.orgId} AND kind = ${kind}`;
  const same = rows.find((r) => norm(r.label as string) === norm(clean));

  if (same) {
    if (same.active) return { ok: false, error: "Cette valeur existe déjà." };
    await sql`UPDATE org_options SET active = true WHERE id = ${same.id as number} AND org_id = ${ctx.orgId}`;
  } else {
    if (rows.length >= MAX_PER_KIND)
      return { ok: false, error: `${MAX_PER_KIND} valeurs maximum par liste : désactive-en une avant d'en ajouter.` };
    const next = await sql`
      SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM org_options WHERE org_id = ${ctx.orgId} AND kind = ${kind}
    `;
    await sql`
      INSERT INTO org_options (org_id, kind, label, sort_order)
      VALUES (${ctx.orgId}, ${kind}, ${clean}, ${Number(next[0].n)})
    `;
  }
  revalidatePath("/settings");
  return { ok: true };
}

export async function setOptionActive(id: number, active: boolean): Promise<ProfileResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: REFUS };

  const rows = await sql`SELECT kind FROM org_options WHERE id = ${id} AND org_id = ${ctx.orgId}`;
  if (!rows[0]) return { ok: false, error: "Valeur introuvable." };

  if (!active) {
    const left = await sql`
      SELECT COUNT(*) AS n FROM org_options
      WHERE org_id = ${ctx.orgId} AND kind = ${rows[0].kind as string} AND active AND id <> ${id}
    `;
    if (Number(left[0].n) < 1) return { ok: false, error: "Garde au moins une valeur active dans la liste." };
  }
  await sql`UPDATE org_options SET active = ${active} WHERE id = ${id} AND org_id = ${ctx.orgId}`;
  revalidatePath("/settings");
  return { ok: true };
}