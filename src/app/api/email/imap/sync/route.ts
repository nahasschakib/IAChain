import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { synchroniserImap } from "@/lib/email-sync-imap";

export async function POST() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (orgRole !== "org:admin")
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });

  const r = await synchroniserImap(orgId);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ ok: true, lus: r.lus, nouveaux: r.nouveaux });
}