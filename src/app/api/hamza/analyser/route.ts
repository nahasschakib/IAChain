import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { lancerAnalyseHamza } from "@/lib/hamza-analyse-org";

export const maxDuration = 60;

const JOURS_DEFAUT = 7;
const JOURS_MAX = 90;

export async function POST(req: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (orgRole !== "org:admin")
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });

  let jours = JOURS_DEFAUT;
  try {
    const body = await req.json();
    const n = Math.floor(Number(body?.jours));
    if (Number.isFinite(n) && n >= 1) jours = Math.min(n, JOURS_MAX);
  } catch {}

  const r = await lancerAnalyseHamza(orgId, userId, jours);
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: r.status });

  return NextResponse.json({
    ok: true,
    analyse_id: r.analyseId,
    nb_emails: r.nbEmails,
    causes: r.causes,
    recommandations: r.recommandations,
  });
}