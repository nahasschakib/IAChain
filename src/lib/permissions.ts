import { sql } from "@/lib/db";

export type PermissionMode = "AUTO" | "APPROBATION_REQUISE" | "BLOQUE";

// Niveau d'autonomie d'une action d'un agent, lu dans agent_permissions.
// Prudent par défaut : sans ligne (ou en cas d'erreur de lecture),
// l'action exige une approbation.
export async function getPermissionMode(
  agentId: number,
  actionKey: string
): Promise<PermissionMode> {
  try {
    const rows = await sql`
      SELECT mode FROM agent_permissions
      WHERE agent_id = ${agentId} AND action_key = ${actionKey}
      LIMIT 1
    `;
    const mode = rows[0]?.mode as string | undefined;
    if (mode === "AUTO" || mode === "APPROBATION_REQUISE" || mode === "BLOQUE") {
      return mode;
    }
  } catch (e) {
    console.error("getPermissionMode", e);
  }
  return "APPROBATION_REQUISE";
}