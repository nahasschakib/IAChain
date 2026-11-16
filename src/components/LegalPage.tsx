import Link from "next/link";

export type LegalSection = { titre: string; paragraphes: string[] };

export default function LegalPage({
  titre,
  miseAJour,
  intro,
  sections,
  autre,
}: {
  titre: string;
  miseAJour: string;
  intro: string;
  sections: LegalSection[];
  autre: { href: string; label: string };
}) {
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
      <header
        style={{
          padding: "18px clamp(24px,4vw,64px)",
          borderBottom: "1px solid var(--line)",
          background: "var(--surface)",
        }}
      >
        <Link href="/" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18 }}>
          IAChain
        </Link>
      </header>

      <main
        style={{
          width: "100%",
          maxWidth: 780,
          margin: "0 auto",
          padding: "48px clamp(24px,4vw,64px) 96px",
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "clamp(28px,3vw,38px)",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          {titre}
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--steel)", margin: "10px 0 24px" }}>
          Dernière mise à jour : {miseAJour}
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.7 }}>{intro}</p>

        {sections.map((s) => (
          <section key={s.titre} style={{ marginTop: 32 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, margin: "0 0 10px" }}>
              {s.titre}
            </h2>
            {s.paragraphes.map((p, i) => (
              <p key={i} style={{ fontSize: 15, lineHeight: 1.7, margin: "0 0 10px" }}>
                {p}
              </p>
            ))}
          </section>
        ))}

        <p style={{ marginTop: 48, fontSize: 14 }}>
          <Link href={autre.href} style={{ color: "var(--steel-deep)", fontWeight: 600 }}>
            {autre.label}
          </Link>
          {" · "}
          <Link href="/" style={{ color: "var(--steel-deep)", fontWeight: 600 }}>
            Retour à l&apos;accueil
          </Link>
        </p>
      </main>
    </div>
  );
}