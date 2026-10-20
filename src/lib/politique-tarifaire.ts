import { sql } from "@/lib/db";
import type { GrilleSegment, PolitiqueTarifaire } from "@/lib/politique-regle";

// Politique tarifaire active d'une organisation, ou null si aucune (ou si elle est incomplète).
export async function getPolitiqueActive(orgId: string): Promise<PolitiqueTarifaire | null> {
  const rows = await sql`
    SELECT id, version, motifs FROM politique_tarifaire
    WHERE org_id = ${orgId} AND statut = 'active'
  `;
  const p = rows[0];
  if (!p) return null;
  const id = p.id as number;

  const [grilles, segs] = await Promise.all([
    sql`SELECT code, plafond_pct FROM politique_grilles WHERE politique_id = ${id}`,
    sql`SELECT segment, grille_code FROM politique_segments WHERE politique_id = ${id}`,
  ]);
  const plafond = (code: string): number | null => {
    const g = grilles.find((x) => x.code === code);
    return g ? Number(g.plafond_pct) : null;
  };
  const standard = plafond("standard");
  const grandsComptes = plafond("grands_comptes");
  const derogation = plafond("derogation");
  if (standard === null || grandsComptes === null || derogation === null) {
    console.error("getPolitiqueActive : politique incomplète", { orgId, id });
    return null;
  }

  const segments: Record<string, GrilleSegment> = {};
  for (const s of segs) segments[s.segment as string] = s.grille_code as GrilleSegment;
  const motifs = Array.isArray(p.motifs) ? (p.motifs as unknown[]).filter((m): m is string => typeof m === "string") : [];

  return {
    id,
    version: p.version as number,
    plafonds: { standard, grands_comptes: grandsComptes, derogation },
    segments,
    motifs,
  };
}