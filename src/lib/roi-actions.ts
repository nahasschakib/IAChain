"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { resolveTenant } from "@/lib/tenant";

type Resultat = { ok: boolean; error?: string };

const SOURCES = ["hypothese", "client", "mesure"];

async function garde() {
  const t = await resolveTenant();
  if (!t.ok || !t.ctx.isOrgAdmin) return null;
  return t.ctx;
}

function nombre(v: unknown): number {
  return typeof v === "number" ? v : Number(String(v).replace(",", "."));
}

export async function enregistrerProfil(
  profil: string,
  coutMensuel: number,
  heures: number,
  source: string
): Promise<Resultat> {
  const ctx = await garde();
  if (!ctx) return { ok: false, error: "Action réservée aux administrateurs de l'organisation." };

  const nom = String(profil ?? "").trim();
  const cout = nombre(coutMensuel);
  const h = nombre(heures);
  if (nom.length < 1 || nom.length > 60) return { ok: false, error: "Le nom du profil est obligatoire (60 caractères maximum)." };
  if (!Number.isFinite(cout) || cout <= 0 || cout > 1000000) return { ok: false, error: "Le coût mensuel doit être un montant positif." };
  if (!Number.isInteger(h) || h < 1 || h > 300) return { ok: false, error: "Les heures mensuelles doivent être un entier entre 1 et 300." };
  if (!SOURCES.includes(source)) return { ok: false, error: "Source invalide." };

  try {
    await sql`
      INSERT INTO roi_profils (org_id, profil, cout_mensuel_mad, heures_mensuelles, source, modifie_par, modifie_le)
      VALUES (${ctx.orgId}, ${nom}, ${cout}, ${h}, ${source}, ${ctx.userId}, now())
      ON CONFLICT (org_id, profil) DO UPDATE
        SET cout_mensuel_mad = EXCLUDED.cout_mensuel_mad,
            heures_mensuelles = EXCLUDED.heures_mensuelles,
            source = EXCLUDED.source,
            modifie_par = EXCLUDED.modifie_par,
            modifie_le = now()
    `;
  } catch (e) {
    console.error("enregistrerProfil", e);
    return { ok: false, error: "Enregistrement impossible." };
  }
  revalidatePath("/analytics/roi");
  return { ok: true };
}

export async function enregistrerTache(
  agentId: number,
  tache: string,
  profil: string,
  humainMin: number,
  controleMin: number,
  source: string
): Promise<Resultat> {
  const ctx = await garde();
  if (!ctx) return { ok: false, error: "Action réservée aux administrateurs de l'organisation." };

  const libelle = String(tache ?? "").trim();
  const humain = nombre(humainMin);
  const controle = nombre(controleMin);
  if (!Number.isInteger(agentId) || agentId <= 0) return { ok: false, error: "Choisissez un agent." };
  if (libelle.length < 1 || libelle.length > 120) return { ok: false, error: "La tâche est obligatoire (120 caractères maximum)." };
  if (!Number.isFinite(humain) || humain <= 0 || humain > 2400) return { ok: false, error: "Le temps humain doit être positif (en minutes, 2 400 maximum)." };
  if (!Number.isFinite(controle) || controle < 0) return { ok: false, error: "Le temps de contrôle doit être zéro ou positif." };
  if (controle > humain) return { ok: false, error: "Le temps de contrôle ne peut pas dépasser le temps humain." };
  if (!SOURCES.includes(source)) return { ok: false, error: "Source invalide." };

  try {
    const p = await sql`SELECT 1 FROM roi_profils WHERE org_id = ${ctx.orgId} AND profil = ${profil} LIMIT 1`;
    if (p.length === 0) return { ok: false, error: "Ce profil n'existe pas : enregistrez-le d'abord." };
    await sql`
      INSERT INTO roi_taches (org_id, agent_id, tache, profil, temps_humain_min, temps_controle_min, source, modifie_par, modifie_le)
      VALUES (${ctx.orgId}, ${agentId}, ${libelle}, ${profil}, ${humain}, ${controle}, ${source}, ${ctx.userId}, now())
      ON CONFLICT (org_id, agent_id) DO UPDATE
        SET tache = EXCLUDED.tache,
            profil = EXCLUDED.profil,
            temps_humain_min = EXCLUDED.temps_humain_min,
            temps_controle_min = EXCLUDED.temps_controle_min,
            source = EXCLUDED.source,
            modifie_par = EXCLUDED.modifie_par,
            modifie_le = now()
    `;
  } catch (e) {
    console.error("enregistrerTache", e);
    return { ok: false, error: "Enregistrement impossible (agent inconnu ?)." };
  }
  revalidatePath("/analytics/roi");
  return { ok: true };
}

export async function supprimerTache(agentId: number): Promise<Resultat> {
  const ctx = await garde();
  if (!ctx) return { ok: false, error: "Action réservée aux administrateurs de l'organisation." };
  try {
    await sql`DELETE FROM roi_taches WHERE org_id = ${ctx.orgId} AND agent_id = ${agentId}`;
  } catch (e) {
    console.error("supprimerTache", e);
    return { ok: false, error: "Suppression impossible." };
  }
  revalidatePath("/analytics/roi");
  return { ok: true };
}

export async function supprimerProfil(profil: string): Promise<Resultat> {
  const ctx = await garde();
  if (!ctx) return { ok: false, error: "Action réservée aux administrateurs de l'organisation." };
  try {
    const u = await sql`SELECT 1 FROM roi_taches WHERE org_id = ${ctx.orgId} AND profil = ${profil} LIMIT 1`;
    if (u.length > 0) return { ok: false, error: "Ce profil est utilisé par une tâche : supprimez d'abord la tâche." };
    await sql`DELETE FROM roi_profils WHERE org_id = ${ctx.orgId} AND profil = ${profil}`;
  } catch (e) {
    console.error("supprimerProfil", e);
    return { ok: false, error: "Suppression impossible." };
  }
  revalidatePath("/analytics/roi");
  return { ok: true };
}