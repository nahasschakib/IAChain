import { notFound } from "next/navigation";
import { OrganizationProfile } from "@clerk/nextjs";
import AppShell from "@/components/AppShell";
import { resolveTenant } from "@/lib/tenant";

export default async function EquipePage() {
  const tenant = await resolveTenant();
  if (!tenant.ok || !tenant.ctx.isOrgAdmin) notFound();

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