import AppShell from "@/components/AppShell";
import { sql } from "@/lib/db";

const CARD_SHADOW = "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)";
const CARD_SHADOW_HOVER = "0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.05)";

const GLOBAL_CONNECTORS = [
  "Stripe",
  "PayPal",
  "Salesforce",
  "HubSpot",
  "Google Workspace",
  "Microsoft 365",
  "QuickBooks / Xero",
  "Slack / Teams",
  "Zapier",
];

const SOURCING_MAROC = [
  {
    name: "OMPIC",
    recommended: true,
    desc: "Registre du commerce marocain — détecte les entreprises nouvellement immatriculées pour le Prospecting Agent.",
  },
  {
    name: "LinkedIn Sales Navigator",
    recommended: true,
    desc: "Identifie les décideurs B2B par secteur et taille d'entreprise pour le Prospecting Agent.",
  },
  {
    name: "Pages Jaunes Maroc",
    recommended: false,
    desc: "Annuaire professionnel local, complémentaire à OMPIC pour les TPE/PME peu présentes en ligne.",
  },
];

const OTHER_MAROC = [
  { name: "CMI / CIH Bank", desc: "Paiement en ligne et rapprochement bancaire local." },
  { name: "Comptabilité", desc: "Rapprochement, écritures et clôtures automatisées." },
  { name: "Excel / CSV", desc: "Import et export de données tabulaires." },
  { name: "API / Webhooks", desc: "Connexion à un système propriétaire ou tiers." },
  { name: "Bases de données", desc: "Lecture et écriture directe sur vos bases métier." },
  { name: "Outils support", desc: "Files de tickets et centres d'aide existants." },
];

const SECTION_LABEL_STYLE = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  letterSpacing: "0.06em",
  color: "var(--steel)",
};
function formatRelative(value: string | null): string {
  if (!value) return "—";
  const min = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  if (min < 1440) return `il y a ${Math.round(min / 60)} h`;
  return `il y a ${Math.round(min / 1440)} j`;
}

const LEVEL_TONE: Record<string, string> = { ok: "signal", warn: "amber", error: "red" };

export default async function IntegrationsPage() {
  const rows = await sql`SELECT name, status, tone, description, meta FROM integrations ORDER BY id`;
  const CONNECTED = rows.map((row) => ({
    name: row.name as string,
    status: row.status as string,
    tone: row.tone as "signal" | "amber",
    desc: row.description as string,
    meta: row.meta as string,
  }));
    const healthRows = await sql`
    SELECT i.name, i.tone, i.status, i.last_sync_at,
           COUNT(l.id) FILTER (WHERE l.level = 'error' AND l.created_at > now() - interval '7 days') AS errors_7d
    FROM integrations i
    LEFT JOIN integration_logs l ON l.integration_id = i.id
    GROUP BY i.id
    ORDER BY i.id
  `;
  const logRows = await sql`
    SELECT i.name, l.level, l.message, l.created_at
    FROM integration_logs l
    JOIN integrations i ON i.id = l.integration_id
    ORDER BY l.created_at DESC
    LIMIT 6
  `;
  const mappingRows = await sql`
    SELECT m.source_field, m.agent_field, m.transform
    FROM integration_mappings m
    JOIN integrations i ON i.id = m.integration_id
    WHERE i.name ILIKE 'CRM%'
    ORDER BY m.position
  `;

  return (
    <AppShell
      topbar={
        <>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>Intégrations</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.04em",
                color: "var(--graphite)",
                border: "1px solid var(--line)",
                borderRadius: 6,
                padding: "5px 9px",
              }}
            >
              Rôle requis · Admin / IT
            </span>
            <a
              href="#"
              style={{
                background: "var(--steel-deep)",
                color: "#f5f6f8",
                fontSize: 13,
                fontWeight: 600,
                padding: "9px 16px",
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.18)",
              }}
            >
              + Ajouter une intégration
            </a>
          </div>
        </>
      }
    >
      <style>{`
        .integ-card {
          transition: box-shadow 0.15s ease, transform 0.15s ease;
        }
        .integ-card:hover {
          box-shadow: ${CARD_SHADOW_HOVER};
          transform: translateY(-2px);
        }
      `}</style>

      {/* MARKET SELECTOR */}
      <div
        style={{
          background: "var(--steel-tint)",
          border: "1px solid #cddce7",
          borderRadius: 12,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          boxShadow: CARD_SHADOW,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#2f5a82" strokeWidth="1.6" />
            <path
              d="M3 12H21M12 3C14.5 5.8 15.8 9 15.8 12C15.8 15 14.5 18.2 12 21C9.5 18.2 8.2 15 8.2 12C8.2 9 9.5 5.8 12 3Z"
              stroke="#2f5a82"
              strokeWidth="1.4"
            />
          </svg>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--steel)" }}>Marché actif : Maroc</div>
            <div style={{ fontSize: 12, color: "var(--graphite)" }}>
              Détermine la devise, la réglementation et les connecteurs locaux proposés ci-dessous.
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: CARD_SHADOW,
          }}
        >
          Changer de marché
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M6 9L12 15L18 9" stroke="#12151a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* CONNECTED */}
      <div>
        <div style={{ marginBottom: 14 }}>
          <span style={SECTION_LABEL_STYLE}>CONNECTÉES</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {CONNECTED.map((item) => (
            <div
              key={item.name}
              className="integ-card"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxShadow: CARD_SHADOW,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: `var(--${item.tone})`,
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: `var(--${item.tone})` }} />
                  {item.status}
                </span>
              </div>
              <p style={{ fontSize: 12, color: "var(--graphite)", margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
              <div style={{ fontSize: 11, color: "var(--graphite)" }}>{item.meta}</div>
            </div>
          ))}
        </div>
      </div>

            {/* MAPPING + SANTÉ & LOGS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 14 }}>
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: 18,
            boxShadow: CARD_SHADOW,
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <span style={SECTION_LABEL_STYLE}>MAPPING · CRM ↔ AGENT</span>
          </div>
          {mappingRows.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--graphite)" }}>Aucun mapping configuré.</div>
          ) : (
            mappingRows.map((m, i) => (
              <div
                key={`${m.source_field}-${i}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 0",
                  borderBottom: i < mappingRows.length - 1 ? "1px solid var(--line)" : "none",
                }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{m.source_field as string}</span>
                <span style={{ color: "var(--graphite)" }}>→</span>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--steel)" }}>
                    {m.agent_field as string}
                  </div>
                  {m.transform ? (
                    <div style={{ fontSize: 11, color: "var(--graphite)", marginTop: 2 }}>{m.transform as string}</div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: 18,
            boxShadow: CARD_SHADOW,
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <span style={SECTION_LABEL_STYLE}>SANTÉ & LOGS</span>
          </div>
          {healthRows.map((h, i) => (
            <div
              key={h.name as string}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "8px 0",
                borderBottom: i < healthRows.length - 1 ? "1px solid var(--line)" : "none",
                fontSize: 12,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: `var(--${h.tone as string})` }} />
                {h.name as string}
              </span>
              <span style={{ color: "var(--graphite)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                {`sync ${formatRelative(h.last_sync_at as string | null)} · ${Number(h.errors_7d)} err. 7 j`}
              </span>
            </div>
          ))}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
            <div style={{ ...SECTION_LABEL_STYLE, color: "var(--graphite)", marginBottom: 8 }}>JOURNAL RÉCENT</div>
            {logRows.map((l, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, padding: "5px 0", alignItems: "baseline" }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: `var(--${LEVEL_TONE[l.level as string] ?? "graphite"})`,
                  }}
                />
                <span style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600 }}>{l.name as string}</span> · {l.message as string}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--graphite)", whiteSpace: "nowrap" }}>
                  {formatRelative(l.created_at as string)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GLOBAL CONNECTORS */}
      <div>
        <div style={{ marginBottom: 4 }}>
          <span style={SECTION_LABEL_STYLE}>DISPONIBLES — CONNECTEURS GLOBAUX</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--graphite)", margin: "0 0 14px" }}>Disponibles quel que soit votre marché.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 28 }}>
          {GLOBAL_CONNECTORS.map((name) => (
            <div
              key={name}
              className="integ-card"
              style={{
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: "14px 16px",
                background: "var(--surface)",
                fontSize: 13,
                fontWeight: 600,
                boxShadow: CARD_SHADOW,
              }}
            >
              {name}
            </div>
          ))}
        </div>
      </div>

      {/* SOURCING MAROC */}
      <div>
        <div style={{ marginBottom: 4 }}>
          <span style={SECTION_LABEL_STYLE}>DISPONIBLES — SOURCING PROSPECTS · MAROC</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--graphite)", margin: "0 0 14px" }}>Propres au marché sélectionné ci-dessus.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 24 }}>
          {SOURCING_MAROC.map((item) => (
            <div
              key={item.name}
              className="integ-card"
              style={{
                background: "var(--surface)",
                border: item.recommended ? "2px solid var(--steel)" : "1px solid var(--line)",
                borderRadius: 12,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxShadow: item.recommended ? CARD_SHADOW_HOVER : CARD_SHADOW,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</span>
                {item.recommended && (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      background: "var(--steel-tint)",
                      color: "var(--steel)",
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontWeight: 700,
                    }}
                  >
                    Recommandé
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, color: "var(--graphite)", margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
              <a href="#" style={{ fontSize: 12, fontWeight: 600, color: "var(--steel)", marginTop: 2 }}>
                Connecter →
              </a>
            </div>
          ))}
        </div>

        {/* OTHER MAROC */}
        <div style={{ marginBottom: 4 }}>
          <span style={SECTION_LABEL_STYLE}>DISPONIBLES — AUTRES · MAROC</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--graphite)", margin: "0 0 14px" }}>Propres au marché sélectionné ci-dessus.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {OTHER_MAROC.map((item) => (
            <div
              key={item.name}
              className="integ-card"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxShadow: CARD_SHADOW,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</span>
              <p style={{ fontSize: 12, color: "var(--graphite)", margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
              <a href="#" style={{ fontSize: 12, fontWeight: 600, color: "var(--steel)", marginTop: 2 }}>
                Connecter →
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* CTA AGENCE */}
      <div
        style={{
          background: "var(--steel-deep)",
          color: "#f5f6f8",
          borderRadius: 14,
          padding: "20px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          boxShadow: CARD_SHADOW_HOVER,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Un outil métier spécifique à connecter ?</div>
          <div style={{ fontSize: 12, color: "#c7ccd4" }}>
            L&apos;Agence IA peut développer un connecteur sur mesure vers votre système existant.
          </div>
        </div>
        <a
          href="/agency"
          style={{
            background: "#f5f6f8",
            color: "var(--steel-deep)",
            fontSize: 13,
            fontWeight: 700,
            padding: "10px 18px",
            borderRadius: 8,
            whiteSpace: "nowrap",
          }}
        >
          Contacter l&apos;agence
        </a>
      </div>
    </AppShell>
  );
}