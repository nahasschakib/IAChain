import { sql } from "@/lib/db";
import AppShell from "@/components/AppShell";
import AgentsGrid, { type Agent } from "@/components/AgentsGrid";

const NUMBER_WORDS = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
  "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf", "vingt",
];

function numberWord(n: number) {
  return NUMBER_WORDS[n] ?? String(n);
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const CARD_SHADOW = "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)";

export default async function AgentsPage() {
  const agents = (await sql`
    SELECT name, slug, code, category, role, description, version,
           icon, input_label, output_label, workflow_count, status
    FROM agents
    ORDER BY code ASC
  `) as Agent[];

  const statsRows = await sql`
    SELECT
      (SELECT COUNT(*) FROM agents) AS agent_count,
      (SELECT COUNT(DISTINCT category) FROM agents) AS category_count,
      (SELECT COUNT(*) FROM workflows) AS workflow_count,
      (SELECT COUNT(*) FROM deliverables WHERE created_at >= now() - interval '7 days') AS deliverables_week
  `;
  const s = statsRows[0];
  const agentCount = Number(s.agent_count);
  const word = numberWord(agentCount);

  const stats = [
    { value: agentCount, label: "Agents nommés" },
    { value: Number(s.category_count), label: "Métiers couverts" },
    { value: Number(s.workflow_count), label: "Workflows les chaînant" },
    { value: Number(s.deliverables_week), label: "Livrables / semaine" },
  ];

  return (
    <AppShell>
      <div>
        <header style={{ paddingBottom: "24px", borderBottom: "1px solid var(--border)", marginBottom: "24px" }}>
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "11px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--muted-foreground)",
              marginBottom: "10px",
            }}
          >
            Formule 1 · Bibliothèque d&apos;agents
          </div>
          <h1 style={{ fontSize: "30px", fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.15, margin: 0 }}>
            {capitalize(word)} agents, {word} métiers
          </h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: "14px", lineHeight: 1.6, maxWidth: "640px", margin: "12px 0 0" }}>
            Chacun porte un nom, un contrat d&apos;entrée/sortie typé et son propre studio. Seul, il produit un livrable.
            Chaîné, sa sortie devient l&apos;entrée du suivant.
          </p>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "4px",
                background: "var(--surface, #fff)",
                padding: "16px 20px",
                boxShadow: CARD_SHADOW,
              }}
            >
              <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--steel-strong, #2f4a63)", lineHeight: 1.1 }}>
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "10px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--muted-foreground)",
                  marginTop: "6px",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <AgentsGrid agents={agents} />
      </div>
    </AppShell>
  );
}