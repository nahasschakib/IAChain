import { NextResponse } from "next/server";
import { resolveTenant } from "@/lib/tenant";
import { executeKarima, listerPourKarima } from "@/lib/karima-core";

// Facturation de Karima, réservée aux administrateurs de l'organisation.
// GET : devis validés et état de leur facture. POST : { validation_id, client_ice?, client_identifiant_fiscal?,
// client_rc?, client_adresse?, reference_commande? } établit le brouillon et l'approbation « Validation de la facture ».

async function admin() {
  const t = await resolveTenant();
  if (!t.ok) return { err: NextResponse.json({ error: "Accès refusé." }, { status: 401 }) };
  if (!t.ctx.isOrgAdmin)
    return { err: NextResponse.json({ error: "Réservé aux administrateurs de l'organisation." }, { status: 403 }) };
  return { ctx: t.ctx };
}

export async function GET() {
  const a = await admin();
  if (a.err) return a.err;
  return NextResponse.json({ devis: await listerPourKarima(a.ctx.orgId) });
}

export async function POST(req: Request) {
  const a = await admin();
  if (a.err) return a.err;
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {}
  const r = await executeKarima(
    { orgId: a.ctx.orgId, userId: a.ctx.userId },
    {
      validationId: Number(body.validation_id),
      clientIce: String(body.client_ice ?? ""),
      clientIdentifiantFiscal: String(body.client_identifiant_fiscal ?? ""),
      clientRc: String(body.client_rc ?? ""),
      clientAdresse: String(body.client_adresse ?? ""),
      referenceCommande: String(body.reference_commande ?? ""),
    }
  );
  return NextResponse.json(r.outcome, { status: r.outcome.ok ? 200 : 409 });
}