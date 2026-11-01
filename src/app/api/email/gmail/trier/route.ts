import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { trierEmailsOrganisation } from "@/lib/email-tri-org";

export async function POST() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (orgRole !== "org:admin") {
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });
  }

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