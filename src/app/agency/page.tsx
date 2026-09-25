const PARCOURS = [
  { step: "01 · IDENTIFY", title: "Identifier", desc: "Cartographier les processus automatisables et chiffrer leur potentiel." },
  { step: "02 · DESIGN", title: "Concevoir", desc: "Définir agents, workflows et contrats de données propres à votre métier." },
  { step: "03 · INTEGRATE", title: "Intégrer", desc: "Connecter les agents à votre ERP, CRM et outils existants." },
  { step: "04 · DEPLOY", title: "Déployer", desc: "Mettre en production, former les équipes, sécuriser les approbations." },
  { step: "05 · OPTIMIZE", title: "Optimiser", desc: "Mesurer les résultats et ajuster les agents en continu." },
];

const SERVICES = [
  { title: "AI Consulting & Diagnostic", desc: "Audit de vos processus et évaluation du potentiel d'automatisation, chiffré et priorisé." },
  { title: "Process Mapping", desc: "Cartographie précise des étapes, décisions et données de chaque processus ciblé." },
  { title: "Agent & Workflow Design", desc: "Conception d'agents et de workflows sur mesure, alignés sur votre organisation." },
  { title: "Implementation & Intégration", desc: "Connexion aux systèmes existants : ERP, CRM, comptabilité, outils métier." },
  { title: "Formation des équipes", desc: "Adoption accompagnée pour que vos équipes pilotent leurs agents en autonomie." },
  { title: "Optimisation continue", desc: "Suivi de performance et ajustement des agents après mise en production." },
];

const STUDIO_STEPS = ["Objectif métier", "Workflow", "Agents", "Outils", "Intégrations"];

const CAS_USAGE = [
  { num: "01", title: "De l'idée au Marketing", desc: "D'une intention produit à une campagne prête à lancer, en passant par positionnement et contenus." },
  { num: "02", title: "Prospect to Cash", desc: "De la capture d'un lead jusqu'à l'encaissement, avec validation humaine sur les étapes sensibles." },
  { num: "03", title: "Support Client", desc: "Classification, résolution automatique et escalade humaine si la demande dépasse l'IA." },
];

export default function AgencyPage() {
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
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--graphite)",
              border: "1px solid var(--line)",
              padding: "2px 8px",
              borderRadius: 999,
              marginLeft: 4,
            }}
          >
            AGENCE
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 30, fontSize: 14, fontWeight: 500, color: "var(--graphite)" }}>
          <a href="#parcours">Parcours</a>
          <a href="#services">Services</a>
          <a href="#studio">AI Studio</a>
          <a href="#cas">Cas d&apos;usage</a>
        </div>
        <a
          href="#contact"
          style={{
            background: "var(--steel-deep)",
            color: "#f5f6f8",
            fontSize: 14,
            fontWeight: 600,
            padding: "10px 20px",
            borderRadius: 8,
            whiteSpace: "nowrap",
          }}
        >
          Demander un diagnostic
        </a>
      </div>

      {/* HERO */}
      <div style={{ padding: "clamp(56px,7vw,96px) clamp(24px,4vw,64px) 64px", maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
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
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--signal)" }} />
          AI AUTOMATION &amp; IMPLEMENTATION PARTNER
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(32px,4.4vw,52px)",
            lineHeight: 1.06,
            letterSpacing: "-0.02em",
            margin: "22px 0 0",
            maxWidth: 780,
          }}
        >
          Nous ne vendons pas des chatbots. Nous automatisons vos processus métier.
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.65, color: "var(--graphite)", margin: "20px 0 0", maxWidth: 620 }}>
          Diagnostic, conception, implémentation et intégration d&apos;agents IA dans votre environnement réel — ERP,
          CRM, outils métier — par l&apos;équipe qui a conçu IAChain.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
          <a
            href="#contact"
            style={{ background: "var(--steel-deep)", color: "#f5f6f8", fontSize: 14, fontWeight: 600, padding: "13px 22px", borderRadius: 9 }}
          >
            Demander un diagnostic
          </a>
          <a
            href="#studio"
            style={{ background: "var(--surface)", color: "var(--ink)", fontSize: 14, fontWeight: 600, padding: "13px 22px", borderRadius: 9, border: "1px solid var(--line)" }}
          >
            Essayer l&apos;AI Studio →
          </a>
        </div>
      </div>

      {/* PARCOURS */}
      <div id="parcours" style={{ padding: "0 clamp(24px,4vw,64px) 96px", maxWidth: 1320, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.06em", color: "var(--steel)" }}>RÔLE DE L&apos;AGENCE</span>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(24px,2.6vw,32px)", margin: "8px 0 36px", letterSpacing: "-0.01em" }}>
          Cinq étapes, de l&apos;audit à l&apos;optimisation continue
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 0 }}>
          {PARCOURS.map((p) => (
            <div key={p.step} style={{ display: "flex", flexDirection: "column", gap: 10, paddingRight: 16, borderTop: "2px solid var(--steel-deep)", paddingTop: 16 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--steel)" }}>{p.step}</span>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{p.title}</div>
              <p style={{ fontSize: 13, color: "var(--graphite)", lineHeight: 1.55, margin: 0 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SERVICES */}
      <div id="services" style={{ padding: "0 clamp(24px,4vw,64px) 96px", maxWidth: 1320, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.06em", color: "var(--steel)" }}>SERVICES</span>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(24px,2.6vw,32px)", margin: "8px 0 32px", letterSpacing: "-0.01em" }}>
          Un accompagnement de bout en bout
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          {SERVICES.map((s) => (
            <div key={s.title} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 22, background: "var(--surface)" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{s.title}</div>
              <p style={{ fontSize: 13, color: "var(--graphite)", lineHeight: 1.55, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI STUDIO DEMO */}
      <div id="studio" style={{ padding: "0 clamp(24px,4vw,64px) 96px", maxWidth: 1320, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <div style={{ background: "var(--steel-deep)", color: "#f5f6f8", borderRadius: 18, padding: "clamp(28px,4vw,44px)" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.06em", color: "#9fb4c6" }}>
            AI STUDIO — DÉMONSTRATION
          </span>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(22px,2.6vw,30px)", margin: "10px 0 8px", letterSpacing: "-0.01em" }}>
            Un objectif métier, transformé en résultat concret
          </h2>
          <p style={{ fontSize: 14, color: "#c7ccd4", margin: "0 0 28px", maxWidth: 560 }}>
            Pas une animation marketing : le même moteur que celui qui exécute vos workflows en production.
          </p>

          <div style={{ display: "flex", alignItems: "stretch", gap: 0, overflowX: "auto", paddingBottom: 6 }}>
            {STUDIO_STEPS.map((step) => (
              <div key={step} style={{ display: "contents" }}>
                <div
                  style={{
                    minWidth: 140,
                    padding: "12px 14px",
                    border: "1px solid rgba(255,255,255,0.16)",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.05)",
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{step}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", padding: "0 8px", flexShrink: 0, color: "#8b93a1" }}>→</div>
              </div>
            ))}
            <div
              style={{
                minWidth: 150,
                padding: "12px 14px",
                border: "1px dashed rgba(255,255,255,0.4)",
                borderRadius: 10,
                background: "rgba(255,255,255,0.08)",
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600 }}>Human Approval</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", padding: "0 8px", flexShrink: 0, color: "#8b93a1" }}>→</div>
            <div style={{ minWidth: 150, padding: "12px 14px", borderRadius: 10, background: "#f5f6f8", textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--steel-deep)" }}>Résultat métier</div>
            </div>
          </div>

          <a
            href="#contact"
            style={{ display: "inline-block", marginTop: 28, background: "#f5f6f8", color: "var(--steel-deep)", fontSize: 14, fontWeight: 700, padding: "12px 22px", borderRadius: 8 }}
          >
            Lancer une démonstration
          </a>
        </div>
      </div>

      {/* CAS D'USAGE */}
      <div id="cas" style={{ padding: "0 clamp(24px,4vw,64px) 96px", maxWidth: 1320, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.06em", color: "var(--steel)" }}>CAS D&apos;USAGE</span>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(24px,2.6vw,32px)", margin: "8px 0 32px", letterSpacing: "-0.01em" }}>
          Trois processus, un même principe
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {CAS_USAGE.map((c) => (
            <div key={c.num} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 26 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--graphite)" }}>{c.num}</span>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, margin: "10px 0 8px" }}>{c.title}</div>
              <p style={{ fontSize: 13, color: "var(--graphite)", lineHeight: 1.6, margin: 0 }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FINAL CTA */}
      <div id="contact" style={{ background: "var(--steel-deep)", color: "#f5f6f8", padding: "clamp(48px,6vw,72px) clamp(24px,4vw,64px)" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", display: "flex", gap: 56, flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ flex: "1 1 380px", minWidth: 300 }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "clamp(24px,3vw,34px)",
                lineHeight: 1.1,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Un premier échange suffit pour identifier votre premier processus à automatiser.
            </h2>
            <a
              href="#contact"
              style={{ display: "inline-block", background: "#f5f6f8", color: "var(--steel-deep)", fontSize: 14, fontWeight: 700, padding: "13px 24px", borderRadius: 9, marginTop: 28 }}
            >
              Demander un diagnostic
            </a>
          </div>
          <div style={{ flex: "1 1 260px", minWidth: 240, display: "flex", flexDirection: "column", gap: 14, fontSize: 14 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.06em", color: "#8b93a1" }}>CONTACT</span>
            <span>agence@iachain.ai</span>
            <span>Casablanca, Maroc</span>
            <span style={{ color: "#8b93a1" }}>Un produit SOCYTAY</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div
        style={{
          padding: "20px clamp(24px,4vw,64px)",
          borderTop: "1px solid var(--line)",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
          fontSize: 12,
          color: "var(--graphite)",
        }}
      >
        <span>© 2026 IAChain — Agence IA.</span>
        <span>Identify → Design → Integrate → Deploy → Optimize.</span>
      </div>
    </div>
  );
}