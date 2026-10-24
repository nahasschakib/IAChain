import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getTenantContext } from "@/lib/tenant";
import { listerFactures } from "@/lib/factures";

export const dynamic = "force-dynamic";

const CARD_SHADOW = "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)";
const STATUT: Record<string, string> = {
  brouillon: "Brouillon",
  a_valider: "En attente de validation",
  valide: "Validée",
  rejete: "Rejetée",
};
const mad = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = (iso: string | null) => (iso ? iso.split("-").reverse().join("/") : "—");

export default async function FacturesPage() {
  const { orgId, isOrgAdmin } = await getTenantContext();
  if (!isOrgAdmin) notFound();
  const factures = await listerFactures(orgId);

  return (
    <AppShell topbar={<span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>Factures</span>}>
      <div style={{ maxWidth: 900, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "8px 22px", boxShadow: CARD_SHADOW }}>
        {factures.length === 0 && (
          <div style={{ padding: "18px 0", fontSize: 13, color: "var(--graphite)" }}>
            Aucune facture. Karima établit une facture à partir d&apos;un devis validé (Mes agents · Karima).
          </div>
        )}
        {factures.map((f, i) => (
          <Link
            key={f.id}
            href={`/factures/${f.id}`}
            style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", textDecoration: "none", color: "inherit", borderTop: i === 0 ? "none" : "1px solid var(--line)" }}
          >
            <div style={{ width: 110, fontWeight: 700, fontSize: 14 }}>{f.numero ?? "Sans numéro"}</div>
            <div style={{ flex: 1, fontSize: 14 }}>
              {f.client}
              {f.devis_version && <span style={{ color: "var(--graphite)", fontSize: 12 }}> · devis {f.devis_version}</span>}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--graphite)", width: 90 }}>{date(f.date_emission)}</div>
            <div style={{ fontSize: 14, fontWeight: 600, width: 130, textAlign: "right" }}>{mad(f.total_ttc)} MAD</div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--graphite)", width: 150, textAlign: "right" }}>{STATUT[f.statut] ?? f.statut}</div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}