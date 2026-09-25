import { sql } from "@/lib/db";
import AppShell from "@/components/AppShell";
import AgentsGrid, { type Agent } from "@/components/AgentsGrid";

export default async function AgentsPage() {
  const agents = (await sql`
    SELECT name, slug, code, category, role, description, version,
           icon, input_label, output_label, workflow_count, status
    FROM agents
    ORDER BY code ASC
  `) as Agent[];

  return (
    <AppShell>
      <div>
        <h1 style={{ fontSize: "30px", fontWeight: 700, letterSpacing: "-0.01em", marginBottom: "6px" }}>
          Agents
        </h1>
        <p style={{ color: "var(--muted-foreground)", fontSize: "14px", marginBottom: "28px" }}>
          Catalogue des agents disponibles sur la plateforme.
        </p>
        <AgentsGrid agents={agents} />
      </div>
    </AppShell>
  );
}