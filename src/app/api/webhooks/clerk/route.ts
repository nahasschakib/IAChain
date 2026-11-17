import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";

// Webhook Clerk : garde la table tenants alignée sur les organisations Clerk.
// Toujours vérifier la signature (secret CLERK_WEBHOOK_SIGNING_SECRET).
export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("Webhook Clerk : signature invalide", err);
    return new Response("Signature invalide", { status: 400 });
  }

  try {
    if (evt.type === "organization.created") {
      const { id, name } = evt.data;
      // Nouveau client : ligne en attente (statut par défaut), activée à la main par SOCYTAY.
      await sql`INSERT INTO tenants (org_id, name) VALUES (${id}, ${name}) ON CONFLICT DO NOTHING`;
    } else if (evt.type === "organization.updated") {
      const { id, name } = evt.data;
      await sql`UPDATE tenants SET name = ${name} WHERE org_id = ${id}`;
    } else if (evt.type === "organization.deleted") {
      const { id } = evt.data;
      // On suspend sans supprimer les données ; la plateforme n'est jamais touchée.
      if (id) {
        await sql`UPDATE tenants SET status = 'suspendu' WHERE org_id = ${id} AND is_platform = false`;
      }
    }
  } catch (err) {
    console.error("Webhook Clerk : erreur base de données", err);
    return new Response("Erreur serveur", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}