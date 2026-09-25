import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import { sql } from "@/lib/db";
import WorkflowStudio, {
  type StudioNode,
  type PaletteAgent,
  type VersionItem,
  type RunBanner,
  type SwitchItem,
} from "@/components/workflow-studio/WorkflowStudio";

export const dynamic = "force-dynamic";

// À alimenter depuis une table workflow_versions plus tard.
const VERSIONS: Record<string, VersionItem[]> = {
  "prospect-to-cash": [
    { label: "v3 — actuelle", detail: "Ajout de l'étape Prospecting · 23 sept", current: true },
    { label: "v2", detail: "Ajout de la branche Nurturing · 14 sept", current: false },
    { label: "v1", detail: "Version initiale · 2 sept", current: false },
  ],
};

export default async function WorkflowStudioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const wfRows = await sql`
    SELECT slug, name, version, cost_estimate, cost_unit, run_label, run_banner, studio_ready
    FROM workflows
    WHERE slug = ${slug}
    LIMIT 1
  `;
  const wf = wfRows[0];
  if (!wf || !wf.studio_ready) notFound();

  const nodes = (await sql`
    SELECT n.node_key, n.kind, n.label, n.agent_slug, n.version, n.tag, n.design_note, n.blurb,
           n.row_index, n.col_index, n.parents, n.mapping, n.outputs, n.details,
           n.run_state, n.run_note,
           a.name AS agent_name, a.code AS agent_code, a.role AS agent_role
    FROM workflow_nodes n
    LEFT JOIN agents a ON a.slug = n.agent_slug
    WHERE n.workflow_slug = ${slug}
    ORDER BY n.row_index, n.col_index
  `) as unknown as StudioNode[];

  // Palette : les agents de la catégorie de l'agent de départ + ceux du workflow.
  const palette = (await sql`
    SELECT slug, name, role
    FROM agents
    WHERE category = (
      SELECT a.category
      FROM workflow_nodes n
      JOIN agents a ON a.slug = n.agent_slug
      WHERE n.workflow_slug = ${slug}
      ORDER BY n.row_index, n.col_index
      LIMIT 1
    )
    OR slug IN (SELECT agent_slug FROM workflow_nodes WHERE workflow_slug = ${slug} AND agent_slug IS NOT NULL)
    ORDER BY code ASC
  `) as unknown as PaletteAgent[];

  const switcher = (await sql`
    SELECT slug, code FROM workflows WHERE studio_ready = true ORDER BY sort_order
  `) as unknown as SwitchItem[];

  const rawVersion = String(wf.version ?? "");
  const version = /^v/i.test(rawVersion) ? rawVersion : `v${rawVersion}`;

  return (
    <AppShell
      topbar={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/workflows" style={{ fontSize: 13, color: "var(--graphite)" }}>
            ← Workflows
          </Link>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>{wf.name as string}</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--graphite)",
              border: "1px solid var(--line)",
              padding: "3px 8px",
              borderRadius: 999,
            }}
          >
            {version}
          </span>
        </div>
      }
    >
      <WorkflowStudio
        nodes={nodes}
        palette={palette}
        versions={VERSIONS[slug] ?? []}
        costEstimate={Number(wf.cost_estimate ?? 0)}
        costUnit={(wf.cost_unit as string) ?? "run"}
        runLabel={(wf.run_label as string | null) ?? null}
        runBanner={(wf.run_banner as RunBanner | null) ?? null}
        switcher={switcher}
        currentSlug={slug}
      />
    </AppShell>
  );
}