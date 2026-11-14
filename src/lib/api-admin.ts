import { NextResponse } from "next/server";
import { resolveTenant } from "@/lib/tenant";

// Contrôle commun des routes /api réservées aux administrateurs de l'organisation :
// session valide, organisation active (pas suspendue ni en attente), rôle org:admin.
export async function adminApi() {
  const t = await resolveTenant();
  if (!t.ok) return { err: NextResponse.json({ error: "Accès refusé." }, { status: 401 }) };
  if (!t.ctx.isOrgAdmin)
    return { err: NextResponse.json({ error: "Réservé aux administrateurs de l'organisation." }, { status: 403 }) };
  return { ctx: t.ctx };
}