import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { chiffrer } from "@/lib/email-crypto";

export async function GET(req: NextRequest) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId || orgRole !== "org:admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookie = req.cookies.get("gmail_oauth_state")?.value;

  // Vérifie que le state correspond et appartient à la même organisation
  if (!code || !state || cookie !== `${state}.${orgId}`) {
    return NextResponse.json({ error: "État OAuth invalide" }, { status: 400 });
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });
  const tokens = await tokenRes.json();
  if (!tokenRes.ok || !tokens.refresh_token) {
    return NextResponse.json({ error: "Échange du code refusé par Google" }, { status: 400 });
  }

  const profRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profil = await profRes.json();
  if (!profRes.ok || !profil.emailAddress) {
    return NextResponse.json({ error: "Profil Gmail illisible" }, { status: 400 });
  }

  const refreshChiffre = chiffrer(tokens.refresh_token);
  await sql`
    INSERT INTO email_connexions (org_id, fournisseur, compte_email, refresh_token_chiffre, scopes, statut)
    VALUES (${orgId}, 'gmail', ${profil.emailAddress}, ${refreshChiffre}, ${tokens.scope ?? ""}, 'actif')
    ON CONFLICT (org_id, fournisseur, compte_email)
    DO UPDATE SET refresh_token_chiffre = EXCLUDED.refresh_token_chiffre,
                  scopes = EXCLUDED.scopes,
                  statut = 'actif'
  `;

  const res = NextResponse.redirect(new URL("/integrations?gmail=ok", req.url));
  res.cookies.delete({ name: "gmail_oauth_state", path: "/api/email/gmail" });
  return res;
}