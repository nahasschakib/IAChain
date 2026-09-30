import type { ReactNode } from "react";
import { connection } from "next/server";
import { sql } from "@/lib/db";
import { resolveTenant } from "@/lib/tenant";
import AppShellClient from "./AppShellClient";

// Couche serveur : calcule le badge « Approbations » et le nom de l'organisation active,
// puis délègue l'affichage au composant client (AppShellClient).
export default async function AppShell(props: {
  children: ReactNode;
  searchPlaceholder?: string;
  topbarAction?: ReactNode;
  topbar?: ReactNode;
}) {
  await connection();

  let approvalsCount = 0;
  let orgName: string | null = null;

  try {
    const t = await resolveTenant();
    if (t.ok) {
      orgName = t.ctx.tenantName;
      const rows = await sql`
        SELECT COUNT(*)::int AS n FROM approvals
        WHERE org_id = ${t.ctx.orgId} AND status = 'en_attente'
      `;
      approvalsCount = Number(rows[0]?.n ?? 0);
    }
  } catch {
    approvalsCount = 0;
  }

  return <AppShellClient {...props} approvalsCount={approvalsCount} orgName={orgName} />;
}