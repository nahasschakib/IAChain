import { OrganizationSwitcher, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

const MESSAGES: Record<string, { title: string; text: string }> = {
  attente: {
    title: "Compte en attente de validation",
    text: "Votre organisation est enregistrée. L'accès à la plateforme s'ouvre après validation par l'équipe IAChain, une fois le règlement de l'abonnement confirmé.",
  },
  suspendu: {
    title: "Compte suspendu",
    text: "L'accès de votre organisation est suspendu. Contactez l'équipe IAChain pour le rétablir.",
  },
    echeance: {
    title: "Période d'accès terminée",
    text: "L'essai ou l'abonnement de votre organisation est arrivé à échéance. Vos données sont conservées. Contactez l'équipe IAChain pour renouveler l'accès.",
  },
  organisation: {
    title: "Aucune organisation active",
    text: "Sélectionnez ou créez l'organisation avec laquelle vous souhaitez travailler.",
  },
};

export default async function EnAttentePage({ searchParams }: { searchParams: Promise<{ raison?: string }> }) {
  const { raison } = await searchParams;
  const m = MESSAGES[raison ?? "attente"] ?? MESSAGES.attente;
  const peutReessayer = (raison ?? "attente") !== "organisation";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--paper)",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 14,
          padding: 28,
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, marginBottom: 10 }}>{m.title}</div>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--graphite)", margin: "0 0 20px" }}>{m.text}</p>
         {peutReessayer && (
          <div style={{ margin: "0 0 20px" }}>
            <Link
              href="/dashboard"
              prefetch={false}
              style={{
                display: "inline-block",
                fontSize: 13,
                fontWeight: 600,
                padding: "9px 16px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              Vérifier mon accès
            </Link>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--graphite)", margin: "14px 0 0" }}>
              Une question ? Écrivez à <a href="mailto:contact@socytay.ma" style={{ color: "inherit", fontWeight: 600 }}>contact@socytay.ma</a>.
            </p>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <OrganizationSwitcher hidePersonal afterSelectOrganizationUrl="/dashboard" />
          <SignOutButton>
            <button
              type="button"
              style={{
                font: "inherit",
                fontSize: 13,
                fontWeight: 600,
                padding: "9px 16px",
                borderRadius: 8,
                border: "1px solid var(--line)",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Se déconnecter
            </button>
          </SignOutButton>
        </div>
      </div>
    </main>
  );
}