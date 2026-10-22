import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getTenantContext } from "@/lib/tenant";
import { chargerDossier } from "@/lib/dossiers";

export const dynamic = "force-dynamic";

const CARD_SHADOW = "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)";

const ETAT: Record<string, { label: string; fond: string; texte: string }> = {
  done: { label: "Fait", fond: "#166534", texte: "#fff" },
  running: { label: "En cours", fond: "var(--steel-deep)", texte: "#fff" },
  waiting: { label: "À vous", fond: "var(--amber)", texte: "#fff" },
  failed: { label: "Arrêté", fond: "var(--red, #b3261e)", texte: "#fff" },
  pending: { label: "À venir", fond: "transparent", texte: "var(--graphite)" },
};

export default async function DossierPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { orgId } = await getTenantContext();
  const { id } = await params;
  const d = await chargerDossier(orgId, Number(id));
  if (!d) notFound();

  return (
    <AppShell
      topbar={
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
          <Link href="/dossiers" style={{ color: "var(--graphite)", textDecoration: "none", fontWeight: 400 }}>
            Dossiers ·{" "}
          </Link>
          {d.client}
        </span>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 820 }}>
        {d.actions.length > 0 ? (
          d.actions.map((a) => (
            <div key={a.href + a.bouton} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, background: "var(--steel-tint)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 22px" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--graphite)", marginBottom: 4 }}>
                  {d.actions.length > 1 ? "ACTION ATTENDUE" : "PROCHAINE ACTION"}
                </div>
                <div style={{ fontSize: 14 }}>{a.texte}</div>
              </div>
              <Link href={a.href} style={{ background: "var(--steel-deep)", color: "#f5f6f8", fontSize: 13, fontWeight: 600, padding: "9px 16px", borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap" }}>
                {a.bouton}
              </Link>
            </div>
          ))
        ) : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 22px", fontSize: 13, color: "var(--graphite)", boxShadow: CARD_SHADOW }}>
            {d.statut === "termine"
              ? "Dossier terminé : rien à faire pour le moment."
              : d.statut === "echoue"
                ? "Dossier arrêté : voir l'étape concernée ci-dessous."
                : "Les agents travaillent : rien à faire de ton côté pour le moment."}
          </div>
        )}

        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "8px 22px", boxShadow: CARD_SHADOW }}>
          {d.etapes.map((e, i) => {
            const s = ETAT[e.etat] ?? ETAT.pending;
            return (
              <div key={e.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderTop: i === 0 ? "none" : "1px solid var(--line)", opacity: e.etat === "pending" ? 0.6 : 1 }}>
                <span style={{ width: 24, height: 24, borderRadius: 999, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: s.fond, color: s.texte, border: e.etat === "pending" ? "1px solid var(--line)" : "none" }}>
                  {e.etat === "done" ? "✓" : i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {e.titre} <span style={{ fontWeight: 400, color: "var(--graphite)", fontSize: 12 }}>· {e.agent}</span>
                  </div>
                  {e.note && <div style={{ fontSize: 12.5, color: "var(--graphite)" }}>{e.note}</div>}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--graphite)" }}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}