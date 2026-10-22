import Link from "next/link";
import AppShell from "@/components/AppShell";
import { sql } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant";
import { listerDossiersChaine } from "@/lib/salma-chaine";

const CARD_SHADOW = "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)";

function formatDate(date: Date): string {
  const now = new Date();
  const diffDays = Math.floor(
    (now.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86400000,
  );
  if (diffDays <= 0) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Hier";
  return `${diffDays} j`;
}

// Pour chaque type d'approbation : ce que l'utilisateur doit faire, dit simplement, et le libellé du bouton.
const CONSIGNES: Record<string, { quoi: string; bouton: string }> = {
  "Go/no-go": { quoi: "Mehdi a qualifié ce prospect : décide de le transmettre à la vente ou non.", bouton: "Décider" },
  "Validation du devis": { quoi: "Nadia a contrôlé le devis de Salma : décide s'il peut partir.", bouton: "Examiner le devis" },
  "Suivi d'avancement": { quoi: "Soumaya a rédigé un message de suivi pour le client : relis-le avant tout envoi.", bouton: "Relire le message" },
  "Relance de devis": { quoi: "Anas a rédigé une relance de devis : relis-la avant tout envoi.", bouton: "Relire la relance" },
};
const CONSIGNE_PAR_DEFAUT = { quoi: "Une décision humaine est attendue.", bouton: "Traiter" };

type Action = {
  cle: string;
  type: string;
  titre: string;
  quoi: string;
  bouton: string;
  href: string;
  dossierId?: number; // dossier (exécution de la chaîne) auquel la ligne se rattache
  agent: string;
  quand: string;
  priorite: number; // plus petit = plus tôt dans la liste
};

const bouton: React.CSSProperties = {
  background: "var(--steel-deep)",
  color: "#f5f6f8",
  fontSize: 13,
  fontWeight: 600,
  padding: "8px 14px",
  borderRadius: 8,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

export default async function TasksPage() {
  const { orgId } = await getTenantContext();

  const actions: Action[] = [];

  // 1) Dossiers de la chaîne qui attendent les lignes de Salma : l'action la plus en amont, donc la première.
  try {
    const dossiers = await listerDossiersChaine(orgId);
    for (const d of dossiers) {
      actions.push({
        cle: `salma-${d.executionId}`,
        type: "Lignes du devis",
        titre: `Devis à préparer · ${d.client}`,
        quoi: "Salma a proposé des lignes du catalogue : vérifie les quantités, puis chiffre le devis.",
        bouton: "Valider les lignes",
        href: `/agents/salma?dossier=${d.executionId}`,
        dossierId: d.executionId,
        agent: "Salma",
        quand: "En attente",
        priorite: 0,
      });
    }
  } catch (e) {
    console.error("TasksPage dossiers", e);
  }

  // 2) Décisions humaines en attente (approbations).
  const rows = await sql`
    SELECT a.id, a.title, a.tag, a.agent_label, a.created_at,
           (SELECT x.id FROM workflow_executions x
            JOIN workflows w ON w.id = x.workflow_id AND w.slug = 'prospect-to-cash'
            WHERE x.org_id = a.org_id
              AND x.id::text = COALESCE(
                a.payload->>'dossier_id',
                a.payload->>'execution_id',
                (SELECT d.execution_id::text FROM devis_validations d
                 WHERE d.org_id = a.org_id AND d.id::text = a.payload->>'devis_validation_id'))
           ) AS dossier
    FROM approvals a
    WHERE a.org_id = ${orgId} AND a.status = 'en_attente'
    ORDER BY a.created_at DESC
  `;
  for (const row of rows) {
    const tag = String(row.tag ?? "");
    const c = CONSIGNES[tag] ?? CONSIGNE_PAR_DEFAUT;
    actions.push({
      cle: `appr-${row.id}`,
      type: tag || "Décision",
      titre: String(row.title ?? "Décision"),
      quoi: c.quoi,
      bouton: c.bouton,
      href: `/approvals?id=${row.id}`,
      dossierId: /^[0-9]+$/.test(String(row.dossier ?? "")) ? Number(row.dossier) : undefined,
      agent: String(row.agent_label ?? ""),
      quand: formatDate(new Date(row.created_at as string)),
      priorite: 1,
    });
  }

  return (
    <AppShell
      topbar={
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>À faire</span>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 13, color: "var(--graphite)", lineHeight: 1.5 }}>
          Tout ce qui attend une action de ta part, au même endroit. Chaque ligne dit quoi faire ; le bouton t&apos;emmène directement
          à la bonne étape, sans passer par les agents ni les workflows.
        </div>

        {actions.length === 0 && (
          <div
            style={{
              color: "var(--graphite)",
              fontSize: 13,
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 14,
              padding: "16px 22px",
              boxShadow: CARD_SHADOW,
            }}
          >
            Rien à faire pour le moment. Lance une exécution depuis Workflows, Prospect to Cash : ce qui demandera ton action apparaîtra ici.
          </div>
        )}

        {actions.map((a) => (
          <div
            key={a.cle}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 14,
              padding: "16px 22px",
              boxShadow: CARD_SHADOW,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--steel-deep)",
                    background: "var(--steel-tint)",
                    borderRadius: 20,
                    padding: "2px 10px",
                  }}
                >
                  {a.type}
                </span>
                <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--graphite)" }}>
                  {a.agent ? `${a.agent} · ` : ""}
                  {a.quand}
                </span>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{a.titre}</div>
              <div style={{ fontSize: 12.5, color: "var(--graphite)" }}>{a.quoi}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
              {a.dossierId && (
                <Link href={`/dossiers/${a.dossierId}`} style={{ fontSize: 12.5, fontWeight: 600, color: "var(--steel)", textDecoration: "none", whiteSpace: "nowrap" }}>
                  Voir le dossier
                </Link>
              )}
              <Link href={a.href} style={bouton}>
                {a.bouton}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}