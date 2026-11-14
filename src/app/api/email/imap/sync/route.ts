import { NextResponse } from "next/server";
import { adminApi } from "@/lib/api-admin";
import { synchroniserImap } from "@/lib/email-sync-imap";

export async function POST() {
  const a = await adminApi();
  if (a.err) return a.err;
  const { orgId } = a.ctx;

  const r = await synchroniserImap(orgId);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ ok: true, lus: r.lus, nouveaux: r.nouveaux });
}