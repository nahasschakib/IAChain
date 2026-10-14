import { sql } from "@/lib/db";

export type PermissionMode = "AUTO" | "APPROBATION_REQUISE" | "BLOQUE";


// Contexte d'une action précise : permet d'appliquer les promotions de
// l'organisation et les garde-fous (priorité).
export type PermissionScope = {
  orgId: string;
  categorie: string;
  canal: string;
  priorite: string | null;
};

// Une priorité haute ou critique n'est jamais traitée en automatique.
const PRIORITES_SENSIBLES = ["haute", "critique"]; 

// Niveau d'autonomie d'une action d'un agent, lu dans agent_permissions.
// Prudent par défaut : sans ligne (ou en cas d'erreur de lecture),
// l'action exige une approbation.
export async function getPermissionMode(
  agentId: number,
  actionKey: string,
  scope?: PermissionScope
): Promise<PermissionMode> {
  let mode: PermissionMode = "APPROBATION_REQUISE";
  try {
    const rows = await sql`
      SELECT mode FROM agent_permissions
      WHERE agent_id = ${agentId} AND action_key = ${actionKey}
      LIMIT 1
    `;
    const lu = rows[0]?.mode as string | undefined;
    if (lu === "AUTO" || lu === "APPROBATION_REQUISE" || lu === "BLOQUE") {
      mode = lu;
    }
  } catch (e) {
    console.error("getPermissionMode", e);
    return "APPROBATION_REQUISE";
  }

  if (!scope || mode === "BLOQUE") return mode;

  if (scope.priorite && PRIORITES_SENSIBLES.includes(scope.priorite.toLowerCase())) {
    return "APPROBATION_REQUISE";
  }

  if (mode === "AUTO") return mode;

  try {
    const promo = await sql`
      SELECT 1 FROM org_autonomie
      WHERE org_id = ${scope.orgId} AND agent_id = ${agentId} AND action_key = ${actionKey}
        AND categorie = ${scope.categorie} AND canal = ${scope.canal}
        AND revoked_at IS NULL
      LIMIT 1
    `;
    if (promo.length > 0) return "AUTO";
  } catch (e) {
    console.error("getPermissionMode promotion", e);
  }
  return mode;
}