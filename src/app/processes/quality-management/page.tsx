import Link from "next/link";
import {
  Activity, BookOpen, Eye, Gauge, GitFork, Play, RefreshCw, Search, Shield, ShieldCheck, User, Waves, Wrench,
  type LucideIcon,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const BASE = "/processes/quality-management";
const NAVY = "#1d2d3d";
const LINE = "var(--line)";
const MONO: React.CSSProperties = { fontFamily: "var(--font-mono)" };
const DISPLAY: React.CSSProperties = { fontFamily: "var(--font-display)" };

const ICONS: Record<string, LucideIcon> = {
  activity: Activity, gauge: Gauge, "shield-check": ShieldCheck, waves: Waves, "git-fork": GitFork,
  wrench: Wrench, shield: Shield, "refresh-cw": RefreshCw, "book-open": BookOpen, user: User, play: Play,
  "eye": Eye
};

const KINDS: Record<string, { bg: string; fg: string; bc: string; bs: string }> = {
  FAIT: { bg: NAVY, fg: "#f2f2f3", bc: NAVY, bs: "solid" },
  PREUVE: { bg: "transparent", fg: "#2c455d", bc: "#5980a6", bs: "solid" },
  "HYPOTHÈSE": { bg: "transparent", fg: "#416180", bc: "#5980a6", bs: "dashed" },
  "INFÉRENCE": { bg: "#eef6ff", fg: "#2c455d", bc: "#b5d9fd", bs: "solid" },
  RECOMMANDATION: { bg: "#5980a6", fg: "#ffffff", bc: "#416180", bs: "solid" },
  "DÉCISION": { bg: "#e7e7ea", fg: "#1d1f20", bc: "rgba(29,31,32,.3)", bs: "solid" },
  CONNAISSANCE: { bg: "#d6ebff", fg: "#2c455d", bc: "#94bce3", bs: "solid" },
};

const SEVERITIES: Record<string, { bg: string; fg: string; bc: string }> = {
  "Critique": { bg: "var(--red)", fg: "#ffffff", bc: "var(--red)" },
  "Majeure": { bg: "transparent", fg: "var(--amber)", bc: "var(--amber)" },
  "Mineure": { bg: "var(--steel-tint)", fg: "#2c455d", bc: "var(--line)" },
};

function SeverityTag({ severity }: { severity: string }) {
  const s = SEVERITIES[severity] ?? SEVERITIES["Mineure"];
  return (
    <span
      style={{
        ...MONO, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 6px",
        whiteSpace: "nowrap", lineHeight: 1.35, background: s.bg, color: s.fg, border: `1px solid ${s.bc}`,
      }}
    >
      {severity}
    </span>
  );
}

function SourceTag({ source }: { source: string }) {
  return (
    <span
      style={{
        ...MONO, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 6px",
        whiteSpace: "nowrap", lineHeight: 1.35, background: "transparent", color: "var(--graphite)", border: "1px solid var(--line)",
      }}
    >
      {source}
    </span>
  );
}

const PDCA: [string, string][] = [
  ["PLAN", "Diagnostiquer, analyser, retenir la cause"],
  ["DO", "Décider et mettre en œuvre l'action"],
  ["CHECK", "Mesurer, comparer à la référence"],
  ["ACT", "Évaluer l'efficacité, étendre"],
  ["LEARN", "Capitaliser la leçon"],
];

const TABS: [string, string][] = [
  ["overview", "Vue d'ensemble"],
  ["cycle", "Cycle NC-041"],
  ["nc", "Non-conformités & audits"],
  ["rca", "Causes racines"],
  ["actions", "Actions"],
  ["kpi", "KPI"],
  ["knowledge", "Connaissance"],
  ["team", "Équipe d'agents"],
  ["audit", "Décisions & audit"],
];



const QM_METHODS: [string, string][] = [
  ["5p", "5 Pourquoi"],
  ["ish", "Ishikawa"],
  ["par", "Pareto"],
];



const tabHref = (t: string) => `${BASE}?tab=${t}`;
const methodHref = (m: string) => `${BASE}?tab=rca&method=${m}`;

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ border: `1px solid ${LINE}`, background: "var(--surface)", minWidth: 0 }}>
      <div
        style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${LINE}`,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <h2 style={{ ...DISPLAY, fontSize: 17, fontWeight: 700, margin: 0, letterSpacing: "0.03em", textTransform: "uppercase" }}>
          {title}
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ ...MONO, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--graphite)" }}>
      {children}
    </span>
  );
}

function KindTag({ kind }: { kind: string }) {
  const k = KINDS[kind] ?? KINDS["INFÉRENCE"];
  return (
    <span
      style={{
        ...MONO, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 6px",
        whiteSpace: "nowrap", lineHeight: 1.35, background: k.bg, color: k.fg, border: `1px ${k.bs} ${k.bc}`,
      }}
    >
      {kind}
    </span>
  );
}

function auditType(kind: string, who: string) {
  if (kind === "FAIT") return who === "Système" ? "Action" : "Exécution d'agent";
  const map: Record<string, string> = {
    "PREUVE": "Preuve", "INFÉRENCE": "Exécution d'agent", "HYPOTHÈSE": "Recommandation",
    "RECOMMANDATION": "Recommandation", "DÉCISION": "Décision humaine", "CONNAISSANCE": "Connaissance",
  };
  return map[kind] ?? kind;
}

const STATUS_STEPS = ["Brouillon", "Proposée", "En attente d'approbation", "Approuvée", "En cours", "Terminée", "Vérifiée"];

function ActionStepper({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {STATUS_STEPS.map((label, i) => (
        <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
          <div style={{ width: "100%", height: 5, background: i < current ? "#b5d9fd" : i === current ? "#5980a6" : "var(--line)" }} />
          <span style={{ ...MONO, fontSize: 8.5, textAlign: "center", lineHeight: 1.2, color: i === current ? "#2c455d" : "var(--graphite)", fontWeight: i === current ? 700 : 400 }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function ActionTypeTag({ type }: { type: string }) {
  const preventive = type === "Préventive";
  return (
    <span
      style={{
        ...MONO, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 6px",
        whiteSpace: "nowrap", background: preventive ? "transparent" : "#eef6ff", color: "#2c455d",
        border: `1px solid ${preventive ? "#5980a6" : "#b5d9fd"}`,
      }}
    >
      {type}
    </span>
  );
}

function EffTag({ label, strong }: { label: string; strong: boolean }) {
  return (
    <span
      style={{
        ...MONO, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 6px",
        whiteSpace: "nowrap", background: strong ? "#1d2d3d" : "transparent", color: strong ? "#f2f2f3" : "#2c455d",
        border: `1px solid ${strong ? "#1d2d3d" : "#5980a6"}`,
      }}
    >
      {label}
    </span>
  );
}

export default async function QualityManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; method?: string }>;
}) {
  const { tab: rawTab, method: rawMethod } = await searchParams;
  const tab = TABS.some(([k]) => k === rawTab) ? (rawTab as string) : "overview";
  const method = QM_METHODS.some(([k]) => k === rawMethod) ? (rawMethod as string) : "5p";

   const [procRows, wfRows, caseRows, kpiRows, sigRows, stepRows, teamRows, actionRows, symptomRows, whyRows, ishikawaRawRows, paretoRows, candidateRows, kpiDetailRows, lessonRows, reuseRows, knowledgeRows, agentRows] = await Promise.all([
    sql`SELECT name, version, description, subprocesses FROM processes WHERE slug = 'quality-management'`,
    sql`SELECT slug, code FROM workflows WHERE process_slug = 'quality-management' ORDER BY sort_order NULLS LAST, id LIMIT 1`,
    sql`SELECT * FROM qm_cases ORDER BY sort_order, id`,
    sql`SELECT label, value, note FROM qm_kpis ORDER BY sort_order, id`,
    sql`SELECT n, label, tab FROM qm_signals ORDER BY sort_order, id`,
    sql`SELECT s.*, a.name AS agent_name, a.role AS agent_role, a.icon AS agent_icon
        FROM qm_cycle_steps s LEFT JOIN agents a ON a.code = s.agent_code
        WHERE s.case_id = 'NC-041' ORDER BY s.n`,
    sql`SELECT COUNT(*) AS n FROM agents WHERE category = 'Qualité'`,
    sql`SELECT * FROM qm_actions ORDER BY sort_order, id`,
    sql`SELECT text, kind FROM qm_rca_symptoms WHERE case_id = 'NC-041' ORDER BY sort_order, id`,
    sql`SELECT n, question, answer FROM qm_rca_whys WHERE case_id = 'NC-041' ORDER BY n`,
    sql`SELECT category, item FROM qm_rca_ishikawa WHERE case_id = 'NC-041' ORDER BY sort_order, id`,
    sql`SELECT label, pct FROM qm_rca_pareto WHERE case_id = 'NC-041' ORDER BY sort_order, id`,
    sql`SELECT rank, cause, confidence, conf_label, evidence, retained, retained_text FROM qm_rca_candidates WHERE case_id = 'NC-041' ORDER BY rank`,
    sql`SELECT name, base_value, target, current_value, delta, period, status_label, status_strong FROM qm_kpi_details ORDER BY sort_order, id`,
    sql`SELECT * FROM qm_lessons WHERE case_id = 'NC-041' LIMIT 1`,
    sql`SELECT text FROM qm_lesson_reuse WHERE lesson_id = 'LL-023' ORDER BY sort_order, id`,
    sql`SELECT id, title, from_case, used_label FROM qm_knowledge_items ORDER BY sort_order, id`,
    sql`SELECT slug, name, code, role, version, icon, input_label, output_label, description FROM agents WHERE category = 'Qualité' ORDER BY code`,
  ]);

  const proc = procRows[0];
  const wf = wfRows[0];
  const cases = caseRows;
  const current = cases.find((c) => c.id === "NC-041");
  const step = Number(current?.step ?? 0);
  const done = stepRows.filter((s) => Number(s.n) <= step);
  const next = stepRows.find((s) => Number(s.n) === step + 1) ?? null;
  const phase = done.length > 0 ? (done[done.length - 1].phase as string) : "CHECK";
  const errRate = kpiRows.find((k) => String(k.label).startsWith("Taux d"));
  const kpiNow = (errRate?.value as string | undefined) ?? "—";
  const teamCount = Number(teamRows[0]?.n ?? 0);
  const subCount = Array.isArray(proc?.subprocesses) ? (proc.subprocesses as string[]).length : 0;
  const wfHref = wf ? `/workflows/${wf.slug}` : "/workflows";
  const wfCode = (wf?.code as string | undefined) ?? "WF-04";
  const actionId = (current?.action_id as string | null) ?? "—";
  const ishikawaGroups = ishikawaRawRows.reduce<Record<string, string[]>>((acc, r) => {
  const cat = r.category as string;
    (acc[cat] ??= []).push(r.item as string);
    return acc;
  }, {});
  const errKpiStatus = step >= 10 ? { label: "Efficace", strong: true } : step >= 9 ? { label: "À confirmer", strong: false } : { label: "Hors cible", strong: true };
  const errKpiDelta = step >= 9 ? "−63 % vs pic" : "+217 % vs référence";
  const allKpiDetails = [
    { name: "Taux d'erreur de saisie des commandes", base_value: "1,2 %", target: "≤ 1,5 %", current_value: kpiNow, delta: errKpiDelta, period: "10 jours glissants", status_label: errKpiStatus.label, status_strong: errKpiStatus.strong },
    ...kpiDetailRows,
  ] as { name: string; base_value: string; target: string; current_value: string; delta: string; period: string; status_label: string; status_strong: boolean }[];
    const lesson = lessonRows[0];
  const lessonStatus = step >= 12 ? "Publiée" : "Brouillon · publiée en fin de cycle";
  const lessonResult = step >= 9 ? "1,4 %, efficace" : "à mesurer";
  const lessonFields: [string, string, boolean][] = [
    ["Problème", (lesson?.problem as string) ?? "—", false],
    ["Analyse", (lesson?.analysis as string) ?? "—", false],
    ["Cause racine", (lesson?.cause_root as string) ?? "—", false],
    ["Solution", (lesson?.solution as string) ?? "—", false],
    ["Résultat", lessonResult, false],
    ["Leçon", (lesson?.lesson as string) ?? "—", true],
  ];
  const ncOpen = cases.filter((c) => !String(c.status).includes("close"));
  const ncCritical = cases.filter((c) => c.severity === "Critique").length;
  const ncPending = cases.filter((c) => String(c.status).includes("attente")).length;
  const ncTargetTab: Record<string, string> = { "NC-041": "cycle", "NC-040": "rca", "NC-038": "actions", "NC-036": "knowledge" };

  const chain: [string, string, string, string | null][] = [
    ["01", "Processus", "Quality Management", "/processes"],
    ["02", "Workflow", `${wfCode} · NC → amélioration`, wfHref],
    ["03", "Agents IA", `${teamCount} spécialisés`, tabHref("team")],
    ["04", "Tâches humaines", "Cause · action · clôture", tabHref("cycle")],
    ["05", "Exécution", actionId, tabHref("actions")],
    ["06", "KPI", `Taux d'erreur ${kpiNow}`, tabHref("kpi")],
    ["07", "Monitoring", "Tarik · avant / après", tabHref("cycle")],
    ["08", "Connaissance", "LL-023", tabHref("knowledge")],
    ["09", "Amélioration", `↺ PDCA · ${phase}`, tabHref("overview")],
  ];
  const chainTab: Record<string, string> = { "03": "team", "04": "cycle", "05": "actions", "06": "kpi", "08": "knowledge", "09": "overview" };

  const humanTasks = [
    { label: "Retenir la cause racine", who: "A. Kettani · Responsable qualité", state: step >= 5 ? "Validée" : "À faire", ok: step >= 5 },
    {
      label: "Approuver l'action corrective", who: "S. Idrissi · Manager opérations",
      state: step >= 7 ? "Approuvée, modifiée" : step >= 6 ? "En attente" : "À venir", ok: step >= 7,
    },
    { label: "Clore le cas", who: "A. Kettani · Responsable qualité", state: step >= 12 ? "Clos" : "À venir", ok: step >= 12 },
  ];
    const auditRows = [...done].reverse().map((st) => {
    const isAgent = Boolean(st.agent_code);
    const isExec = !isAgent && st.actor === "Exécution";
    const who = isAgent ? "IA" : isExec ? "Système" : "Humain";
    const actor = isAgent ? (st.agent_name as string) : (st.actor as string);
    return {
      n: st.n as number,
      date: st.date_label as string,
      phase: st.phase as string,
      who,
      type: auditType(st.kind as string, who),
      actor,
      text: `${st.label as string} : ${st.output as string}`,
    };
  });

  return (
    <AppShell topbar={<span style={{ ...DISPLAY, fontWeight: 700, fontSize: 18 }}>Processus</span>}>
      <header style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 22 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Link href="/processes" style={{ fontSize: 12.5, color: "var(--steel-strong, #2f4a63)", textDecoration: "none" }}>
              ← Processus
            </Link>
            <Label>Processus métier · référence · {String(proc?.version ?? "v1.0")}</Label>
            <h1 style={{ ...DISPLAY, fontWeight: 700, fontSize: 34, margin: 0, lineHeight: 1.05, letterSpacing: "-0.01em" }}>
              {String(proc?.name ?? "Quality Management")}
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--graphite)", maxWidth: 720, lineHeight: 1.55 }}>
              Un processus, pas un agent : {subCount} sous-processus exécutés par le workflow {wfCode}, une équipe de{" "}
              {teamCount} agents et des décisions humaines tracées.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Link href={wfHref} style={{ border: "1px solid var(--line)", padding: "8px 14px", fontSize: 13, color: "inherit", textDecoration: "none", whiteSpace: "nowrap", background: "var(--surface)" }}>
              Workflow {wfCode} →
            </Link>
            <Link href="/approvals" style={{ background: "#5980a6", color: "#fff", border: "1px solid #416180", padding: "8px 14px", fontSize: 13, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
              Boîte d&apos;approbation
            </Link>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, background: NAVY, color: "#f2f2f3", padding: "8px 12px" }}>
          <span style={{ ...MONO, fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", border: "1px solid rgba(242,242,243,.4)", padding: "2px 6px" }}>Démo</span>
          <span style={{ fontSize: 12.5 }}>
            Données de démonstration : scénario « hausse du taux d&apos;erreur de saisie ». Aucune donnée réelle.
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", borderTop: `1px solid ${LINE}`, borderLeft: `1px solid ${LINE}` }}>
          {chain.map(([n, term, label, href]) => {
            const on = chainTab[n] === tab;
            const cell: React.CSSProperties = {
              display: "flex", flexDirection: "column", gap: 3, padding: "10px 12px", textDecoration: "none", color: "inherit",
              borderRight: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`, background: on ? "#eef6ff" : "var(--paper)",
            };
            const inner = (
              <>
                <span style={{ ...MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--steel-strong, #2f4a63)" }}>
                  {n} {term}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3, color: on ? "#2c455d" : undefined }}>{label}</span>
              </>
            );
            return href ? <Link key={n} href={href} style={cell}>{inner}</Link> : <div key={n} style={cell}>{inner}</div>;
          })}
        </div>

        <nav style={{ display: "flex", flexWrap: "wrap", borderBottom: `1px solid ${LINE}` }}>
          {TABS.map(([k, label]) => (
            <Link
              key={k}
              href={tabHref(k)}
              style={{
                padding: "9px 14px", fontSize: 13.5, fontWeight: 500, whiteSpace: "nowrap", textDecoration: "none",
                color: tab === k ? "var(--ink, #1d1f20)" : "var(--graphite)",
                borderBottom: `2px solid ${tab === k ? "#5980a6" : "transparent"}`,
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", borderTop: `1px solid ${LINE}`, borderLeft: `1px solid ${LINE}` }}>
            {kpiRows.map((k) => (
              <div key={k.label as string} style={{ background: "var(--surface)", borderRight: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`, padding: "13px 14px", display: "flex", flexDirection: "column", gap: 5 }}>
                <Label>{k.label as string}</Label>
                <span style={{ ...DISPLAY, fontSize: 30, fontWeight: 700, lineHeight: 1 }}>{k.value as string}</span>
                <span style={{ fontSize: 11.5, color: "var(--graphite)" }}>{k.note as string}</span>
              </div>
            ))}
          </div>

          <Section title="Cycle PDCA · NC-041" right={<span style={{ ...MONO, fontSize: 11, color: "var(--steel-strong, #2f4a63)" }}>Phase actuelle · {phase}</span>}>
            <div style={{ padding: "14px 16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
              {[...PDCA, ["↺ PLAN AGAIN", "La leçon alimente le cycle suivant"] as [string, string]].map(([label, desc], i) => {
                const on = label === phase;
                const again = i === PDCA.length;
                return (
                  <Link
                    key={label}
                    href={tabHref(again ? "knowledge" : "cycle")}
                    style={{
                      textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", gap: 4, padding: "10px 12px",
                      border: `1px solid ${on ? NAVY : again ? "#b5d9fd" : "var(--line)"}`,
                      background: on ? NAVY : again ? "#eef6ff" : "transparent",
                    }}
                  >
                    <span style={{ ...DISPLAY, fontSize: 19, fontWeight: 700, letterSpacing: "0.04em", color: on ? "#f2f2f3" : "var(--steel-strong, #2f4a63)" }}>{label}</span>
                    <span style={{ fontSize: 12, lineHeight: 1.45, color: on ? "#d6ebff" : "var(--graphite)" }}>{desc}</span>
                  </Link>
                );
              })}
            </div>
          </Section>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, alignItems: "start" }}>
            <Section title="Cycles d'amélioration actifs">
              {cases.map((c) => (
                <Link
                  key={c.id as string}
                  href={tabHref(ncTargetTab[c.id as string] ?? "overview")}
                  style={{ display: "flex", flexDirection: "column", gap: 9, padding: "12px 16px", borderBottom: `1px solid ${LINE}`, textDecoration: "none", color: "inherit" }}
                >
                  <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                    <span style={{ ...MONO, fontSize: 11, color: "var(--steel-strong, #2f4a63)" }}>{c.id as string}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 600, flex: "1 1 180px" }}>{c.title as string}</span>
                    <span style={{ ...MONO, fontSize: 10.5, padding: "2px 6px", border: "1px solid #5980a6", color: "#2c455d", whiteSpace: "nowrap" }}>{c.status as string}</span>
                  </span>
                  <span style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px 14px" }}>
                    {([["Cause racine", c.cause], ["Action", c.action_id ?? "—"], ["Responsable", c.owner], ["Efficacité", c.effectiveness]] as [string, unknown][]).map(([k, v]) => (
                      <span key={k} style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                        <Label>{k}</Label>
                        <span style={{ fontSize: 12.5, lineHeight: 1.4 }}>{(v as string) ?? "—"}</span>
                      </span>
                    ))}
                  </span>
                </Link>
              ))}
            </Section>

            <Section title="Signaux des agents">
              {sigRows.map((sg) => (
                <Link
                  key={sg.label as string}
                  href={sg.tab === "approvals" ? "/approvals" : tabHref(sg.tab as string)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: `1px solid ${LINE}`, textDecoration: "none", color: "inherit" }}
                >
                  <span style={{ ...DISPLAY, fontSize: 26, fontWeight: 700, lineHeight: 1, color: "var(--steel-strong, #2f4a63)", minWidth: 24 }}>{sg.n as string}</span>
                  <span style={{ flex: 1, fontSize: 13, lineHeight: 1.45 }}>{sg.label as string}</span>
                  <span style={{ color: "var(--steel-strong, #2f4a63)" }}>→</span>
                </Link>
              ))}
              <div style={{ padding: "10px 16px", fontSize: 11.5, color: "var(--graphite)" }}>Chaque signal ouvre les éléments qui l&apos;ont produit.</div>
            </Section>
          </div>
        </div>
      )}

      {tab === "cycle" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
          <div style={{ flex: "2 1 460px", minWidth: 0 }}>
            <Section
              title="NC-041 · Hausse du taux d'erreur de saisie"
              right={<span style={{ ...MONO, fontSize: 11, color: "var(--graphite)" }}>Étape {step} / {stepRows.length}</span>}
            >
              {done.map((st) => {
                const isAgent = Boolean(st.agent_code);
                const isExec = !isAgent && st.actor === "Exécution";
                const actor = isAgent ? (st.agent_name as string) : (st.actor as string);
                const role = isAgent ? (st.agent_role as string) : (st.role as string);
                const Icon = isAgent ? ICONS[(st.agent_icon as string) ?? ""] ?? Search : isExec ? Play : User;
                const letter = isAgent ? actor.charAt(0) : isExec ? "X" : "H";
                return (
                  <div key={st.n as number} style={{ display: "flex", gap: 12, padding: "13px 16px", borderBottom: `1px solid ${LINE}` }}>
                    <span
                      style={{
                        position: "relative", width: 40, height: 40, flex: "0 0 40px", display: "grid", placeItems: "center",
                        border: `1px solid ${isAgent ? "#94bce3" : "rgba(29,31,32,.3)"}`, background: isAgent ? "#eef6ff" : "#e7e7ea",
                      }}
                    >
                      <span style={{ ...DISPLAY, fontSize: 23, fontWeight: 700, lineHeight: 1, color: "#2c455d" }}>{letter}</span>
                      <span style={{ position: "absolute", bottom: -1, right: -1, width: 18, height: 18, background: "#416180", display: "grid", placeItems: "center" }}>
                        <Icon size={11} color="#f2f2f3" strokeWidth={1.8} />
                      </span>
                    </span>
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                        <span style={{ ...MONO, fontSize: 10, color: "var(--graphite)", whiteSpace: "nowrap" }}>
                          {String(st.n).padStart(2, "0")} · {st.date_label as string}
                        </span>
                        <span style={{ ...MONO, fontSize: 9.5, letterSpacing: "0.08em", padding: "2px 6px", border: "1px solid #5980a6", color: "#2c455d" }}>{st.phase as string}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{actor}</span>
                        <span style={{ fontSize: 11.5, color: "var(--graphite)" }}>{role}</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{st.label as string}</span>
                      <span style={{ fontSize: 13, lineHeight: 1.55 }}>{st.output as string}</span>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                        <KindTag kind={st.kind as string} />
                        <span style={{ ...MONO, fontSize: 10.5, color: "var(--graphite)" }}>{st.evidence as string}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {next && (
                <div style={{ padding: "14px 16px", background: "#eef6ff", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: "1 1 240px", minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ ...MONO, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--steel-strong, #2f4a63)" }}>
                      Prochaine étape · {next.phase as string} ·{" "}
                      {next.agent_code ? `${String(next.agent_name)} · ${String(next.agent_role)}` : `${String(next.actor)} · ${String(next.role)}`}
                    </span>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: NAVY }}>{next.label as string}</span>
                    {Boolean(next.is_human) && (
                      <span style={{ fontSize: 12, color: "#2c455d" }}>Tâche humaine : l&apos;IA a recommandé, un humain décide.</span>
                    )}
                  </div>
                  {Boolean(next.is_human) && (
                    <Link href="/approvals" style={{ background: "#5980a6", color: "#fff", border: "1px solid #416180", padding: "8px 14px", fontSize: 13, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
                      {(next.next_label as string) ?? "Ouvrir"}
                    </Link>
                  )}
                </div>
              )}
            </Section>
          </div>

          <div style={{ flex: "1 1 270px", minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ border: `1px solid ${LINE}`, background: "var(--surface)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              <Label>KPI-QM-004 · Taux d&apos;erreur de saisie</Label>
              <span style={{ ...DISPLAY, fontSize: 42, fontWeight: 700, lineHeight: 1, color: NAVY }}>{kpiNow}</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}><Label>Référence</Label><span style={{ fontSize: 13 }}>1,2 %</span></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}><Label>Cible</Label><span style={{ fontSize: 13 }}>≤ 1,5 %</span></div>
              </div>
              <span style={{ fontSize: 12, color: "var(--graphite)" }}>
                {step >= 9
                  ? "Mesuré par Tarik sur 10 jours après l'action : −63 % par rapport au pic."
                  : "Pic mesuré par Adil. La mesure après action commence à la mise en œuvre."}
              </span>
            </div>
            <Section title="Tâches humaines">
              {humanTasks.map((h) => (
                <div key={h.label} style={{ padding: "10px 16px", borderBottom: `1px solid ${LINE}`, display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, flex: "1 1 140px" }}>{h.label}</span>
                    <span style={{ ...MONO, fontSize: 10.5, whiteSpace: "nowrap", color: h.ok ? "var(--steel-strong, #2f4a63)" : h.state === "En attente" ? NAVY : "var(--graphite)", fontWeight: h.state === "En attente" ? 700 : 400 }}>
                      {h.state}
                    </span>
                  </span>
                  <span style={{ fontSize: 11.5, color: "var(--graphite)" }}>{h.who}</span>
                </div>
              ))}
            </Section>
          </div>
        </div>
      )}

           {tab === "nc" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", borderTop: `1px solid ${LINE}`, borderLeft: `1px solid ${LINE}` }}>
            {[
              ["Non-conformités", String(cases.length), "toutes sources"],
              ["Ouvertes", String(ncOpen.length), "hors cas clos"],
              ["Critiques", String(ncCritical), "sévérité la plus haute"],
              ["Attente d'approbation", String(ncPending), "action à valider"],
            ].map(([label, value, note]) => (
              <div key={label} style={{ background: "var(--surface)", borderRight: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`, padding: "13px 14px", display: "flex", flexDirection: "column", gap: 5 }}>
                <Label>{label}</Label>
                <span style={{ ...DISPLAY, fontSize: 30, fontWeight: 700, lineHeight: 1 }}>{value}</span>
                <span style={{ fontSize: 11.5, color: "var(--graphite)" }}>{note}</span>
              </div>
            ))}
          </div>

          <Section title="Registre des non-conformités" right={<span style={{ ...MONO, fontSize: 11, color: "var(--graphite)" }}>{cases.length} enregistrements</span>}>
            {cases.map((c) => (
              <Link
                key={c.id as string}
                href={tabHref(ncTargetTab[c.id as string] ?? "overview")}
                style={{ display: "flex", flexDirection: "column", gap: 9, padding: "13px 16px", borderBottom: `1px solid ${LINE}`, textDecoration: "none", color: "inherit" }}
              >
                <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                  <span style={{ ...MONO, fontSize: 11, color: "var(--steel-strong, #2f4a63)" }}>{c.id as string}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, flex: "1 1 220px" }}>{c.title as string}</span>
                  <SourceTag source={c.source as string} />
                  <SeverityTag severity={c.severity as string} />
                </span>
                <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                  <span style={{ ...MONO, fontSize: 10.5, color: "var(--graphite)" }}>Ouverte le {c.opened_label as string}</span>
                  <span
                    style={{
                      ...MONO, fontSize: 10.5, padding: "2px 6px", border: "1px solid #5980a6", color: "#2c455d", whiteSpace: "nowrap",
                    }}
                  >
                    {c.status as string}
                  </span>
                </span>
                <span style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px 14px" }}>
                  {([["Cause", c.cause], ["Action", c.action_id ?? "—"], ["Responsable", c.owner], ["Efficacité", c.effectiveness]] as [string, unknown][]).map(([k, v]) => (
                    <span key={k} style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                      <Label>{k}</Label>
                      <span style={{ fontSize: 12.5, lineHeight: 1.4 }}>{(v as string) ?? "—"}</span>
                    </span>
                  ))}
                </span>
              </Link>
            ))}
          </Section>
        </div>
      )}

    
            {tab === "rca" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Section title="NC-041 · Constat">
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{current?.problem_statement as string}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {symptomRows.map((sm) => (
                  <div key={sm.text as string} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <KindTag kind={sm.kind as string} />
                    <span style={{ fontSize: 13, lineHeight: 1.5 }}>{sm.text as string}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section
            title="Méthode d'analyse"
            right={
              <div style={{ display: "flex", gap: 6 }}>
                {QM_METHODS.map(([k, label]) => (
                  <Link
                    key={k}
                    href={methodHref(k)}
                    style={{
                      ...MONO, fontSize: 11.5, padding: "5px 12px", textDecoration: "none", whiteSpace: "nowrap",
                      background: method === k ? "#5980a6" : "transparent", color: method === k ? "#fff" : "var(--graphite)",
                      border: `1px solid ${method === k ? "#416180" : "var(--line)"}`,
                    }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            }
          >
            {method === "5p" && (
              <div style={{ padding: "6px 0" }}>
                {whyRows.map((w, i) => (
                  <div key={w.n as number} style={{ display: "flex", gap: 14, padding: "13px 16px", borderBottom: i < whyRows.length - 1 ? `1px solid ${LINE}` : "none" }}>
                    <span style={{ ...DISPLAY, fontSize: 22, fontWeight: 700, color: "var(--steel-strong, #2f4a63)", minWidth: 26 }}>{w.n as number}</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{w.question as string}</span>
                      <span style={{ fontSize: 13, color: "var(--graphite)", lineHeight: 1.5 }}>{w.answer as string}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {method === "ish" && (
              <div style={{ padding: "14px 16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                {Object.entries(ishikawaGroups).map(([cat, items]) => (
                  <div key={cat} style={{ border: "1px solid var(--line)", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                    <Label>{cat}</Label>
                    {items.map((it) => (
                      <span key={it} style={{ fontSize: 12.5, lineHeight: 1.45 }}>• {it}</span>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {method === "par" && (
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
                {paretoRows.map((p) => (
                  <div key={p.label as string} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 12.5, width: 150, flex: "0 0 150px" }}>{p.label as string}</span>
                    <div style={{ flex: 1, background: "var(--paper)", height: 16, position: "relative" }}>
                      <div style={{ width: `${p.pct}%`, height: "100%", background: "#5980a6" }} />
                    </div>
                    <span style={{ ...MONO, fontSize: 11.5, width: 40, textAlign: "right" }}>{String(p.pct)} %</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Causes candidates" right={<span style={{ ...MONO, fontSize: 11, color: "var(--graphite)" }}>Soufiane · QM-05</span>}>
            {candidateRows.map((c) => (
              <div key={c.rank as number} style={{ padding: "13px 16px", borderBottom: `1px solid ${LINE}`, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
                  <span style={{ ...DISPLAY, fontSize: 18, fontWeight: 700, color: "var(--steel-strong, #2f4a63)" }}>#{c.rank as number}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, flex: "1 1 220px" }}>{c.cause as string}</span>
                  <KindTag kind={c.retained ? "DÉCISION" : "HYPOTHÈSE"} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 100, background: "var(--paper)", height: 6 }}>
                    <div style={{ width: `${c.confidence}%`, height: "100%", background: "#5980a6" }} />
                  </div>
                  <span style={{ ...MONO, fontSize: 10.5, color: "var(--graphite)" }}>{c.confidence as number}% · {c.conf_label as string}</span>
                </div>
                <span style={{ fontSize: 12.5, color: "var(--graphite)", lineHeight: 1.5 }}>{c.evidence as string}</span>
                {Boolean(c.retained) && <span style={{ fontSize: 12, color: "#2c455d" }}>{c.retained_text as string}</span>}
              </div>
            ))}
          </Section>
        </div>
      )}

            {tab === "actions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {actionRows.map((a) => (
            <Section key={a.id as string} title={`${a.id as string} · ${a.title as string}`} right={<ActionTypeTag type={a.type as string} />}>
              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                  <Label>Agent</Label>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{a.agent_name as string} · {a.agent_code as string}</span>
                  <span style={{ ...MONO, fontSize: 10.5, color: "var(--graphite)" }}>· lié à {a.case_id as string}</span>
                </div>
                <ActionStepper current={Number(a.status_step)} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px 16px" }}>
                  {([
                    ["Problème", a.problem], ["Cause racine", a.cause_root], ["Responsable", a.owner], ["Priorité", a.priority],
                    ["Échéance", a.due_label], ["Résultat attendu", a.expected_result], ["Ressources", a.resources],
                    ["KPI", a.kpi_name], ["Vérification", a.verification],
                  ] as [string, unknown][]).map(([k, v]) => (
                    <span key={k} style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                      <Label>{k}</Label>
                      <span style={{ fontSize: 12.5, lineHeight: 1.4 }}>{(v as string) ?? "—"}</span>
                    </span>
                  ))}
                </div>
              </div>
            </Section>
          ))}
        </div>
      )}
      {tab === "kpi" && (
        <Section title="Indicateurs qualité" right={<span style={{ ...MONO, fontSize: 11, color: "var(--graphite)" }}>{allKpiDetails.length} indicateurs</span>}>
          {allKpiDetails.map((k) => (
            <div key={k.name} style={{ padding: "13px 16px", borderBottom: `1px solid ${LINE}`, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, flex: "1 1 220px" }}>{k.name}</span>
                <EffTag label={k.status_label} strong={k.status_strong} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "8px 14px" }}>
                {([["Référence", k.base_value], ["Cible", k.target], ["Actuel", k.current_value], ["Delta", k.delta], ["Période", k.period]] as [string, string][]).map(([lbl, v]) => (
                  <span key={lbl} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Label>{lbl}</Label>
                    <span style={{ fontSize: 12.5 }}>{v}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </Section>
      )}
      {tab === "knowledge" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Section
            title={`${(lesson?.id as string) ?? "LL-023"} · Leçon apprise`}
            right={
              <span style={{ ...MONO, fontSize: 10.5, padding: "2px 6px", border: "1px solid #5980a6", color: "#2c455d", whiteSpace: "nowrap" }}>
                {lessonStatus}
              </span>
            }
          >
            <div style={{ padding: "14px 16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              {lessonFields.map(([k, v, highlight]) => (
                <div key={k} style={{ padding: "10px 12px", background: highlight ? "#eef6ff" : "transparent", border: `1px solid ${highlight ? "#94bce3" : "var(--line)"}`, display: "flex", flexDirection: "column", gap: 4 }}>
                  <Label>{k}</Label>
                  <span style={{ fontSize: 13, lineHeight: 1.45 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: "12px 16px", borderTop: `1px solid ${LINE}`, display: "flex", flexDirection: "column", gap: 8 }}>
              <Label>Réutilisée par</Label>
                {reuseRows.map((r, i) => (
                <span key={i} style={{ fontSize: 13, lineHeight: 1.5 }}>• {r.text as string}</span>
              ))}
            </div>
          </Section>

          <Section title="Registre des leçons" right={<span style={{ ...MONO, fontSize: 11, color: "var(--graphite)" }}>{knowledgeRows.length + 1} leçons</span>}>
            {knowledgeRows.map((k) => (
              <div key={k.id as string} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: `1px solid ${LINE}` }}>
                <span style={{ ...MONO, fontSize: 11, color: "var(--steel-strong, #2f4a63)" }}>{k.id as string}</span>
                <span style={{ fontSize: 13, fontWeight: 600, flex: "1 1 220px" }}>{k.title as string}</span>
                <span style={{ ...MONO, fontSize: 10.5, color: "var(--graphite)" }}>issue de {k.from_case as string}</span>
                <span style={{ ...MONO, fontSize: 10.5, padding: "2px 6px", border: "1px solid var(--line)", color: "var(--graphite)", whiteSpace: "nowrap" }}>{k.used_label as string}</span>
              </div>
            ))}
          </Section>
        </div>
      )}
            {tab === "team" && (
        <Section title="Équipe d'agents qualité" right={<span style={{ ...MONO, fontSize: 11, color: "var(--graphite)" }}>{agentRows.length} agents</span>}>
          <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {agentRows.map((a) => {
              const Icon = ICONS[(a.icon as string) ?? ""] ?? Search;
              return (
                <Link
                  key={a.slug as string}
                  href={`/agents/${a.slug as string}`}
                  style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px", border: "1px solid var(--line)", textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 36, height: 36, flex: "0 0 36px", display: "grid", placeItems: "center", background: "#eef6ff", border: "1px solid #94bce3" }}>
                      <Icon size={17} color="#2c455d" strokeWidth={1.8} />
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{a.name as string}</span>
                      <span style={{ ...MONO, fontSize: 10, color: "var(--graphite)" }}>{a.code as string} · {a.version as string}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--steel-strong, #2f4a63)" }}>{a.role as string}</span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--graphite)" }}>{a.description as string}</span>
                  <span style={{ ...MONO, fontSize: 10, color: "var(--graphite)", borderTop: "1px solid var(--line)", paddingTop: 8 }}>
                    {a.input_label as string} → {a.output_label as string}
                  </span>
                </Link>
              );
            })}
          </div>
        </Section>
      )}

           {tab === "audit" && (
        <Section
          title={`Journal d'audit · ${(current?.id as string) ?? "NC-041"}`}
          right={<span style={{ ...MONO, fontSize: 11, color: "var(--graphite)" }}>{auditRows.length} entrées</span>}
        >
          {auditRows.map((r) => (
            <div
              key={r.n}
              style={{
                display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, padding: "12px 16px",
                borderBottom: `1px solid ${LINE}`, background: r.who === "Humain" ? NAVY : "transparent",
                color: r.who === "Humain" ? "#f2f2f3" : "inherit",
              }}
            >
              <span style={{ ...MONO, fontSize: 10, color: r.who === "Humain" ? "#d6ebff" : "var(--graphite)", whiteSpace: "nowrap" }}>
                {String(r.n).padStart(2, "0")} · {r.date}
              </span>
              <span
                style={{
                  ...MONO, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 6px",
                  border: `1px solid ${r.who === "Humain" ? "#f2f2f3" : "#5980a6"}`,
                  color: r.who === "Humain" ? "#f2f2f3" : "#2c455d", whiteSpace: "nowrap",
                }}
              >
                {r.phase}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap" }}>{r.who}</span>
              <span style={{ fontSize: 12, opacity: 0.85, whiteSpace: "nowrap" }}>{r.type}</span>
              <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{r.actor}</span>
              <span style={{ fontSize: 13, lineHeight: 1.5, flex: "1 1 260px" }}>{r.text}</span>
            </div>
          ))}
        </Section>
      )}

    </AppShell>
  );
}