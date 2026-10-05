import { sql } from "@/lib/db";

export function rec(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

// Dernier résultat réussi d'un agent pour l'organisation (le champ peut être stocké en objet ou en texte JSON).
export async function loadLatestResult(orgId: string, slug: string): Promise<Record<string, unknown> | null> {
  const rows = await sql`
    SELECT r.result FROM agent_runs r
    JOIN agents a ON a.id = r.agent_id
    WHERE a.slug = ${slug} AND r.org_id = ${orgId} AND r.status = 'ok' AND r.result IS NOT NULL
    ORDER BY r.id DESC LIMIT 1
  `;
  if (!rows[0]) return null;
  const brut = rows[0].result;
  if (typeof brut === "string") {
    try {
      return rec(JSON.parse(brut));
    } catch {
      return null;
    }
  }
  return rec(brut);
}