import Link from "next/link";
import type { CSSProperties } from "react";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/* ---------------------------------------------------------------------- */
/* Style helpers — repris tels quels du design system app (dashboard/AppShell) */
/* ---------------------------------------------------------------------- */

const CARD_SHADOW = "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)";

const CARD: CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 14,
  padding: 22,
  boxShadow: CARD_SHADOW,
};

const SECTION: CSSProperties = {
  padding: "0 clamp(24px,4vw,64px) 96px",
  maxWidth: 1320,
  margin: "0 auto",
  width: "100%",
  boxSizing: "border-box",
};

const EYEBROW: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  letterSpacing: "0.06em",
  color: "var(--steel)",
};

const H2: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: "clamp(24px,2.6vw,32px)",
  margin: "8px 0 32px",
  letterSpacing: "-0.01em",
};

const BTN_PRIMARY: CSSProperties = {
  background: "var(--steel-deep)",
  color: "#f5f6f8",
  fontSize: 14,
  fontWeight: 600,
  padding: "13px 22px",
  borderRadius: 9,
  whiteSpace: "nowrap",
  display: "inline-block",
};

const BTN_SECONDARY: CSSProperties = {
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 14,
  fontWeight: 600,
  padding: "13px 22px",
  borderRadius: 9,
  border: "1px solid var(--line)",
  whiteSpace: "nowrap",
  display: "inline-block",
};

const TONE_COLORS = {
  signal: "var(--signal)",
  amber: "var(--amber)",
  red: "var(--red)",
  steel: "var(--steel)",
};

function Dot({ tone = "signal" }: { tone?: keyof typeof TONE_COLORS }) {
  return (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: TONE_COLORS[tone],
        flexShrink: 0,
        display: "inline-block",
      }}
    />
  );
}

/* ---------------------------------------------------------------------- */
/* Data                                                                    */
/* ---------------------------------------------------------------------- */

type AgentRow = { slug: string; name: string; category: string; role: string };

const AGENT_BUCKETS: { label: string; categories: string[]; accent?: boolean }[] = [
  { label: "Ventes", categories: ["Sales"] },
  { label: "Marketing & e-commerce", categories: ["Marketing", "E-commerce"] },
  { label: "Finance, support, ops, RH", categories: ["Finance", "Support", "Ops", "RH"] },
  { label: "Qualité", categories: ["Qualité"], accent: true },
];

const WORKFLOWS = [
  {
    code: "WF-01",
    name: "Prospect to Cash",
    desc: "Yasmine → Mehdi → Karim → Salma, Anas et Nadia en parallèle → fusion → approbation → écriture au CRM.",
  },
  {
    code: "WF-02",
    name: "De l'idée au marketing",
    desc: "Sofia repère le signal, Othmane chiffre le plan, Lina et Anas produisent en parallèle, la direction valide, la publication part.",
  },
  {
    code: "WF-03",
    name: "Service client",
    desc: "Imane trie ; une condition oriente vers Imane, Zineb ou un humain ; Hamza analyse les causes en fin de semaine.",
  },
  {
    code: "WF-04",
    name: "Non-conformité → amélioration continue",
    desc: "14 nœuds, 2 tâches humaines et une boucle : si l'action n'est pas efficace, le cas repart vers l'analyse.",
  },
];

export default async function Home() {
  const agentRows = (await sql`
    SELECT slug, name, category, role FROM agents WHERE status = 'actif' ORDER BY category, name
  `) as AgentRow[];

  const agentCount = agentRows.length;
  const categoryCount = new Set(agentRows.map((a) => a.category)).size;

  const agentBuckets = AGENT_BUCKETS.map((bucket) => {
    const members = agentRows.filter((a) => bucket.categories.includes(a.category));
    return { ...bucket, count: members.length, members };
  });

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--paper)",
        color: "var(--ink)",
      }}
    >
      {/* NAV */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px clamp(24px,4vw,64px)",
          borderBottom: "1px solid var(--line)",
          position: "sticky",
          top: 0,
          background: "rgba(245,246,248,0.9)",
          backdropFilter: "blur(10px)",
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "var(--steel-deep)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="5" cy="5" r="3" stroke="#f5f6f8" strokeWidth="1.6" />
              <circle cx="19" cy="12" r="3" stroke="#f5f6f8" strokeWidth="1.6" />
              <circle cx="5" cy="19" r="3" stroke="#f5f6f8" strokeWidth="1.6" />
              <path d="M8 6.2L16.2 11" stroke="#f5f6f8" strokeWidth="1.6" />
              <path d="M16.2 13L8 17.8" stroke="#f5f6f8" strokeWidth="1.6" />
            </svg>
          </div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, letterSpacing: "-0.01em" }}>
            IAChain
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 26, fontSize: 14, fontWeight: 500, color: "var(--graphite)" }}>
          <a href="#agents" style={{ whiteSpace: "nowrap" }}>Agents</a>
          <a href="#workflows" style={{ whiteSpace: "nowrap" }}>Workflows</a>
          <a href="#qualite" style={{ whiteSpace: "nowrap" }}>Qualité</a>
          <a href="#gouvernance" style={{ whiteSpace: "nowrap" }}>Gouvernance</a>
          <a href="#offre" style={{ whiteSpace: "nowrap" }}>Offre</a>
          <Link href="/tarifs" style={{ whiteSpace: "nowrap" }}>Tarifs</Link>
          <a href="/agency" style={{ whiteSpace: "nowrap" }}>Agence IA</a>
        </div>
        <a href="#contact" style={BTN_PRIMARY}>Demander une démo</a>
      </div>

      {/* HERO */}
      <div style={{ padding: "clamp(56px,7vw,96px) clamp(24px,4vw,64px) 72px", maxWidth: 1320, margin: "0 auto", width: "100%", boxSizing: "border-box", display: "flex", gap: 56, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 440px", minWidth: 320, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              border: "1px solid var(--line)",
              borderRadius: 999,
              background: "var(--surface)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.04em",
              color: "var(--steel)",
            }}
          >
            <Dot />
            INFRASTRUCTURE IA D&apos;ENTREPRISE
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "clamp(34px,4vw,54px)",
              lineHeight: 1.04,
              letterSpacing: "-0.02em",
              margin: "22px 0 0",
            }}
          >
            Vos processus métier, exécutés par une équipe d&apos;agents IA.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: "var(--graphite)", margin: "20px 0 0", maxWidth: 480 }}>
            IAChain donne à chaque compétence un agent nommé, avec son studio et son livrable réel. Chaînés en
            workflows, ils exécutent un processus de bout en bout — de la détection à l&apos;action — pendant que vos
            équipes gardent la décision.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
            <a href="#agents" style={BTN_PRIMARY}>Explorer les agents</a>
            <a href="#qualite" style={BTN_SECONDARY}>Voir Quality Management →</a>
          </div>
          <p style={{ fontSize: 13, color: "var(--graphite)", margin: "36px 0 0" }}>
            Conçu pour direction générale, commercial, marketing, finance, opérations, support et IT.
          </p>
        </div>

        <div style={{ flex: "1 1 400px", minWidth: 340, display: "flex", alignItems: "flex-start" }}>
          <div style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: 22, boxShadow: "0 1px 2px rgba(18,21,26,0.04), 0 12px 32px rgba(18,21,26,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.06em", color: "var(--graphite)" }}>
                WORKFLOW · PROSPECT TO CASH
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--signal)" }}>
                <Dot tone="signal" /> ACTIF
              </span>
            </div>
            <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "14px 16px", background: "var(--paper)" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Yasmine — Qualification</div>
              <div style={{ fontSize: 12, color: "var(--graphite)", marginTop: 2 }}>Analyse le lead entrant</div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", padding: "6px 0" }}>
              <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
                <path d="M7 0V17" stroke="#c7ccd4" strokeWidth="1.4" />
                <path d="M2 13L7 18L12 13" stroke="#c7ccd4" strokeWidth="1.4" />
              </svg>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {["score", "priority", "next_action"].map((tag) => (
                <span key={tag} style={{ fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--steel-tint)", color: "var(--steel)", padding: "4px 9px", borderRadius: 6 }}>
                  {tag}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "center", padding: "6px 0" }}>
              <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
                <path d="M7 0V17" stroke="#c7ccd4" strokeWidth="1.4" />
                <path d="M2 13L7 18L12 13" stroke="#c7ccd4" strokeWidth="1.4" />
              </svg>
            </div>
            <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "14px 16px", background: "var(--paper)" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Mehdi — Sales Strategy</div>
              <div style={{ fontSize: 12, color: "var(--graphite)", marginTop: 2 }}>Exploite le résultat de qualification, sans reprendre le travail</div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS BENTO — chiffres réels de la plateforme */}
      <div style={{ ...SECTION, paddingBottom: 88 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          {[
            { value: String(agentCount), label: "Agents spécialisés, chacun nommé" },
            { value: String(categoryCount), label: "Métiers couverts" },
            { value: "4", label: "Workflows métier bout-en-bout" },
            { value: "5", label: "Types de décisions humaines tracées" },
          ].map((stat) => (
            <div key={stat.label} style={CARD}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 34, letterSpacing: "-0.01em" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 13, color: "var(--graphite)", marginTop: 6, lineHeight: 1.4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PRINCIPE — pas un chatbot */}
      <div style={SECTION}>
        <span style={EYEBROW}>LE PRINCIPE</span>
        <h2 style={H2}>Pas un chatbot. Des exécutants qui livrent.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 18 }}>
          {[
            {
              title: "Un studio par agent",
              sub: "Des entrées qui disent d'où elles viennent",
              desc: "Chaque champ affiche sa provenance — workflow amont, intégration ou saisie. Le studio résout d'abord ce qu'il peut ; vous ne saisissez que ce qui ne se déduit pas.",
            },
            {
              title: "Un livrable réel",
              sub: "L'aperçu, c'est le document final",
              desc: "Salma produit une proposition chiffrée, Ilyas une liste de comptes, Zineb une fiche produit avec ses variantes, Soufiane une analyse de causes. Pas une réponse à relire.",
            },
            {
              title: "Une action métier",
              sub: "Le résultat part dans vos systèmes",
              desc: "Écriture au CRM, facture à l'ERP, publication, relance WhatsApp Business : l'agent déclenche l'action, derrière une approbation quand elle engage l'entreprise.",
            },
          ].map((item) => (
            <div key={item.title} style={{ ...CARD, display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ ...EYEBROW, fontSize: 11 }}>{item.title.toUpperCase()}</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, lineHeight: 1.25 }}>{item.sub}</span>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--graphite)", margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CHAÎNE — processus > workflow > agent > tâche humaine > amélioration */}
      <div style={SECTION}>
        <span style={EYEBROW}>L&apos;ARCHITECTURE</span>
        <h2 style={H2}>Un moteur, autant de processus que d&apos;entreprise.</h2>
        <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--graphite)", margin: "-20px 0 28px", maxWidth: 620 }}>
          Ajouter la finance, les achats ou les risques ne réécrit ni le moteur de workflow, ni les agents : chaque
          processus reprend la même structure.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px,1fr))", gap: 12 }}>
          {[
            { label: "Processus", q: "Quel résultat métier pilote-t-on ?", ex: "Quality Management" },
            { label: "Workflow", q: "Comment est-il exécuté ?", ex: "Non-conformité → amélioration" },
            { label: "Agent", q: "Qui exécute la tâche spécialisée ?", ex: "Soufiane · Causes racines" },
            { label: "Tâche humaine", q: "Qu'est-ce qui exige un humain ?", ex: "Approuver l'action corrective" },
            { label: "Amélioration", q: "Comment apprend-il de ses résultats ?", ex: "Leçon apprise réutilisée" },
          ].map((step) => (
            <div key={step.label} style={{ ...CARD, padding: 18, display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", color: "var(--steel)" }}>{step.label}</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.4 }}>{step.q}</span>
              <span style={{ fontSize: 12, color: "var(--graphite)" }}>{step.ex}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 18 }}>
          {["Processus", "Workflow", "Agents IA", "Tâches humaines", "Exécution", "KPI", "Connaissance"].map((tag, i, arr) => (
            <span key={tag} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--steel-tint)", color: "var(--steel)", padding: "4px 9px", borderRadius: 6 }}>
                {tag}
              </span>
              {i < arr.length - 1 && <span style={{ color: "var(--graphite)", fontSize: 12 }}>→</span>}
            </span>
          ))}
          <span style={{ color: "var(--graphite)", fontSize: 12 }}>→</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--steel-deep)", color: "#f5f6f8", padding: "4px 9px", borderRadius: 6 }}>
            ↺ Amélioration continue
          </span>
        </div>
      </div>

      {/* AGENT LIBRARY — données réelles */}
      <div id="agents" style={SECTION}>
        <span style={EYEBROW}>LA BIBLIOTHÈQUE D&apos;AGENTS</span>
        <h2 style={H2}>{agentCount} agents, un prénom, un métier.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 18 }}>
          {agentBuckets.map((bucket) => (
            <div key={bucket.label} style={{ ...CARD, display: "flex", flexDirection: "column", gap: 12, border: bucket.accent ? "1px solid var(--steel)" : CARD.border }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>{bucket.label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--steel)" }}>{bucket.count}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {bucket.members.map((agent) => (
                  <span
                    key={agent.slug}
                    title={`${agent.name} — ${agent.role}`}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: bucket.accent ? "var(--steel-deep)" : "var(--steel-tint)",
                      color: bucket.accent ? "#f5f6f8" : "var(--steel)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    {agent.name[0]}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--graphite)", margin: 0 }}>
                {bucket.members.map((a) => a.name).join(" · ") || "À venir"}
              </p>
              <Link href="/dashboard" style={{ fontSize: 13, fontWeight: 600, color: "var(--steel)" }}>
                Parcourir la bibliothèque →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* WORKFLOWS */}
      <div id="workflows" style={SECTION}>
        <span style={EYEBROW}>LES WORKFLOWS</span>
        <h2 style={H2}>La sortie de l&apos;un devient l&apos;entrée du suivant.</h2>
        <div style={{ ...CARD, padding: 0 }}>
          {WORKFLOWS.map((wf, i) => (
            <Link
              key={wf.code}
              href="/workflows"
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "baseline",
                gap: "6px 20px",
                padding: "18px 22px",
                borderBottom: i < WORKFLOWS.length - 1 ? "1px solid var(--line)" : "none",
                color: "inherit",
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "var(--steel)", minWidth: 56 }}>
                {wf.code}
              </span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, flex: "1 1 220px" }}>
                {wf.name}
              </span>
              <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--graphite)", flex: "2 1 340px" }}>
                {wf.desc}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* QUALITY MANAGEMENT — cas de référence */}
      <div id="qualite" style={SECTION}>
        <span style={EYEBROW}>PROCESSUS DE RÉFÉRENCE</span>
        <h2 style={H2}>Quality Management, la boucle complète.</h2>
        <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--graphite)", margin: "-20px 0 28px", maxWidth: 640 }}>
          La preuve qu&apos;un processus réel devient un système de travail augmenté : 11 sous-processus, 10 agents,
          un cycle PDCA qui apprend de ses propres résultats.
        </p>

        <div style={CARD}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>
              Scénario NC-041 · hausse du taux d&apos;erreur de saisie
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--graphite)" }}>
              Données de démonstration
            </span>
          </div>
          <div className="kpi-grid" style={{ marginBottom: 20 }}>
            {[
              { label: "Pic détecté", value: "3,8 %" },
              { label: "Après action", value: "1,4 %", tone: "signal" as const },
              { label: "Par rapport au pic", value: "−63 %" },
              { label: "Étapes tracées", value: "12" },
              { label: "Décisions humaines", value: "3" },
            ].map((k) => (
              <div key={k.label} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 14, background: "var(--paper)" }}>
                <div style={{ fontSize: 11, color: "var(--graphite)" }}>{k.label}</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, marginTop: 4, color: k.tone ? "var(--signal)" : "var(--ink)" }}>
                  {k.value}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 10 }}>
            {[
              { step: "PLAN", desc: "Rim diagnostique, Soufiane classe les hypothèses, un humain retient la cause." },
              { step: "DO", desc: "Meryem propose l'action corrective, le manager l'approuve, l'équipe l'exécute." },
              { step: "CHECK", desc: "Adil et Ghita détectent la dérive, Tarik mesure l'effet avant / après." },
              { step: "ACT", desc: "Kenza évalue l'efficacité, Bilal étend la prévention aux cas similaires." },
            ].map((p) => (
              <div key={p.step} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "var(--steel)" }}>{p.step}</span>
                <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--graphite)" }}>{p.desc}</span>
              </div>
            ))}
            <div style={{ border: "1px solid var(--steel)", background: "var(--steel-tint)", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "var(--steel-deep)" }}>LEARN ↺</span>
              <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--steel-deep)" }}>
                Houda publie la leçon ; elle devient une règle que Walid contrôle au cycle suivant.
              </span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <Link href="/processes/quality-management" style={BTN_PRIMARY}>Dérouler le scénario</Link>
        </div>
      </div>

      {/* GOUVERNANCE */}
      <div id="gouvernance" style={SECTION}>
        <span style={EYEBROW}>GOUVERNANCE</span>
        <h2 style={H2}>L&apos;IA recommande. Vos équipes décident.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px,1fr))", gap: 18 }}>
          {[
            {
              title: "Human-in-the-loop",
              desc: "Toute action qui engage l'entreprise attend un propriétaire identifié, avec une échéance. Le registre garde côte à côte la recommandation de l'IA et la décision finale.",
            },
            {
              title: "Explicabilité",
              desc: "Chaque sortie sépare ce qui est constaté de ce qui est supposé, et cite ses sources, ses règles et son niveau de confiance. Aucune hypothèse n'est présentée comme certaine.",
            },
            {
              title: "Traçabilité",
              desc: "Journal d'audit par dossier, où IA, humain et système sont distingués. Chaque livrable porte sa lignée : quel agent, quelle entrée, quelle approbation.",
            },
            {
              title: "Intégrations",
              desc: "CRM, ERP, messagerie, stockage, API internes, avec un mapping par paire système ↔ agent et une vue d'impact avant toute déconnexion. Seules des sources publiques ou sous contrat sont interrogées.",
            },
          ].map((item) => (
            <div key={item.title} style={{ ...CARD, display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ ...EYEBROW, fontSize: 11 }}>{item.title.toUpperCase()}</span>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* OFFRE */}
      <div id="offre" style={SECTION}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 8 }}>
          <div>
            <span style={EYEBROW}>L&apos;OFFRE</span>
            <h2 style={{ ...H2, margin: "8px 0 0" }}>Un agent aujourd&apos;hui, un processus demain.</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
            <span style={{ fontSize: 13, color: "var(--graphite)" }}>
              Socle dès <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--ink)" }}>1 490 MAD</span> HT / mois
            </span>
            <Link href="/tarifs" style={BTN_PRIMARY}>Simuler mon tarif</Link>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 18, marginTop: 28 }}>
          <div style={CARD}>
            <span style={{ ...EYEBROW, fontSize: 11 }}>FORMULE 1</span>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, margin: "8px 0" }}>
              Bibliothèque d&apos;agents
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--graphite)", margin: 0 }}>
              Activez une compétence précise, branchez une intégration, produisez un premier livrable. L&apos;agent
              rejoint un workflow plus tard sans reconfiguration.
            </p>
          </div>
          <div style={{ ...CARD, border: "1px solid var(--steel)" }}>
            <span style={{ ...EYEBROW, fontSize: 11 }}>FORMULE 2</span>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, margin: "8px 0" }}>
              Processus métier
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--graphite)", margin: 0 }}>
              Des workflows complets — branches parallèles, fusions, approbations, action finale et boucle
              d&apos;amélioration — suivis en temps réel.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginTop: 20 }}>
          {[
            { n: "01 · Agence", t: "Diagnostic", d: "Cartographie des processus automatisables." },
            { n: "02", t: "Conception", d: "Agents et workflows sur mesure, dans le même moteur." },
            { n: "03", t: "Intégration", d: "Câblage CRM, ERP, messagerie, API." },
            { n: "04", t: "Déploiement", d: "Mise en service, rôles, formation." },
            { n: "05", t: "Optimisation", d: "Calibrage des seuils de confiance, itérations." },
          ].map((s) => (
            <div key={s.t} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 14, background: "var(--surface)", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--steel)" }}>{s.n}</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>{s.t}</span>
              <span style={{ fontSize: 12, lineHeight: 1.5, color: "var(--graphite)" }}>{s.d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FINAL CTA */}
      <div id="contact" style={{ background: "var(--steel-deep)", color: "#f5f6f8", padding: "clamp(48px,6vw,72px) clamp(24px,4vw,64px)" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", display: "flex", gap: 56, flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ flex: "1 1 380px", minWidth: 300 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(24px,3vw,34px)", lineHeight: 1.1, margin: 0, letterSpacing: "-0.01em" }}>
              Prêt à transformer un processus métier en workflow d&apos;agents ?
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "#c7ccd4", margin: "16px 0 0", maxWidth: 440 }}>
              Un premier échange suffit pour identifier le processus le plus rentable à automatiser dans votre
              organisation.
            </p>
            <a href="mailto:contact@iachain.ai" style={{ display: "inline-block", background: "#f5f6f8", color: "var(--steel-deep)", fontSize: 14, fontWeight: 700, padding: "13px 24px", borderRadius: 9, marginTop: 28 }}>
              Demander un diagnostic
            </a>
          </div>
          <div style={{ flex: "1 1 260px", minWidth: 240, display: "flex", flexDirection: "column", gap: 14, fontSize: 14 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.06em", color: "#8b93a1" }}>CONTACT</span>
            <span>contact@iachain.ai</span>
            <span>Casablanca, Maroc</span>
            <span style={{ color: "#8b93a1" }}>Un produit SOCYTAY</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ padding: "20px clamp(24px,4vw,64px)", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, fontSize: 12, color: "var(--graphite)" }}>
        <span>© 2026 IAChain. Tous droits réservés.</span>
        <span>Conception : Agents spécialisés → Studios individuels → Workflows multi-agents → Business Deliverables.</span>
      </div>
    </div>
  );
}