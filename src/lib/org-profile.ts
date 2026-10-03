import { sql } from "@/lib/db";
import { SEGMENTS, ENJEUX } from "@/lib/karim";

export type OrgProfile = {
  offer: string;
  segments: string[];
  enjeux: string[];
};

export type OrgOption = {
  id: number;
  kind: "segment" | "enjeu";
  label: string;
  active: boolean;
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

// Pour une organisation sans valeurs en base (créée après la migration 025),
// copie les listes par défaut afin que l'édition parte de la même base que l'IA.
export async function ensureOrgOptions(orgId: string): Promise<void> {
  const have = await sql`SELECT DISTINCT kind FROM org_options WHERE org_id = ${orgId}`;
  const kinds = new Set(have.map((r) => r.kind as string));
  const defaults: [string, readonly string[]][] = [
    ["segment", SEGMENTS],
    ["enjeu", ENJEUX],
  ];
  for (const [kind, labels] of defaults) {
    if (kinds.has(kind)) continue;
    for (let i = 0; i < labels.length; i++) {
      await sql`
        INSERT INTO org_options (org_id, kind, label, sort_order)
        VALUES (${orgId}, ${kind}, ${labels[i]}, ${i + 1})
        ON CONFLICT (org_id, kind, label) DO NOTHING
      `;
    }
  }
}

// Toutes les valeurs (actives et désactivées) pour l'écran d'édition.
export async function listOrgOptions(orgId: string): Promise<OrgOption[]> {
  await ensureOrgOptions(orgId);
  const rows = await sql`
    SELECT id, kind, label, active FROM org_options
    WHERE org_id = ${orgId}
    ORDER BY kind, sort_order, id
  `;
  return rows.map((r) => ({
    id: r.id as number,
    kind: r.kind as "segment" | "enjeu",
    label: r.label as string,
    active: Boolean(r.active),
  }));
}