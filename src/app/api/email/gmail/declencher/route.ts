import { NextResponse } from "next/server";
import { adminApi } from "@/lib/api-admin";
import { declencherSupport } from "@/lib/email-declenchement";

export const maxDuration = 60;

export async function POST() {
  const a = await adminApi();
  if (a.err) return a.err;
  const { userId, orgId } = a.ctx;

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