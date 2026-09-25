import { sql } from "@/lib/db";
import AppShell from "@/components/AppShell";
import OnboardingFlow, {
  type OnboardingAgent,
  type OnboardingWorkflow,
} from "@/components/onboarding/OnboardingFlow";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const agents = (await sql`
    SELECT slug, name, code, role
    FROM agents
    ORDER BY code ASC
  `) as OnboardingAgent[];

  const workflows = (await sql`
    SELECT slug, code, name, description, studio_ready
    FROM workflows
    ORDER BY sort_order ASC
  `) as OnboardingWorkflow[];

  return (
    <AppShell
      topbar={
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--ink)" }}>
          Onboarding
        </div>
      }
    >
      <OnboardingFlow agents={agents} workflows={workflows} />
    </AppShell>
  );
}