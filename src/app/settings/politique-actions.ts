"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { resolveTenant } from "@/lib/tenant";
import { getOrgProfile } from "@/lib/org-profile";
import { erreursPolitique, type GrilleSegment } from "@/lib/politique-regle";

export type PolitiqueResult = { ok: true; version: number } | { ok: false; error: string };

export type PolitiqueInput = {
  plafonds: { standard: number; grands_comptes: number; derogation: number };
  segments: Record<string, string>; // segment de l'organisation -> "standard" | "grands_comptes"
  motifs: string[];
  note?: string;
};

const REFUS = "Réservé aux administrateurs de l'organisation.";
const MAX_MOTIFS = 12;
const MAX_MOTIF = 80;
const MAX_NOTE = 200;

async function adminCtx() {
  const t = await resolveTenant();
  return t.ok && t.ctx.isOrgAdmin ? t.ctx : null;
}

const arrondi = (v: unknown) => Math.round(Number(v) * 100) / 100;

// Enregistre une nouvelle version de la politique tarifaire de l'organisation.
// Une seule instruction SQL : l'ancienne version passe en « archivee » et la nouvelle en « active »
// ensemble, avec ses grilles et ses segments. En cas d'erreur, rien n'est écrit.
export async function savePolitique(input: PolitiqueInput): Promise<PolitiqueResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: REFUS };

  const plafonds = {
    standard: arrondi(input?.plafonds?.standard),
    grands_comptes: arrondi(input?.plafonds?.grands_comptes),
    derogation: arrondi(input?.plafonds?.derogation),
  };

  // Les segments doivent être des valeurs actives de la liste de l'organisation.
  const org = await getOrgProfile(ctx.orgId);
  const autorises = new Set(org.segments);
  const segments: Record<string, GrilleSegment> = {};
  for (const [segment, grille] of Object.entries(input?.segments ?? {})) {
    if (!autorises.has(segment)) return { ok: false, error: `Segment « ${segment} » inconnu pour cette organisation.` };
    if (grille !== "standard" && grille !== "grands_comptes")
      return { ok: false, error: `Grille inconnue pour le segment « ${segment} ».` };
    segments[segment] = grille;
  }

  const motifs = (Array.isArray(input?.motifs) ? input.motifs : [])
    .map((m) => String(m ?? "").replace(/\s+/g, " ").trim())
    .filter((m) => m.length > 0);
  if (motifs.length > MAX_MOTIFS) return { ok: false, error: `${MAX_MOTIFS} motifs d'exception maximum.` };
  if (motifs.some((m) => m.length > MAX_MOTIF))
    return { ok: false, error: `Motif trop long (${MAX_MOTIF} caractères maximum).` };

  const note = String(input?.note ?? "").trim().slice(0, MAX_NOTE) || null;

  const erreurs = erreursPolitique({ plafonds, segments, motifs });
  if (erreurs.length > 0) return { ok: false, error: erreurs[0] };

  const grilles = [
    { code: "standard", pct: plafonds.standard },
    { code: "grands_comptes", pct: plafonds.grands_comptes },
    { code: "derogation", pct: plafonds.derogation },
  ];
  const segs = Object.entries(segments).map(([segment, grille]) => ({ segment, grille }));

  try {
    const rows = await sql`
      WITH v AS (
        SELECT COALESCE(MAX(version), 0) + 1 AS n FROM politique_tarifaire WHERE org_id = ${ctx.orgId}
      ),
      old AS (
        UPDATE politique_tarifaire SET statut = 'archivee'
        WHERE org_id = ${ctx.orgId} AND statut = 'active' RETURNING id
      ),
      nouveau AS (
        INSERT INTO politique_tarifaire (org_id, version, statut, motifs, note, created_by)
        SELECT ${ctx.orgId}, v.n, 'active', ${JSON.stringify(motifs)}::jsonb, ${note}, ${ctx.userId} FROM v
        WHERE (SELECT count(*) FROM old) >= 0
        RETURNING id, version
      ),
      g AS (
        INSERT INTO politique_grilles (politique_id, code, plafond_pct)
        SELECT nouveau.id, x.code, x.pct
        FROM nouveau, jsonb_to_recordset(${JSON.stringify(grilles)}::jsonb) AS x(code text, pct numeric)
        RETURNING 1
      ),
      s AS (
        INSERT INTO politique_segments (politique_id, segment, grille_code)
        SELECT nouveau.id, x.segment, x.grille
        FROM nouveau, jsonb_to_recordset(${JSON.stringify(segs)}::jsonb) AS x(segment text, grille text)
        RETURNING 1
      )
      SELECT id, version FROM nouveau
    `;
    revalidatePath("/settings");
    return { ok: true, version: Number(rows[0].version) };
  } catch (e) {
    console.error("savePolitique", e);
    return { ok: false, error: "Enregistrement impossible. Réessaie dans un instant." };
  }
}