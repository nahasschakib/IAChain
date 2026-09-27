import Link from "next/link";
import AppShell from "@/components/AppShell";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const CARD_SHADOW = "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)";
const CARD_SHADOW_HOVER = "0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.05)";

const LEVELS = [
  { term: "Processus", q: "Quel résultat métier pilote-t-on ?", ex: "ex. Quality Management" },
  { term: "Workflow", q: "Comment ce processus est-il exécuté ?", ex: "ex. Non-conformité → Amélioration continue" },
  { term: "Agent", q: "Qui exécute une tâche cognitive spécialisée ?", ex: "ex. Soufiane · Causes racines" },
  {
    term: "Tâche humaine",
    q: "Qu'est-ce qui exige une validation ou une action humaine ?",
    ex: "ex. Approuver l'action corrective",
  },
  { term: "Amélioration continue", q: "Comment le processus apprend-il de ses résultats ?", ex: "ex. Leçon LL-023 réutilisée" },
];

const NEXT_PROCESSES = [
  "Finance",
  "Achats",
  "Opérations",
  "Risques",
  "Conformité",
  "Ressources humaines",
  "Supply chain",
  "Gestion de projet",
];

const MONO: React.CSSProperties = { fontFamily: "var(--font-mono)" };

export default async function ProcessesPage() {
  const rows = await sql`
    SELECT p.slug, p.tag, p.version, p.name, p.description, p.subprocesses, p.cta, p.href,
      p.is_reference,
      (SELECT COUNT(*) FROM agents a
         WHERE a.slug = ANY (p.agent_slugs)
            OR lower(a.category) IN (SELECT lower(c) FROM unnest(p.agent_categories) c)) AS agent_count,
      (SELECT COUNT(*) FROM workflows w WHERE w.process_slug = p.slug) AS workflow_count,
      (SELECT w.slug FROM workflows w WHERE w.process_slug = p.slug
         ORDER BY w.sort_order NULLS LAST, w.id LIMIT 1) AS first_workflow_slug,
      (SELECT w.code FROM workflows w WHERE w.process_slug = p.slug
         ORDER BY w.sort_order NULLS LAST, w.id LIMIT 1) AS first_workflow_code
    FROM processes p
    ORDER BY p.sort_order, p.slug
  `;

  const processes = rows.map((r) => {
    const subs = Array.isArray(r.subprocesses) ? (r.subprocesses as string[]) : [];
    const wfSlug = (r.first_workflow_slug as string | null) ?? null;
    const wfCode = (r.first_workflow_code as string | null) ?? null;
    const href = (r.href as string | null) ?? (wfSlug ? `/workflows/${wfSlug}` : null);
    const cta = (r.cta as string | null) ?? (wfCode ? `Workflow ${wfCode} →` : "Ouvrir →");
    return {
      slug: r.slug as string,
      tag: r.tag as string,
      version: r.version as string,
      name: r.name as string,
      description: r.description as string,
      subs,
      stats: [
        { k: "Sous-processus", v: String(subs.length) },
        { k: "Agents", v: String(Number(r.agent_count)) },
        { k: "Workflows", v: String(Number(r.workflow_count)) },
      ],
      href,
      cta,
      isReference: Boolean(r.is_reference),
    };
  });

  return (
    <AppShell
      topbar={<span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>Processus</span>}
    >
      <header style={{ marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid var(--line)" }}>
        <div
          style={{
            ...MONO,
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--graphite)",
            marginBottom: 10,
          }}
        >
          Architecture · processus métier
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: "-0.01em",
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          Un moteur, plusieurs processus
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--graphite)", maxWidth: 700, margin: "12px 0 0" }}>
          Un processus définit le résultat métier piloté. Il s&apos;exécute par des workflows, qui mobilisent des agents
          et des tâches humaines, mesurent leurs effets et apprennent de leurs résultats. Ajouter un processus ne
          réécrit ni le moteur de workflow, ni les agents.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 1,
          background: "var(--line)",
          border: "1px solid var(--line)",
          marginBottom: 28,
        }}
      >
        {LEVELS.map((l) => (
          <div key={l.term} style={{ background: "var(--paper)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
            <span
              style={{
                ...MONO,
                fontSize: 10.5,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--steel-strong, #2f4a63)",
              }}
            >
              {l.term}
            </span>
            <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35 }}>{l.q}</span>
            <span style={{ fontSize: 12, color: "var(--graphite)" }}>{l.ex}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        {processes.map((p) => {
          const cardStyle: React.CSSProperties = {
            display: "flex",
            flexDirection: "column",
            background: "var(--surface)",
            border: `1px solid ${p.isReference ? "var(--steel-strong, #2f4a63)" : "var(--line)"}`,
            borderRadius: 4,
            textDecoration: "none",
            color: "inherit",
            boxShadow: CARD_SHADOW,
            transition: "box-shadow 0.18s ease, transform 0.18s ease",
          };

          const content = (
            <>
              <div style={{ padding: "20px 24px 16px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <span style={{ ...MONO, fontSize: 11.5, fontWeight: 600, letterSpacing: "0.06em", color: "var(--steel-strong, #2f4a63)" }}>
                    {p.tag}
                  </span>
                  <span style={{ ...MONO, fontSize: 12, color: "var(--graphite)" }}>{p.version}</span>
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, letterSpacing: "-0.01em", lineHeight: 1.1 }}>
                  {p.name}
                </div>
                <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--graphite)", margin: 0 }}>{p.description}</p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 1,
                  background: "var(--line)",
                  borderTop: "1px solid var(--line)",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                {p.stats.map((s) => (
                  <div key={s.k} style={{ background: "var(--surface)", padding: "12px 24px", display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, lineHeight: 1, color: "var(--steel-strong, #2f4a63)" }}>
                      {s.v}
                    </span>
                    <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--graphite)" }}>
                      {s.k}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ padding: "14px 24px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                {p.subs.map((s) => (
                  <span
                    key={s}
                    style={{
                      ...MONO,
                      fontSize: 11.5,
                      color: "var(--graphite)",
                      background: "var(--paper)",
                      border: "1px solid var(--line)",
                      padding: "3px 8px",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div
                style={{
                  marginTop: "auto",
                  borderTop: "1px solid var(--line)",
                  padding: "13px 24px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: p.href ? "var(--steel-strong, #2f4a63)" : "var(--graphite)",
                  opacity: p.href ? 1 : 0.55,
                }}
              >
                {p.cta}
              </div>
            </>
          );

          return p.href ? (
            <Link key={p.slug} href={p.href} className="process-card is-link" style={cardStyle}>
              {content}
            </Link>
          ) : (
            <div key={p.slug} className="process-card" style={{ ...cardStyle, cursor: "default" }}>
              {content}
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 28,
          border: "1px dashed var(--line)",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <span style={{ ...MONO, fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--graphite)" }}>
          Prêts à modéliser sur le même moteur
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {NEXT_PROCESSES.map((n) => (
            <span key={n} style={{ fontSize: 12.5, border: "1px solid var(--line)", padding: "4px 10px", color: "var(--graphite)", whiteSpace: "nowrap" }}>
              {n}
            </span>
          ))}
        </div>
        <span style={{ fontSize: 12.5, color: "var(--graphite)", lineHeight: 1.5 }}>
          Chacun reprendra la même structure (définition, workflows, agents, tâches humaines, KPI, preuves, décisions,
          boucle d&apos;amélioration) sans code spécifique au processus.
        </span>
      </div>

      <style>{`
        .process-card.is-link:hover {
          box-shadow: ${CARD_SHADOW_HOVER};
          transform: translateY(-1px);
        }
      `}</style>
    </AppShell>
  );
}