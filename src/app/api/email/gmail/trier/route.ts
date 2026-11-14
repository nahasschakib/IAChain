import { NextResponse } from "next/server";
import { adminApi } from "@/lib/api-admin";
import { trierEmailsOrganisation } from "@/lib/email-tri-org";

export async function POST() {
  const a = await adminApi();
  if (a.err) return a.err;
  const { userId, orgId } = a.ctx;

  const r = await trierEmailsOrganisation(orgId, userId);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({
    ok: true,
    tries: r.tries,
    echecs: r.echecs,
    restants_possibles: r.restantsPossibles,
    par_categorie: r.parCategorie,
    cout_mad: r.coutMad,
  });
}