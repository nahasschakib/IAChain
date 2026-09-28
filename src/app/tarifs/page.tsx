import Link from "next/link";
import type { CSSProperties } from "react";
import PricingSimulator from "@/components/PricingSimulator";

export const dynamic = "force-dynamic";

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
  padding: "10px 20px",
  borderRadius: 8,
  whiteSpace: "nowrap",
};

export default function TarifsPage() {
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
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 26, fontSize: 14, fontWeight: 500, color: "var(--graphite)" }}>
          <Link href="/#agents" style={{ whiteSpace: "nowrap" }}>Agents</Link>
          <Link href="/#workflows" style={{ whiteSpace: "nowrap" }}>Workflows</Link>
          <Link href="/#qualite" style={{ whiteSpace: "nowrap" }}>Qualité</Link>
          <Link href="/agency" style={{ whiteSpace: "nowrap" }}>Agence IA</Link>
        </div>
        <a href="mailto:contact@iachain.ai" style={BTN_PRIMARY}>Demander une démo</a>
      </div>

      {/* HERO */}
      <div style={{ padding: "clamp(48px,6vw,80px) clamp(24px,4vw,64px) 56px", maxWidth: 1320, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <span style={EYEBROW}>TARIFS</span>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(30px,3.6vw,46px)",
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            margin: "10px 0 0",
            maxWidth: 720,
          }}
        >
          Un socle simple pour démarrer, un prix qui suit ce que vous ajoutez.
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--graphite)", margin: "18px 0 0", maxWidth: 620 }}>
          Un abonnement de base couvre les premiers agents et le premier workflow. Le simulateur ci-dessous
          calcule en direct ce que coûte votre usage réel — agents, workflows et volume d&apos;exécutions.
        </p>
      </div>

      {/* SOCLE — palier d'entrée */}
      <div style={{ ...SECTION, paddingBottom: 56 }}>
        <div style={{ ...CARD, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          <div style={{ flex: "1 1 320px" }}>
            <span style={{ ...EYEBROW, fontSize: 11 }}>PALIER D&apos;ENTRÉE</span>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, margin: "8px 0 6px" }}>
              Socle IAChain
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--graphite)", margin: 0, maxWidth: 480 }}>
              3 agents actifs, 1 workflow métier complet, jusqu&apos;à 200 exécutions par mois, journal d&apos;audit
              et intégrations de base incluses. De quoi lancer un premier cas d&apos;usage réel avant d&apos;étendre.
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 36, color: "var(--steel-deep)" }}>
              1 490 MAD
            </div>
            <div style={{ fontSize: 12.5, color: "var(--graphite)" }}>HT / mois</div>
          </div>
        </div>
      </div>

      {/* SIMULATEUR */}
      <div style={SECTION}>
        <span style={EYEBROW}>SIMULATEUR</span>
        <h2 style={H2}>Ajustez selon vos besoins.</h2>
        <PricingSimulator />
      </div>

      {/* FORMULES — rappel des deux offres */}
      <div style={SECTION}>
        <span style={EYEBROW}>LES DEUX FORMULES</span>
        <h2 style={H2}>Un agent aujourd&apos;hui, un processus demain.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 18 }}>
          <div style={CARD}>
            <span style={{ ...EYEBROW, fontSize: 11 }}>FORMULE 1</span>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, margin: "8px 0" }}>
              Bibliothèque d&apos;agents
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--graphite)", margin: 0 }}>
              Activez une compétence précise, branchez une intégration, produisez un premier livrable. Facturé au
              nombre d&apos;agents actifs.
            </p>
          </div>
          <div style={{ ...CARD, border: "1px solid var(--steel)" }}>
            <span style={{ ...EYEBROW, fontSize: 11 }}>FORMULE 2</span>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, margin: "8px 0" }}>
              Processus métier
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--graphite)", margin: 0 }}>
              Des workflows complets — branches parallèles, fusions, approbations, action finale — suivis en temps
              réel. Facturé au nombre de workflows actifs.
            </p>
          </div>
          <div style={CARD}>
            <span style={{ ...EYEBROW, fontSize: 11 }}>CABINET / AGENCE</span>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, margin: "8px 0" }}>
              Marque blanche
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--graphite)", margin: 0 }}>
              Plusieurs clients finaux gérés depuis un seul compte, organisation dédiée. Toujours sur devis.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ courte */}
      <div style={SECTION}>
        <span style={EYEBROW}>QUESTIONS FRÉQUENTES</span>
        <h2 style={H2}>Ce qu&apos;il faut savoir avant de simuler.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 18 }}>
          {[
            {
              q: "Qu'est-ce qu'une « exécution » ?",
              a: "Chaque fois qu'un agent traite une tâche — un lead qualifié, un ticket classé, un cas de non-conformité analysé — compte comme une exécution.",
            },
            {
              q: "Puis-je changer de palier en cours de mois ?",
              a: "Oui, le nombre d'agents et de workflows actifs peut évoluer à tout moment ; la facturation suit l'usage réel du mois suivant.",
            },
            {
              q: "L'Agence IA est-elle incluse ?",
              a: "Non. Le diagnostic, la conception et l'intégration sur mesure sont facturés au projet, séparément de l'abonnement plateforme.",
            },
            {
              q: "Et si mon besoin ne rentre dans aucun palier ?",
              a: "Le palier Cabinet couvre le multi-tenant et les gros volumes ; pour tout le reste, un premier échange suffit à cadrer une offre sur mesure.",
            },
          ].map((item) => (
            <div key={item.q} style={{ ...CARD, display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>{item.q}</span>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--graphite)", margin: 0 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA FINAL */}
      <div style={{ background: "var(--steel-deep)", color: "#f5f6f8", padding: "clamp(48px,6vw,72px) clamp(24px,4vw,64px)" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", display: "flex", gap: 56, flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ flex: "1 1 380px", minWidth: 300 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(24px,3vw,34px)", lineHeight: 1.1, margin: 0, letterSpacing: "-0.01em" }}>
              Pas sûr du palier qui vous convient ?
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "#c7ccd4", margin: "16px 0 0", maxWidth: 440 }}>
              Un premier échange suffit pour cadrer le bon point de départ selon votre processus le plus rentable
              à automatiser.
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
        <span>Tarifs indicatifs, hors taxes, sujets à confirmation lors d&apos;un diagnostic.</span>
      </div>
    </div>
  );
}