import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { traiterSuivis } from "@/lib/suivi-traiter";

export const maxDuration = 60;

// Traitement manuel des étapes validées en attente de suivi (administrateurs). Le même traitement est lancé
// automatiquement après la validation d'un devis ; cette route reste utile pour rattraper des étapes en échec.
export async function POST() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (orgRole !== "org:admin")
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });

  const bilan = await traiterSuivis(orgId, userId);
  if ("erreur" in bilan) return NextResponse.json({ error: bilan.erreur }, { status: 500 });
  return NextResponse.json({ ok: true, ...bilan });
}