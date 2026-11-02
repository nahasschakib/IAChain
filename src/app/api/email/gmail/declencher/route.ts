import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { declencherSupport } from "@/lib/email-declenchement";

export const maxDuration = 60;

export async function POST() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (orgRole !== "org:admin")
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });

  const r = await declencherSupport(orgId, userId);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({
    ok: true,
    brouillons_a_valider: r.brouillonsAValider,
    brouillons_prets: r.brouillonsPrets,
    bloques: r.bloques,
    en_attente_humaine: r.enAttente,
    echecs: r.echecs,
    restants_possibles: r.restantsPossibles,
  });
}