import Link from "next/link";
import type { CSSProperties } from "react";

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

const INCLUS = [
  "Tous les agents du catalogue et leurs workflows",
  "5 utilisateurs",
  "1 000 exécutions par mois",
  "Journal d'audit",
  "Données de votre organisation isolées des autres clients",
];

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
        <a href="mailto:contact@socytay.ma" style={BTN_PRIMARY}>Demander une démo</a>
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
          Une offre unique, simple et transparente.
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--graphite)", margin: "18px 0 0", maxWidth: 620 }}>
          Un abonnement par organisation, tous les agents inclus. Vous démarrez par un essai gratuit de 14 jours,
          sans carte bancaire.
        </p>
      </div>

      {/* OFFRE UNIQUE */}
      <div style={{ ...SECTION, paddingBottom: 56 }}>
        <div style={{ ...CARD, border: "1px solid var(--steel)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 28 }}>
          <div style={{ flex: "1 1 360px" }}>
            <span style={{ ...EYEBROW, fontSize: 11 }}>OFFRE DE LANCEMENT</span>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, margin: "8px 0 12px" }}>
              IAChain
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {INCLUS.map((t) => (
                <li key={t} style={{ fontSize: 14, lineHeight: 1.5, color: "var(--graphite)" }}>
                  ✓ {t}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ textAlign: "right", flex: "0 1 280px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 40, color: "var(--steel-deep)" }}>
              990 MAD
            </div>
            <div style={{ fontSize: 12.5, color: "var(--graphite)" }}>HT / mois, par organisation (TVA 20 % en sus)</div>
            <div style={{ fontSize: 12.5, color: "var(--graphite)", marginTop: 4 }}>
              Annuel : 10 mois payés pour 12
            </div>
            <Link href="/sign-up" style={{ ...BTN_PRIMARY, display: "inline-block", marginTop: 18, padding: "12px 22px" }}>
              Démarrer l&apos;essai de 14 jours
            </Link>
          </div>
        </div>
      </div>

      {/* COMMENT ÇA DÉMARRE */}
      <div style={SECTION}>
        <span style={EYEBROW}>COMMENT ÇA DÉMARRE</span>
        <h2 style={H2}>De l&apos;inscription au premier agent en marche.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 18 }}>
          <div style={CARD}>
            <span style={{ ...EYEBROW, fontSize: 11 }}>ÉTAPE 1</span>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, margin: "8px 0" }}>
              Essai gratuit de 14 jours
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--graphite)", margin: 0 }}>
              Vous créez votre organisation. Notre équipe l&apos;active, et les 14 jours démarrent à ce moment-là.
            </p>
          </div>
          <div style={CARD}>
            <span style={{ ...EYEBROW, fontSize: 11 }}>ÉTAPE 2</span>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, margin: "8px 0" }}>
              Mise en service à distance
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--graphite)", margin: 0 }}>
              Visioconférence d&apos;environ 2 heures, guide écrit, vidéo et checklist, pour obtenir un premier
              résultat réel dès le départ. Environ 2 500 MAD HT, une seule fois. Intervention sur site possible en
              option, aux frais réels.
            </p>
          </div>
          <div style={CARD}>
            <span style={{ ...EYEBROW, fontSize: 11 }}>ÉTAPE 3</span>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, margin: "8px 0" }}>
              Abonnement
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--graphite)", margin: 0 }}>
              Mensuel ou annuel, réglé par virement ou en espèces. À la fin de la période, l&apos;accès est suspendu
              et vos données sont conservées.
            </p>
          </div>
        </div>
      </div>

      {/* BESOIN SPÉCIFIQUE */}
      <div style={SECTION}>
        <span style={EYEBROW}>BESOIN SPÉCIFIQUE</span>
        <h2 style={H2}>Ce qui sort du cadre se traite sur devis.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 18 }}>
          <div style={CARD}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, margin: "0 0 8px" }}>
              Diagnostic
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--graphite)", margin: 0 }}>
              Un premier regard sur vos processus pour identifier ce qui mérite d&apos;être automatisé en priorité.
            </p>
          </div>
          <div style={CARD}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, margin: "0 0 8px" }}>
              Intégration sur mesure
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--graphite)", margin: 0 }}>
              Un branchement spécifique à vos outils ou un agent adapté à votre métier, facturé au projet.
            </p>
          </div>
          <div style={CARD}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, margin: "0 0 8px" }}>
              Cabinet / Agence
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--graphite)", margin: 0 }}>
              Plusieurs clients finaux gérés depuis un seul compte, en marque blanche. Toujours sur devis.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ courte */}
      <div style={SECTION}>
        <span style={EYEBROW}>QUESTIONS FRÉQUENTES</span>
        <h2 style={H2}>Ce qu&apos;il faut savoir avant de démarrer.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 18 }}>
          {[
            {
              q: "Qu'est-ce qu'une « exécution » ?",
              a: "Chaque fois qu'un agent traite une tâche — un e-mail classé, un dossier analysé, un lead qualifié — cela compte comme une exécution. Les traitements automatiques en font partie.",
            },
            {
              q: "Et si je dépasse 1 000 exécutions ?",
              a: "Nous vous prévenons à 80 % de votre quota. Votre service n'est jamais coupé : un pack d'exécutions supplémentaires vous est proposé.",
            },
            {
              q: "Que se passe-t-il à la fin de l'essai ?",
              a: "L'accès est suspendu tant que l'abonnement n'est pas réglé. Vos données sont conservées et l'accès reprend dès le paiement enregistré.",
            },
            {
              q: "L'Agence IA est-elle incluse ?",
              a: "Non. Le diagnostic, la conception et l'intégration sur mesure sont facturés au projet, séparément de l'abonnement.",
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
              Un besoin qui sort du cadre ?
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "#c7ccd4", margin: "16px 0 0", maxWidth: 440 }}>
              Un premier échange suffit pour cadrer un diagnostic, une intégration spécifique ou une offre sur mesure.
            </p>
            <a href="mailto:contact@socytay.ma" style={{ display: "inline-block", background: "#f5f6f8", color: "var(--steel-deep)", fontSize: 14, fontWeight: 700, padding: "13px 24px", borderRadius: 9, marginTop: 28 }}>
              Demander un diagnostic
            </a>
          </div>
          <div style={{ flex: "1 1 260px", minWidth: 240, display: "flex", flexDirection: "column", gap: 14, fontSize: 14 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.06em", color: "#8b93a1" }}>CONTACT</span>
            <span>contact@socytay.ma</span>
            <span>Casablanca, Maroc</span>
            <span style={{ color: "#8b93a1" }}>Un produit SOCYTAY</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ padding: "20px clamp(24px,4vw,64px)", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, fontSize: 12, color: "var(--graphite)" }}>
        <span>© 2026 IAChain. Tous droits réservés.</span>
        <span>Tarifs hors taxes, valables pour le Maroc, sujets à évolution.</span>
      </div>
    </div>
  );
}