import { NextResponse } from "next/server";
import { resolveTenant } from "@/lib/tenant";
import { xmlDeLaFacture } from "@/lib/karima-core";

// Téléchargement du XML d'une facture validée, réservé aux administrateurs de l'organisation.
// GET /api/karima/xml?facture_id=N
export async function GET(req: Request) {
  const t = await resolveTenant();
  if (!t.ok) return NextResponse.json({ error: "Accès refusé." }, { status: 401 });
  if (!t.ctx.isOrgAdmin) return NextResponse.json({ error: "Réservé aux administrateurs de l'organisation." }, { status: 403 });

  const id = Number(new URL(req.url).searchParams.get("facture_id"));
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Numéro de facture invalide." }, { status: 400 });

  try {
    const r = await xmlDeLaFacture(t.ctx.orgId, id);
    if (!r) return NextResponse.json({ error: "Facture introuvable ou non validée." }, { status: 404 });
    return new NextResponse(r.xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="facture-${r.numero}.xml"`,
      },
    });
  } catch (e) {
    console.error("karima xml", e);
    return NextResponse.json({ error: "Le XML n'a pas pu être généré." }, { status: 500 });
  }
}