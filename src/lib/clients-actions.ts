"use server";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { resolveTenant } from "@/lib/tenant";

type Resultat = { ok: boolean; error?: string };

const REFUS = "Réservé à l'administrateur de la plateforme.";

// Toutes les actions de ce fichier sont réservées à l'administrateur de SOCYTAY.
async function plateforme() {
  const t = await resolveTenant();
  return t.ok && t.ctx.isPlatformAdmin ? t.ctx : null;
}

// Ouvre l'essai de 14 jours d'un client en attente (le décompte part de l'activation).
export async function activerEssai(orgId: string): Promise<Resultat> {
  const ctx = await plateforme();
  if (!ctx) return { ok: false, error: REFUS };
  const rows = await sql`
    UPDATE tenants
    SET status = 'actif',
        essai_fin = now() + interval '14 days',
        activated_at = COALESCE(activated_at, now())
    WHERE org_id = ${orgId} AND is_platform = false AND status = 'en_attente'
    RETURNING org_id
  `;
  if (rows.length === 0) return { ok: false, error: "Ce client n'est plus en attente." };
  revalidatePath("/admin/clients");
  return { ok: true };
}

// Enregistre un paiement (virement ou espèces) et prolonge « payé jusqu'au » d'un mois ou d'un an,
// à partir de la plus tardive de trois dates : la fin de la période déjà payée, la fin de l'essai en cours (le client garde ses 14 jours) ou aujourd'hui.
// Une seule requête : le paiement et la prolongation sont enregistrés ensemble ou pas du tout.
export async function enregistrerPaiement(
  orgId: string,
  montant: number,
  mode: string,
  periodicite: string,
  reference: string
): Promise<Resultat> {
  const ctx = await plateforme();
  if (!ctx) return { ok: false, error: REFUS };
  if (!Number.isFinite(montant) || montant <= 0 || montant > 10000000) {
    return { ok: false, error: "Montant non valide." };
  }
  if (!["virement", "especes"].includes(mode)) return { ok: false, error: "Mode de paiement non valide." };
  if (!["mensuel", "annuel"].includes(periodicite)) return { ok: false, error: "Périodicité non valide." };
  const ref = reference.trim();
  if (ref.length < 3 || ref.length > 100) {
    return { ok: false, error: "Référence obligatoire (3 à 100 caractères) : numéro de virement ou de reçu." };
  }

  const rows = await sql`
    WITH base AS (
      SELECT org_id, GREATEST(now(), COALESCE(paye_jusqu_au, now()), COALESCE(essai_fin, now())) AS debut
      FROM tenants
      WHERE org_id = ${orgId} AND is_platform = false AND status IN ('en_attente', 'actif')
    ), ins AS (
      INSERT INTO tenant_paiements (org_id, montant_mad, mode, periodicite, reference, couvre_jusqu_au, saisi_par)
      SELECT org_id, ${montant}::numeric, ${mode}::text, ${periodicite}::text, ${ref}::text,
             debut + CASE WHEN ${periodicite}::text = 'annuel' THEN interval '1 year' ELSE interval '1 month' END,
             ${ctx.userId}::text
      FROM base
      RETURNING org_id, couvre_jusqu_au
    )
    UPDATE tenants t
    SET paye_jusqu_au = ins.couvre_jusqu_au,
        status = 'actif',
        activated_at = COALESCE(t.activated_at, now())
    FROM ins
    WHERE t.org_id = ins.org_id
    RETURNING t.paye_jusqu_au
  `;
  if (rows.length === 0) return { ok: false, error: "Paiement impossible : client introuvable ou suspendu." };
  revalidatePath("/admin/clients");
  return { ok: true };
}

export async function suspendreClient(orgId: string): Promise<Resultat> {
  const ctx = await plateforme();
  if (!ctx) return { ok: false, error: REFUS };
  const rows = await sql`
    UPDATE tenants SET status = 'suspendu'
    WHERE org_id = ${orgId} AND is_platform = false AND status <> 'suspendu'
    RETURNING org_id
  `;
  if (rows.length === 0) return { ok: false, error: "Client introuvable ou déjà suspendu." };
  revalidatePath("/admin/clients");
  return { ok: true };
}

// Réactive un client suspendu : ses dates d'essai et de paiement ne sont pas modifiées
// (s'il est échu, il reste bloqué jusqu'au prochain paiement).
export async function reactiverClient(orgId: string): Promise<Resultat> {
  const ctx = await plateforme();
  if (!ctx) return { ok: false, error: REFUS };
  const rows = await sql`
    UPDATE tenants SET status = 'actif'
    WHERE org_id = ${orgId} AND is_platform = false AND status = 'suspendu'
    RETURNING org_id
  `;
  if (rows.length === 0) return { ok: false, error: "Ce client n'est pas suspendu." };
  revalidatePath("/admin/clients");
  return { ok: true };
}