import { NextResponse } from "next/server";
import { adminApi } from "@/lib/api-admin";
import { randomBytes } from "crypto";

export async function GET() {
  const a = await adminApi();
  if (a.err) return a.err;
  const { orgId } = a.ctx;

  const state = randomBytes(24).toString("hex");
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.readonly",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
  // Le state est lié à l'organisation et expire en 10 minutes
  res.cookies.set("gmail_oauth_state", `${state}.${orgId}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/api/email/gmail",
  });
  return res;
}