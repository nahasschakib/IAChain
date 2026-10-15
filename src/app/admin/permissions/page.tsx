import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import DemandesAdmin, { type DemandeItem, type DecisionItem } from "@/components/admin/DemandesAdmin";
import { sql } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const formatDate = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Casablanca",
});

export default async function AdminPermissionsPage() {
  const { isPlatformAdmin } = await getTenantContext();
  if (!isPlatformAdmin) notFound();

  const enAttente = await sql`
    SELECT r.id, COALESCE(t.name, r.org_id) AS org_name, a.slug AS agent_slug,
           p.action_label, p.mode AS catalogue_mode, o.mode AS org_mode,
           r.requested_mode, r.reason, r.requested_at
    FROM org_permission_requests r
    JOIN agent_permissions p ON p.id = r.permission_id
    JOIN agents a ON a.id = p.agent_id
    LEFT JOIN tenants t ON t.org_id = r.org_id
    LEFT JOIN org_agent_permissions o ON o.org_id = r.org_id AND o.permission_id = r.permission_id
    WHERE r.status = 'en_attente'
    ORDER BY r.requested_at
  `;
  const demandes: DemandeItem[] = enAttente.map((r) => ({
    id: Number(r.id),
    orgName: r.org_name as string,
    agent: r.agent_slug as string,
    action: r.action_label as string,
    modeActuel: ((r.org_mode ?? r.catalogue_mode) as string),
    modeDemande: r.requested_mode as string,
    motif: (r.reason as string | null) ?? null,
    date: formatDate.format(new Date(r.requested_at as string)),
  }));

  const traitees = await sql`
    SELECT r.id, COALESCE(t.name, r.org_id) AS org_name, a.slug AS agent_slug,
           p.action_label, r.requested_mode, r.status, r.decision_note, r.decided_at
    FROM org_permission_requests r
    JOIN agent_permissions p ON p.id = r.permission_id
    JOIN agents a ON a.id = p.agent_id
    LEFT JOIN tenants t ON t.org_id = r.org_id
    WHERE r.status IN ('accepte', 'refuse')
    ORDER BY r.decided_at DESC
    LIMIT 10
  `;
  const decisions: DecisionItem[] = traitees.map((r) => ({
    id: Number(r.id),
    orgName: r.org_name as string,
    agent: r.agent_slug as string,
    action: r.action_label as string,
    modeDemande: r.requested_mode as string,
    statut: r.status as string,
    note: (r.decision_note as string | null) ?? null,
    date: formatDate.format(new Date(r.decided_at as string)),
  }));

  return (
    <AppShell
      topbar={
        <>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
            Demandes de permissions
          </span>
          <span style={{ fontSize: 12, color: "var(--graphite)" }}>
            {demandes.length === 0
              ? "Aucune demande en attente"
              : `${demandes.length} demande${demandes.length > 1 ? "s" : ""} à décider`}
          </span>
        </>
      }
    >
      <DemandesAdmin demandes={demandes} decisions={decisions} />
    </AppShell>
  );
}