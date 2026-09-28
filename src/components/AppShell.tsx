import type { ReactNode } from "react";
import { connection } from "next/server";
import { sql } from "@/lib/db";
import AppShellClient from "./AppShellClient";

// Couche serveur : calcule le badge « Approbations » depuis la base, puis
// délègue l'affichage au composant client (AppShellClient).
export default async function AppShell(props: {
  children: ReactNode;
  searchPlaceholder?: string;
  topbarAction?: ReactNode;
  topbar?: ReactNode;
}) {
  await connection();

  let approvalsCount = 0;
  try {
    const rows = await sql`SELECT COUNT(*)::int AS n FROM approvals WHERE status = 'en_attente'`;
    approvalsCount = Number(rows[0]?.n ?? 0);
  } catch {
    approvalsCount = 0;
  }

  return <AppShellClient {...props} approvalsCount={approvalsCount} />;
}