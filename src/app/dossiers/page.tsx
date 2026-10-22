import Link from "next/link";
import AppShell from "@/components/AppShell";
import { getTenantContext } from "@/lib/tenant";
import { listerDossiers } from "@/lib/dossiers";

export const dynamic = "force-dynamic";

const CARD_SHADOW = "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)";

const STATUT: Record<string, { label: string; couleur: string }> = {
  en_cours: { label: "En cours", couleur: "var(--amber)" },
  termine: { label: "Terminé", couleur: "#166534" },
  echoue: { label: "Arrêté", couleur: "var(--red, #b3261e)" },
};

export default async function DossiersPage() {
  const { orgId } = await getTenantContext();
  const dossiers = await listerDossiers(orgId);
  return (
    <AppShell topbar={<span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>Dossiers</span>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 13, color: "var(--graphite)", lineHeight: 1.5 }}>
          Un dossier = un prospect suivi de la capture jusqu&apos;au devis validé. Ouvre-en un pour voir où il en est et quoi faire ensuite.
        </div>
        {dossiers.length === 0 && (
          <div style={{ color: "var(--graphite)", fontSize: 13, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 22px", boxShadow: CARD_SHADOW }}>
            Aucun dossier. Lance une exécution depuis Workflows, Prospect to Cash.
          </div>
        )}
        {dossiers.map((d) => {
          const s = STATUT[d.statut] ?? { label: d.statut, couleur: "var(--graphite)" };
          return (
            <Link
              key={d.executionId}
              href={`/dossiers/${d.executionId}`}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 22px", boxShadow: CARD_SHADOW, textDecoration: "none", color: "inherit" }}
            >
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>{d.client}</div>
                <div style={{ fontSize: 12, color: "var(--graphite)" }}>
                  Exécution {d.runLabel ?? `#${d.executionId}`} · {new Date(d.startedAt).toLocaleDateString("fr-FR")}
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: s.couleur }}>{s.label}</span>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}