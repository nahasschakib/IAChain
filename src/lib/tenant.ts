import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";

export type TenantContext = {
  userId: string;
  orgId: string;
  orgRole: string | null;
  isOrgAdmin: boolean;
  isPlatformAdmin: boolean; // administrateur de l'organisation exploitante (SOCYTAY)
  tenantName: string;
};

export type TenantRefusal = "connexion" | "organisation" | "attente" | "suspendu";

export async function resolveTenant(): Promise<
  { ok: true; ctx: TenantContext } | { ok: false; reason: TenantRefusal }
> {
  const { userId, orgId, orgRole } = await auth();
  if (!userId) return { ok: false, reason: "connexion" };
  if (!orgId) return { ok: false, reason: "organisation" };

  const rows = await sql`SELECT name, status, is_platform FROM tenants WHERE org_id = ${orgId}`;
  const tenant = rows[0];
  if (!tenant) return { ok: false, reason: "attente" };
  if (tenant.status === "suspendu") return { ok: false, reason: "suspendu" };
  if (tenant.status !== "actif") return { ok: false, reason: "attente" };

  const isOrgAdmin = orgRole === "org:admin";
  return {
    ok: true,
    ctx: {
      userId,
      orgId,
      orgRole: orgRole ?? null,
      isOrgAdmin,
      isPlatformAdmin: Boolean(tenant.is_platform) && isOrgAdmin,
      tenantName: tenant.name as string,
    },
  };
}

// Pour les pages : redirige si l'accès est refusé.
export async function getTenantContext(): Promise<TenantContext> {
  const res = await resolveTenant();
  if (!res.ok) {
    if (res.reason === "connexion") redirect("/sign-in");
    redirect(`/en-attente?raison=${res.reason}`);
  }
  return res.ctx;
}