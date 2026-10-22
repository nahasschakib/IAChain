import Link from "next/link";
import { sql } from "@/lib/db";
import { listerDossiersChaine } from "@/lib/salma-chaine";

// Carte du Dashboard : ce qui attend une action de l'utilisateur, avec accès direct au dossier.
export default async function AFaireCard({ orgId }: { orgId: string }) {
  let dossiers: Awaited<ReturnType<typeof listerDossiersChaine>> = [];
  let nbApprobations = 0;
  try {
    dossiers = await listerDossiersChaine(orgId);
    const r = await sql`SELECT COUNT(*)::int AS n FROM approvals WHERE org_id = ${orgId} AND status = 'en_attente'`;
    nbApprobations = Number(r[0]?.n ?? 0);
  } catch (e) {
    console.error("AFaireCard", e);
  }
  const total = dossiers.length + nbApprobations;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 14,
        padding: 20,
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>À faire</div>
        <Link href="/tasks" style={{ fontSize: 12, fontWeight: 600, color: "var(--steel)" }}>
          Tout voir
        </Link>
      </div>
      {total === 0 ? (
        <div style={{ fontSize: 13, color: "var(--graphite)" }}>Rien n&apos;attend ton action pour le moment.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {dossiers.slice(0, 3).map((d) => (
            <Link
              key={d.executionId}
              href={`/dossiers/${d.executionId}`}
              style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13, color: "inherit", textDecoration: "none" }}
            >
              <span>
                <strong>{d.client}</strong> · lignes du devis à valider
              </span>
              <span style={{ color: "var(--steel)", fontWeight: 600, whiteSpace: "nowrap" }}>Ouvrir le dossier</span>
            </Link>
          ))}
          {nbApprobations > 0 && (
            <Link
              href="/approvals"
              style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13, color: "inherit", textDecoration: "none" }}
            >
              <span>
                {nbApprobations} décision{nbApprobations > 1 ? "s" : ""} à prendre
              </span>
              <span style={{ color: "var(--steel)", fontWeight: 600, whiteSpace: "nowrap" }}>Ouvrir les approbations</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}