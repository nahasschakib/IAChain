"use server";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { resolveTenant } from "@/lib/tenant";

const MODES = ["AUTO", "APPROBATION_REQUISE", "BLOQUE"];

type Resultat = { ok: boolean; error?: string };

// Règle de gouvernance : les clients demandent, seul l'Admin SOCYTAY applique.
// Cette action n'enregistre qu'une demande : aucun réglage n'est modifié ici.
export async function demanderChangementPermission(
  permissionId: number,
  modeDemande: string,
  motif?: string
): Promise<Resultat> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { userId, orgId, isOrgAdmin } = t.ctx;
  if (!isOrgAdmin) {
    return { ok: false, error: "Seul un administrateur de l'organisation peut faire une demande." };
  }
  if (!MODES.includes(modeDemande)) return { ok: false, error: "Mode non valide." };

  const perm = await sql`SELECT mode FROM agent_permissions WHERE id = ${permissionId}`;
  if (!perm[0]) return { ok: false, error: "Permission introuvable." };
  if (perm[0].mode === "BLOQUE") {
    return { ok: false, error: "Cette action est bloquée au niveau du catalogue." };
  }

  const reglage = await sql`
    SELECT mode FROM org_agent_permissions
    WHERE org_id = ${orgId} AND permission_id = ${permissionId}
  `;
  const actuel = (reglage[0]?.mode ?? perm[0].mode) as string;
  if (actuel === modeDemande) return { ok: false, error: "L'action est déjà dans ce mode." };

  const existante = await sql`
    SELECT 1 FROM org_permission_requests
    WHERE org_id = ${orgId} AND permission_id = ${permissionId} AND status = 'en_attente'
    LIMIT 1
  `;
  if (existante.length > 0) {
    return { ok: false, error: "Une demande est déjà en attente pour cette action." };
  }

  const motifPropre = motif?.trim() ? motif.trim().slice(0, 500) : null;
  await sql`
    INSERT INTO org_permission_requests (org_id, permission_id, requested_mode, reason, requested_by)
    VALUES (${orgId}, ${permissionId}, ${modeDemande}, ${motifPropre}, ${userId})
  `;

  revalidatePath("/agents/[slug]", "page");
  return { ok: true };
}
// Décision de l'Admin SOCYTAY sur une demande d'organisation (règle de gouvernance du 06/10).
export async function decideDemandePermission(
  demandeId: number,
  decision: "accepte" | "refuse",
  note?: string
): Promise<Resultat> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
  const { userId, isPlatformAdmin } = t.ctx;
  if (!isPlatformAdmin) return { ok: false, error: "Seul l'Admin SOCYTAY peut décider." };
  if (decision !== "accepte" && decision !== "refuse") return { ok: false, error: "Décision non valide." };

  const notePropre = note?.trim() ? note.trim().slice(0, 500) : null;

  // On « prend » la demande en une seule instruction : une double décision est impossible.
  const prise = await sql`
    UPDATE org_permission_requests
    SET status = ${decision}, decided_by = ${userId}, decided_at = now(), decision_note = ${notePropre}
    WHERE id = ${demandeId} AND status = 'en_attente'
    RETURNING org_id, permission_id, requested_mode
  `;
  if (prise.length === 0) return { ok: false, error: "Demande introuvable ou déjà traitée." };

  if (decision === "accepte") {
    const { org_id, permission_id, requested_mode } = prise[0];
    try {
      const perm = await sql`SELECT mode FROM agent_permissions WHERE id = ${permission_id}`;
      if (!perm[0] || perm[0].mode === "BLOQUE") {
        throw new Error("Action bloquée au catalogue : aucune organisation ne peut la débloquer.");
      }
      await sql`
        INSERT INTO org_agent_permissions (org_id, permission_id, mode, granted_by, note)
        VALUES (${org_id}, ${permission_id}, ${requested_mode}, ${userId}, ${"Demande n°" + demandeId})
        ON CONFLICT (org_id, permission_id)
        DO UPDATE SET mode = EXCLUDED.mode, granted_by = EXCLUDED.granted_by,
                      granted_at = now(), note = EXCLUDED.note
      `;
    } catch (e) {
      // Le réglage n'a pas pu être appliqué : la demande redevient en attente.
      await sql`
        UPDATE org_permission_requests
        SET status = 'en_attente', decided_by = NULL, decided_at = NULL, decision_note = NULL
        WHERE id = ${demandeId}
      `;
      console.error("decideDemandePermission", e);
      return { ok: false, error: e instanceof Error ? e.message : "Erreur lors de l'application du réglage." };
    }
  }

  revalidatePath("/admin/permissions");
  revalidatePath("/agents/[slug]", "page");
  return { ok: true };
}