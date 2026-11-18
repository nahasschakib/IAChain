import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import ClientsAdmin, { type ClientItem, type PaiementItem } from "@/components/admin/ClientsAdmin";
import { sql } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const formatJour = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Africa/Casablanca",
});

function jour(v: unknown): string {
  return formatJour.format(new Date(v as string));
}

export default async function AdminClientsPage() {
  const { isPlatformAdmin } = await getTenantContext();
  if (!isPlatformAdmin) notFound();

  const rows = await sql`
    SELECT org_id, name, status, essai_fin, paye_jusqu_au, created_at,
           COALESCE(paye_jusqu_au > now(), false) AS paye_en_cours,
           COALESCE(essai_fin > now(), false) AS essai_en_cours
    FROM tenants
    WHERE is_platform = false
    ORDER BY created_at DESC
  `;
  
  const clients: ClientItem[] = rows.map((r) => {
    const base = { orgId: r.org_id as string, nom: r.name as string, inscrit: jour(r.created_at) };
    if (r.status === "suspendu") return { ...base, statut: "suspendu", etat: "Suspendu" };
    if (r.status !== "actif") return { ...base, statut: "attente", etat: "En attente d'activation" };
    const paye = r.paye_jusqu_au ? new Date(r.paye_jusqu_au as string) : null;
    const essai = r.essai_fin ? new Date(r.essai_fin as string) : null;
    if (paye && r.paye_en_cours) return { ...base, statut: "paye", etat: `Payé jusqu'au ${jour(paye)}` };
    if (essai && r.essai_en_cours) return { ...base, statut: "essai", etat: `Essai jusqu'au ${jour(essai)}` };
    return { ...base, statut: "echu", etat: "Échu : accès bloqué" };
  });

  const dernier = await sql`
    SELECT p.id, COALESCE(t.name, p.org_id) AS org_name, p.montant_mad, p.mode, p.periodicite,
           p.reference, p.paye_le, p.couvre_jusqu_au
    FROM tenant_paiements p
    LEFT JOIN tenants t ON t.org_id = p.org_id
    ORDER BY p.created_at DESC
    LIMIT 10
  `;
  const paiements: PaiementItem[] = dernier.map((r) => ({
    id: Number(r.id),
    orgName: r.org_name as string,
    montant: String(r.montant_mad),
    mode: r.mode as string,
    periodicite: r.periodicite as string,
    reference: r.reference as string,
    payeLe: jour(r.paye_le),
    couvreJusqu: jour(r.couvre_jusqu_au),
  }));

  const enAttente = clients.filter((c) => c.statut === "attente").length;

  return (
    <AppShell
      topbar={
        <>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>Clients</span>
          <span style={{ fontSize: 12, color: "var(--graphite)" }}>
            {enAttente === 0 ? "Aucun client en attente" : `${enAttente} client${enAttente > 1 ? "s" : ""} à activer`}
          </span>
        </>
      }
    >
      <ClientsAdmin clients={clients} paiements={paiements} />
    </AppShell>
  );
}