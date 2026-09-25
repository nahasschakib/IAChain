"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrganization } from "@clerk/nextjs";
import { ArrowRight, Check,Sparkles } from "lucide-react";


export type OnboardingAgent = { slug: string; name: string; code: string; role: string };
export type OnboardingWorkflow = {
  slug: string; code: string; name: string; description: string; studio_ready: boolean;
};

type Path = "agent" | "workflow" | null;

const STEPS = ["Organisation", "Point d'entrée", "Intégrations", "Première exécution"];
const SECTEURS = [
  "Comptabilité & Audit",
  "Commerce & Distribution",
  "BTP & Immobilier",
  "Transport & Logistique",
  "Restauration & Hôtellerie",
  "Santé & Pharmacie",
  "IT & Digital",
  "Éducation & Formation",
  "Industrie & Manufacturing",
  "Services aux entreprises",
  "Autre",
];
const TAILLES = ["1–10", "11–50", "51–200", "200+"];
const LANGUES = ["Français", "Arabe / Darija", "Français + Arabe"];

// Intégrations minimales : reprises du canvas (CRM + Email requis, ERP + Stockage optionnels).
const INTEGRATIONS = [
  { key: "crm", label: "CRM", required: true },
  { key: "email", label: "Email", required: true },
  { key: "erp", label: "ERP", required: false },
  { key: "storage", label: "Stockage", required: false },
];

const card: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: "14px", background: "var(--surface)" };
const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.08em",
  textTransform: "uppercase", color: "var(--muted-foreground)",
};
const primaryBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "8px",
  border: "none", background: "var(--steel-deep)", color: "#fff", fontSize: "13px", fontWeight: 600,
  cursor: "pointer", textDecoration: "none",
};
const ghostBtn: React.CSSProperties = {
  ...primaryBtn, background: "transparent", color: "var(--steel-deep)", border: "1px solid var(--border)",
};
const select: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border)",
  background: "var(--paper)", fontSize: "14px", color: "var(--ink)",
};
const h1: React.CSSProperties = {
  fontFamily: "var(--font-display)", fontSize: "28px", lineHeight: 1.2, margin: "8px 0 6px", color: "var(--ink)",
};
const lead: React.CSSProperties = {
  color: "var(--muted-foreground)", fontSize: "14px", maxWidth: "560px", margin: "0 0 24px",
};

export default function OnboardingFlow({
  agents,
  workflows,
}: {
  agents: OnboardingAgent[];
  workflows: OnboardingWorkflow[];
}) {
  const { organization } = useOrganization();
  const orgName = organization?.name ?? "SOCYTAY";

  const [step, setStep] = useState(1);
  const [secteur, setSecteur] = useState(SECTEURS[0]);
  const [taille, setTaille] = useState(TAILLES[0]);
  const [langue, setLangue] = useState(LANGUES[2]);
  const [path, setPath] = useState<Path>(null);
  const [ackIntegrations, setAckIntegrations] = useState(false);

  const back = () => setStep((s) => Math.max(1, s - 1));
  const next = () => setStep((s) => Math.min(4, s + 1));

  return (
    <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap", maxWidth: "1120px" }}>
     <div style={{ flex: "1 1 520px", minWidth: 0, maxWidth: "700px" }}>
      {/* Barre de progression */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", marginBottom: "28px" }}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const current = n === step;
          return (
            <button
              key={label}
              onClick={() => n < step && setStep(n)}
              disabled={n >= step}
              style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: 0, cursor: n < step ? "pointer" : "default" }}
            >
              <span
                style={{
                  width: "24px", height: "24px", borderRadius: "999px", display: "inline-flex",
                  alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: "11px",
                  background: done || current ? "#4f7399" : "transparent",
                  color: done || current ? "#fff" : "var(--muted-foreground)",
                  border: done || current ? "none" : "1px solid var(--border)",
                }}
              >
                {done ? <Check size={13} /> : n}
              </span>
              <span style={{ fontSize: "13px", color: current ? "var(--ink)" : "var(--muted-foreground)", fontWeight: current ? 600 : 400 }}>
                {label}
              </span>
              {n < 4 && <span style={{ width: "28px", height: "1px", background: "var(--line)" }} />}
            </button>
          );
        })}
      </div>

      {/* ÉTAPE 1 — Organisation */}
      {step === 1 && (
        <section>
          <div style={mono}>Étape 1 · Organisation</div>
          <h1 style={h1}>Faisons connaissance avec votre organisation</h1>
          <p style={lead}>Ces informations calibrent les recommandations d&apos;agents et les langues des livrables.</p>

          <div style={{ ...card, padding: "24px", display: "grid", gap: "18px", maxWidth: "620px" }}>
            <div>
              <div style={{ ...mono, marginBottom: "6px" }}>Organisation</div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)" }}>{orgName}</div>
              <div style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "2px" }}>Marché : Maroc · devise MAD</div>
            </div>
            <label>
              <div style={{ ...mono, marginBottom: "6px" }}>Secteur d&apos;activité</div>
              <select value={secteur} onChange={(e) => setSecteur(e.target.value)} style={select}>
                {SECTEURS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label>
              <div style={{ ...mono, marginBottom: "6px" }}>Taille de l&apos;équipe</div>
              <select value={taille} onChange={(e) => setTaille(e.target.value)} style={select}>
                {TAILLES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label>
              <div style={{ ...mono, marginBottom: "6px" }}>Langue des livrables</div>
              <select value={langue} onChange={(e) => setLangue(e.target.value)} style={select}>
                {LANGUES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          </div>

          <div style={{ marginTop: "22px" }}>
            <button onClick={next} style={primaryBtn}>Continuer <ArrowRight size={14} /></button>
          </div>
        </section>
      )}

      {/* ÉTAPE 2 — Point d'entrée (canvas) */}
      {step === 2 && (
        <section>
          <div style={mono}>Étape 2 · Point d&apos;entrée</div>
          <h1 style={h1}>Vous cherchez une compétence, ou un processus ?</h1>
          <p style={lead}>
            Le choix n&apos;enferme rien : un agent seul peut rejoindre un workflow plus tard, sans reconfiguration de son contrat.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
            {[
              {
                key: "agent" as const, formule: "Formule 1", title: "Je veux un agent",
                text: "Une compétence précise à couvrir dès aujourd'hui, sans refondre un processus.",
                points: [`Choix dans la bibliothèque des ${agents.length} agents`, "Une intégration suffit pour démarrer", "Premier livrable en quelques minutes"],
                cta: "Choisir un agent",
              },
              {
                key: "workflow" as const, formule: "Formule 2", title: "Je veux un processus",
                text: "Un enchaînement complet, avec gouvernance et action métier en bout de chaîne.",
                points: ["Workflow prêt à l'emploi ou assemblé", "Points d'approbation et seuils à définir", "Suivi d'exécution en temps réel"],
                cta: "Choisir un workflow",
              },
            ].map((o) => {
              const selected = path === o.key;
              return (
                <button
                  key={o.key}
                  onClick={() => { setPath(o.key); next(); }}
                  style={{
                    ...card, padding: "24px", textAlign: "left", cursor: "pointer",
                    background: selected || o.key === "workflow" ? "var(--steel-tint)" : "var(--surface)",
                    borderColor: selected ? "#4f7399" : "var(--border)",
                  }}
                >
                  <div style={mono}>{o.formule}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "26px", margin: "6px 0", color: "var(--ink)" }}>{o.title}</div>
                  <p style={{ fontSize: "14px", color: "var(--muted-foreground)", margin: "0 0 14px" }}>{o.text}</p>
                  <ul style={{ listStyle: "none", padding: "14px 0 0", margin: "0 0 14px", borderTop: "1px solid var(--line)", fontSize: "12.5px", color: "var(--muted-foreground)", display: "grid", gap: "4px" }}>
                    {o.points.map((p) => <li key={p}>— {p}</li>)}
                  </ul>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--steel-deep)" }}>{o.cta} →</span>
                </button>
              );
            })}
          </div>

          <div style={{ ...card, padding: "20px", marginTop: "20px" }}>
            <div style={{ ...mono, marginBottom: "12px" }}>Intégrations minimales requises</div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {INTEGRATIONS.map((i) => (
                <span
                  key={i.key}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 14px", borderRadius: "999px",
                    border: "1px solid var(--border)", background: i.required ? "var(--steel-tint)" : "var(--paper)",
                    fontSize: "13px", color: "var(--ink)",
                  }}
                >
                  {i.label}
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted-foreground)" }}>
                    {i.required ? "requis" : "optionnel"}
                  </span>
                </span>
              ))}
            </div>
            <p style={{ fontSize: "12px", color: "var(--muted-foreground)", margin: "12px 0 0" }}>
              Les entrées résolues par intégration sont pré-remplies à la première exécution — vous ne saisissez que ce qui ne peut pas être dérivé.
            </p>
          </div>

          <div style={{ marginTop: "22px" }}>
            <button onClick={back} style={ghostBtn}>Retour</button>
          </div>
        </section>
      )}

      {/* ÉTAPE 3 — Intégrations */}
      {step === 3 && (
        <section>
          <div style={mono}>Étape 3 · Intégrations</div>
          <h1 style={h1}>Branchez le minimum pour démarrer</h1>
          <p style={lead}>
            {path === "workflow"
              ? "Un workflow lit et écrit dans vos systèmes : le CRM et l'email sont nécessaires."
              : "Une seule intégration suffit pour qu'un agent produise son premier livrable."}
          </p>

          <div style={{ ...card, maxWidth: "620px" }}>
            {INTEGRATIONS.map((i, idx) => (
              <div
                key={i.key}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: idx === 0 ? "none" : "1px solid var(--line)" }}
              >
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>{i.label}</div>
                  <div style={{ ...mono, marginTop: "2px" }}>{i.required ? "requis" : "optionnel"}</div>
                </div>
                <Link href="/integrations" style={{ fontSize: "13px", fontWeight: 600, color: "var(--steel-deep)" }}>
                  Configurer →
                </Link>
              </div>
            ))}
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "16px", fontSize: "13px", color: "var(--ink)" }}>
            <input type="checkbox" checked={ackIntegrations} onChange={(e) => setAckIntegrations(e.target.checked)} />
            Je configurerai les intégrations depuis la page Intégrations (mode démonstration).
          </label>

          <div style={{ marginTop: "22px", display: "flex", gap: "10px" }}>
            <button onClick={back} style={ghostBtn}>Retour</button>
            <button
              onClick={next}
              disabled={!ackIntegrations}
              style={{ ...primaryBtn, opacity: ackIntegrations ? 1 : 0.5, cursor: ackIntegrations ? "pointer" : "not-allowed" }}
            >
              Continuer <ArrowRight size={14} />
            </button>
          </div>
        </section>
      )}

      {/* ÉTAPE 4 — Première exécution */}
      {step === 4 && (
        <section>
          <div style={mono}>Étape 4 · Première exécution</div>
          <h1 style={h1}>{path === "workflow" ? "Choisissez votre premier workflow" : "Choisissez votre premier agent"}</h1>
          <p style={lead}>{orgName} · {secteur} · équipe {taille} · livrables en {langue}.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {path === "workflow"
              ? workflows.map((w) => {
                  const inner = (
                    <>
                      <div style={mono}>{w.code}</div>
                      <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: "4px 0" }}>{w.name}</div>
                      <div style={{ fontSize: "12.5px", color: "var(--muted-foreground)", marginBottom: "10px" }}>{w.description}</div>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--steel-deep)" }}>
                        {w.studio_ready ? "Ouvrir le studio →" : "Aperçu →"}
                      </span>
                    </>
                  );
                  return w.studio_ready ? (
                    <Link key={w.slug} href={`/workflows/${w.slug}`} style={{ ...card, padding: "18px", textDecoration: "none" }}>{inner}</Link>
                  ) : (
                    <div key={w.slug} style={{ ...card, padding: "18px", opacity: 0.6 }}>{inner}</div>
                  );
                })
              : agents.map((a) => (
                  <Link key={a.slug} href={`/agents/${a.slug}`} style={{ ...card, padding: "18px", textDecoration: "none" }}>
                    <div style={mono}>{a.code}</div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: "4px 0" }}>{a.name}</div>
                    <div style={{ fontSize: "12.5px", color: "var(--muted-foreground)", marginBottom: "10px" }}>{a.role}</div>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--steel-deep)" }}>Ouvrir le studio →</span>
                  </Link>
                ))}
          </div>

          <div style={{ marginTop: "22px", display: "flex", gap: "10px" }}>
            <button onClick={back} style={ghostBtn}>Retour</button>
            <Link href="/dashboard" style={ghostBtn}>Terminer plus tard</Link>
          </div>
        </section>
      )}
    </div>
    <OnboardingAside
      step={step}
      orgName={orgName}
      secteur={secteur}
      taille={taille}
      langue={langue}
      path={path}
      agentCount={agents.length}
      workflowCount={workflows.length}
    />
    </div>
  );
}

const CHAIN = ["Yasmine", "Mehdi", "Karim", "Salma", "Anas", "Nadia"];

function OnboardingAside({
  step, orgName, secteur, taille, langue, path, agentCount, workflowCount,
}: {
  step: number; orgName: string; secteur: string; taille: string; langue: string;
  path: Path; agentCount: number; workflowCount: number;
}) {
  const recap = [
    { label: "Organisation", value: orgName, done: step > 1 },
    { label: "Secteur", value: secteur, done: step > 1 },
    { label: "Équipe", value: taille, done: step > 1 },
    { label: "Livrables", value: langue, done: step > 1 },
    { label: "Entrée", value: path === "agent" ? "Un agent" : path === "workflow" ? "Un processus" : "À choisir", done: step > 2 },
  ];

  return (
    <aside style={{ flex: "0 0 340px", maxWidth: "100%", display: "grid", gap: "12px" }}>
      {/* Carte héro */}
      <div
        style={{
          borderRadius: "14px", padding: "16px 18px", color: "#f5f6f8",
          background: "linear-gradient(160deg, var(--steel-deep), #1d3450)",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.18)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-mono)", fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(245,246,248,0.6)" }}>
          <Sparkles size={12} /> Votre espace IAChain
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 700, margin: "8px 0 12px", lineHeight: 1.25 }}>
          Des agents qui produisent, pas qui bavardent.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
          {[
            { v: String(agentCount), l: "agents" },
            { v: String(workflowCount), l: "workflows" },
            { v: "≈ 5 min", l: "1er livrable" },
          ].map((s) => (
            <div key={s.l} style={{ background: "rgba(255,255,255,0.08)", borderRadius: "8px", padding: "8px 6px", textAlign: "center" }}>
              <div style={{ fontSize: "15px", fontWeight: 700 }}>{s.v}</div>
              <div style={{ fontSize: "10px", color: "rgba(245,246,248,0.65)", marginTop: "1px" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Récapitulatif en direct */}
      <div style={{ ...card, padding: "14px 16px" }}>
        <div style={{ ...mono, marginBottom: "6px" }}>Votre configuration</div>
        {recap.map((r, i) => (
          <div
            key={r.label}
            style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "7px 0",
              borderTop: i === 0 ? "none" : "1px solid var(--line)",
            }}
          >
            <span
              style={{
                width: "16px", height: "16px", borderRadius: "999px", flexShrink: 0,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: r.done ? "var(--steel-deep)" : "transparent",
                border: r.done ? "none" : "1px solid var(--line)",
                color: "#fff",
              }}
            >
              {r.done && <Check size={10} />}
            </span>
            <span style={{ fontSize: "11.5px", color: "var(--muted-foreground)", width: "78px", flexShrink: 0 }}>{r.label}</span>
            <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--ink)", marginLeft: "auto", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {r.value}
            </span>
          </div>
        ))}
      </div>

      {/* Exemple de chaîne */}
      <div style={{ ...card, padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
          <span style={mono}>Exemple de processus</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>Prospect to Cash</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px" }}>
          {CHAIN.map((n, i) => (
            <span key={n} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <span style={{ padding: "3px 9px", borderRadius: "999px", background: "var(--steel-tint)", fontSize: "11.5px", color: "var(--ink)" }}>{n}</span>
              {i < CHAIN.length - 1 && <ArrowRight size={11} color="var(--muted-foreground)" />}
            </span>
          ))}
        </div>
        <p style={{ fontSize: "11.5px", color: "var(--muted-foreground)", margin: "10px 0 0", lineHeight: 1.45 }}>
          La sortie de chaque agent devient l&apos;entrée du suivant, avec une approbation humaine avant tout engagement.
        </p>
      </div>
    </aside>
  );
}