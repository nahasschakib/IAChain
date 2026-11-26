import { SignUp, SignOutButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SignUpPage({ searchParams }: Props) {
  const { userId } = await auth();
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(params)) {
    if (typeof valeur === "string") qs.set(cle, valeur);
  }

  // Une personne déjà connectée ouvre un lien d'invitation : Clerk l'ignorerait en silence.
  // On l'explique, puis on la déconnecte et on rouvre le même lien (ticket conservé).
  if (userId && qs.get("__clerk_ticket")) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--paper)",
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 440,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 28,
          }}
        >
          <h1 style={{ margin: "0 0 12px", fontSize: 22 }}>Vous êtes déjà connecté</h1>
          <p style={{ margin: "0 0 20px", color: "var(--graphite)", lineHeight: 1.5 }}>
            Ce lien est une invitation à rejoindre une organisation, mais une session IAChain est déjà ouverte
            dans ce navigateur. Pour accepter l&apos;invitation avec l&apos;adresse invitée, déconnectez-vous
            d&apos;abord : le bouton ci-dessous vous ramène ensuite sur l&apos;invitation.
          </p>
          <SignOutButton redirectUrl={`/sign-up?${qs.toString()}`}>
            <button
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: "#111827",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Me déconnecter et accepter l&apos;invitation
            </button>
          </SignOutButton>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--paper)",
      }}
    >
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </div>
  );
}