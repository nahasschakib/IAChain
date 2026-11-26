import { notFound } from "next/navigation";
import { OrganizationProfile } from "@clerk/nextjs";
import AppShell from "@/components/AppShell";
import { resolveTenant } from "@/lib/tenant";
import { organisationSansAdmin } from "@/lib/org-admins";

export default async function EquipePage() {
  const tenant = await resolveTenant();
  if (!tenant.ok) notFound();
  if (!tenant.ctx.isOrgAdmin) {
    if (await organisationSansAdmin(tenant.ctx.orgId)) {
      return (
        <AppShell
          topbar={
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
              Équipe
            </span>
          }
        >
          <div style={{ maxWidth: 520, margin: "48px auto", textAlign: "center", color: "var(--graphite)" }}>
            <p style={{ fontWeight: 600 }}>Votre organisation n&apos;a plus d&apos;administrateur.</p>
            <p>
              Seul un administrateur peut gérer l&apos;équipe et les réglages. Écrivez à
              contact@socytay.ma pour rétablir l&apos;accès.
            </p>
          </div>
        </AppShell>
      );
    }
    notFound();
  }

  return (
    <AppShell
      topbar={
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
          Équipe
        </span>
      }
    >
      <div style={{ display: "flex", justifyContent: "center" }}>
        <OrganizationProfile
          path="/settings/equipe"
          routing="path"
          afterLeaveOrganizationUrl="/en-attente"
        />
      </div>
    </AppShell>
  );
}