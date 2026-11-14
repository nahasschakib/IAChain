import { NextResponse } from "next/server";
import { adminApi } from "@/lib/api-admin";
import { traiterSuivis } from "@/lib/suivi-traiter";

export const maxDuration = 60;

// Traitement manuel des étapes validées en attente de suivi (administrateurs). Le même traitement est lancé
// automatiquement après la validation d'un devis ; cette route reste utile pour rattraper des étapes en échec.
export async function POST() {
  const a = await adminApi();
  if (a.err) return a.err;
  const { userId, orgId } = a.ctx;

  const bilan = await traiterSuivis(orgId, userId);
  if ("erreur" in bilan) return NextResponse.json({ error: bilan.erreur }, { status: 500 });
  return NextResponse.json({ ok: true, ...bilan });
}