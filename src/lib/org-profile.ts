import { sql } from "@/lib/db";
import { SEGMENTS, ENJEUX } from "@/lib/karim";

export type OrgProfile = {
  offer: string;
  segments: string[];
  enjeux: string[];
};

// Profil commercial d'une organisation. Sans valeurs en base, les listes par défaut s'appliquent.
export async function getOrgProfile(orgId: string): Promise<OrgProfile> {
  const [profile, options] = await Promise.all([
    sql`SELECT offer FROM org_profile WHERE org_id = ${orgId}`,
    sql`
      SELECT kind, label FROM org_options
      WHERE org_id = ${orgId} AND active
      ORDER BY kind, sort_order, id
    `,
  ]);
  const segments = options.filter((o) => o.kind === "segment").map((o) => o.label as string);
  const enjeux = options.filter((o) => o.kind === "enjeu").map((o) => o.label as string);
  return {
    offer: ((profile[0]?.offer as string | undefined) ?? "").trim(),
    segments: segments.length > 0 ? segments : [...SEGMENTS],
    enjeux: enjeux.length > 0 ? enjeux : [...ENJEUX],
  };
}