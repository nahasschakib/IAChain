import { NextResponse } from "next/server";
import { adminApi } from "@/lib/api-admin";
import { lancerAnalyseHamza } from "@/lib/hamza-analyse-org";

export const maxDuration = 60;

const JOURS_DEFAUT = 7;
const JOURS_MAX = 90;

export async function POST(req: Request) {
  const a = await adminApi();
  if (a.err) return a.err;
  const { userId, orgId } = a.ctx;

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