import Link from "next/link";

export default function Home() {
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: "-0.01em",
            }}
          >
            IAChain
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 30,
            fontSize: 14,
            fontWeight: 500,
            color: "var(--graphite)",
          }}
        >
          <a href="#agents" style={{ whiteSpace: "nowrap" }}>Agents</a>
          <a href="#workflows" style={{ whiteSpace: "nowrap" }}>Workflows</a>
          <a href="/agency" style={{ whiteSpace: "nowrap" }}>Agence IA</a>
          <a href="#implementation" style={{ whiteSpace: "nowrap" }}>Implémentation</a>
        </div>
        <a
          href="#contact"
          style={{
            background: "var(--steel-deep)",
            color: "#f5f6f8",
            fontSize: 14,
            fontWeight: 600,
            padding: "10px 20px",
            borderRadius: 8,
            whiteSpace: "nowrap",
          }}
        >
          Demander une démo
        </a>
      </div>

      {/* HERO */}
      <div
        style={{
          padding: "clamp(56px,7vw,96px) clamp(24px,4vw,64px) 72px",
          maxWidth: 1320,
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
          display: "flex",
          gap: 56,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            flex: "1 1 440px",
            minWidth: 320,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              border: "1px solid var(--line)",
              borderRadius: 999,
              background: "var(--surface)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.04em",
              color: "var(--steel)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--signal)",
                flexShrink: 0,
              }}
            />
            INFRASTRUCTURE IA D&apos;ENTREPRISE
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "clamp(34px,4vw,54px)",
              lineHeight: 1.04,
              letterSpacing: "-0.02em",
              margin: "22px 0 0",
            }}
          >
            Une main-d&apos;œuvre numérique, spécialisée par métier.
          </h1>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.65,
              color: "var(--graphite)",
              margin: "20px 0 0",
              maxWidth: 480,
            }}
          >
            IAChain orchestre des agents assistants spécialisés au sein de workflows métier complets. Chaque agent
            reçoit l&apos;output du précédent, exécute sa mission et transmet un résultat structuré au suivant — de la
            qualification d&apos;un prospect jusqu&apos;à l&apos;encaissement.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
            <a
              href="#agents"
              style={{
                background: "var(--steel-deep)",
                color: "#f5f6f8",
                fontSize: 14,
                fontWeight: 600,
                padding: "13px 22px",
                borderRadius: 9,
              }}
            >
              Explorer les agents
            </a>
            <a
              href="#workflows"
              style={{
                background: "var(--surface)",
                color: "var(--ink)",
                fontSize: 14,
                fontWeight: 600,
                padding: "13px 22px",
                borderRadius: 9,
                border: "1px solid var(--line)",
              }}
            >
              Voir un workflow en action →
            </a>
          </div>
          <p style={{ fontSize: 13, color: "var(--graphite)", margin: "36px 0 0" }}>
            Conçu pour direction générale, commercial, marketing, finance, opérations, support et IT.
          </p>
        </div>

        <div style={{ flex: "1 1 400px", minWidth: 340, display: "flex", alignItems: "flex-start" }}>
          <div
            style={{
              width: "100%",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 16,
              padding: 22,
              boxShadow: "0 1px 2px rgba(18,21,26,0.04), 0 12px 32px rgba(18,21,26,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 18,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  color: "var(--graphite)",
                }}
              >
                WORKFLOW · PROSPECT TO CASH
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--signal)",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--signal)" }} />
                ACTIF
              </span>
            </div>

            <div
              style={{
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: "14px 16px",
                background: "var(--paper)",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>Agent Qualification</div>
              <div style={{ fontSize: 12, color: "var(--graphite)", marginTop: 2 }}>Analyse le lead entrant</div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", padding: "6px 0" }}>
              <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
                <path d="M7 0V17" stroke="#c7ccd4" strokeWidth="1.4" />
                <path d="M2 13L7 18L12 13" stroke="#c7ccd4" strokeWidth="1.4" />
              </svg>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {["score", "priority", "next_action"].map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    background: "var(--steel-tint)",
                    color: "var(--steel)",
                    padding: "4px 9px",
                    borderRadius: 6,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "center", padding: "6px 0" }}>
              <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
                <path d="M7 0V17" stroke="#c7ccd4" strokeWidth="1.4" />
                <path d="M2 13L7 18L12 13" stroke="#c7ccd4" strokeWidth="1.4" />
              </svg>
            </div>

            <div
              style={{
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: "14px 16px",
                background: "var(--paper)",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>Agent Sales Strategy</div>
              <div style={{ fontSize: 12, color: "var(--graphite)", marginTop: 2 }}>
                Exploite le résultat de qualification, sans reprendre le travail
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS BENTO */}
      <div
        style={{
          padding: "0 clamp(24px,4vw,64px) 88px",
          maxWidth: 1320,
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 14,
          }}
        >
          {[
            { value: "15", label: "Agents assistants spécialisés" },
            { value: "3", label: "Workflows métier bout-en-bout" },
            { value: "5", label: "Étapes d'implémentation, de l'audit à l'optimisation" },
            { value: "6", label: "Domaines métier couverts" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: 22,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32 }}>{stat.value}</span>
              <span style={{ fontSize: 13, color: "var(--graphite)" }}>{stat.label}</span>
            </div>
          ))}
          <div
            style={{
              gridColumn: "span 2",
              background: "var(--steel-deep)",
              color: "#f5f6f8",
              borderRadius: 12,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minWidth: 260,
            }}
          >
            <p style={{ fontSize: 15, lineHeight: 1.55, margin: 0 }}>
              « Pas une collection de chatbots. Une infrastructure où plusieurs spécialistes collaborent sur un même
              processus. »
            </p>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, opacity: 0.6, marginTop: 12 }}>
              — POSITIONNEMENT PRODUIT
            </span>
          </div>
        </div>
      </div>

      {/* FORMULES */}
      <div
        id="agents"
        style={{
          padding: "0 clamp(24px,4vw,64px) 96px",
          maxWidth: 1320,
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 32,
          }}
        >
          <div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                letterSpacing: "0.06em",
                color: "var(--steel)",
              }}
            >
              TROIS NIVEAUX D&apos;ENGAGEMENT
            </span>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "clamp(24px,2.6vw,32px)",
                margin: "8px 0 0",
                letterSpacing: "-0.01em",
              }}
            >
              Du premier agent à la transformation complète
            </h2>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {[
            {
              num: "01",
              title: "Agents indépendants",
              desc: "Sélectionnez, dans une bibliothèque de 15 agents spécialisés, ceux qui répondent à un besoin précis. Chacun a sa mission, ses outils, ses livrables.",
              tags: ["Marketing", "Sales", "Support"],
              id: undefined as string | undefined,
            },
            {
              num: "02",
              title: "Workflows métier",
              desc: "Confiez un processus complet à une chaîne d'agents. L'output de chacun devient l'input du suivant, sans double saisie.",
              tags: ["Idée → Marketing", "Prospect to Cash", "Support Client"],
              id: undefined as string | undefined,
            },
            {
              num: "03",
              title: "Agence IA",
              desc: "Diagnostic, conception et intégration dans votre environnement réel — ERP, CRM, outils métier — par notre équipe.",
              tags: ["Diagnostic", "Intégration", "Déploiement"],
              id: "agence",
            },
          ].map((card) => (
            <div
              key={card.num}
              id={card.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 14,
                padding: 26,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--graphite)" }}>
                  {card.num}
                </span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19" stroke="#5b6472" strokeWidth="1.6" />
                  <path d="M13 6L19 12L13 18" stroke="#5b6472" strokeWidth="1.6" />
                </svg>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19 }}>{card.title}</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--graphite)", margin: 0 }}>{card.desc}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: "auto" }}>
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 12,
                      color: "var(--graphite)",
                      border: "1px solid var(--line)",
                      padding: "4px 10px",
                      borderRadius: 999,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WORKFLOW DEEP DIVE */}
      <div
        id="workflows"
        style={{
          padding: "0 clamp(24px,4vw,64px) 96px",
          maxWidth: 1320,
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            padding: "clamp(20px,3vw,34px)",
          }}
        >
          <span
            style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.06em", color: "var(--steel)" }}
          >
            WORKFLOW STUDIO — APERÇU
          </span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "clamp(22px,2.4vw,28px)",
              margin: "8px 0 26px",
              letterSpacing: "-0.01em",
            }}
          >
            Prospect to Cash, étape par étape
          </h2>

          <div style={{ display: "flex", alignItems: "stretch", gap: 0, overflowX: "auto", paddingBottom: 10 }}>
            {[
              { title: "Lead Capture", sub: "Lead Profile" },
              { title: "Qualification", sub: "Qualification Result" },
              { title: "Sales Strategy", sub: "Sales Strategy" },
              { title: "Proposal", sub: "Proposal" },
            ].map((step) => (
              <div key={step.title} style={{ display: "contents" }}>
                <div
                  style={{
                    minWidth: 148,
                    padding: "14px 14px",
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    background: "var(--paper)",
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{step.title}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--graphite)", marginTop: 4 }}>
                    {step.sub}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", padding: "0 10px", flexShrink: 0, color: "var(--graphite)" }}>
                  →
                </div>
              </div>
            ))}

            <div
              style={{
                minWidth: 148,
                padding: "14px 14px",
                border: "1px dashed var(--steel)",
                borderRadius: 10,
                background: "var(--steel-tint)",
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="#2f5a82" strokeWidth="1.8" />
                  <path d="M4 20C4 15.6 7.6 13 12 13C16.4 13 20 15.6 20 20" stroke="#2f5a82" strokeWidth="1.8" />
                </svg>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--steel)" }}>Human Approval</div>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--steel)", marginTop: 4 }}>
                Validation requise
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", padding: "0 10px", flexShrink: 0, color: "var(--graphite)" }}>
              →
            </div>

            <div
              style={{
                minWidth: 148,
                padding: "14px 14px",
                border: "1px solid var(--line)",
                borderRadius: 10,
                background: "var(--paper)",
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>CRM / Sales Action</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--graphite)", marginTop: 4 }}>
                Sale · Invoice
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", padding: "0 10px", flexShrink: 0, color: "var(--graphite)" }}>
              →
            </div>

            <div
              style={{
                minWidth: 148,
                padding: "14px 14px",
                border: "1px solid var(--steel-deep)",
                borderRadius: 10,
                background: "var(--steel-deep)",
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f5f6f8" }}>Cash</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#c7ccd4", marginTop: 4 }}>
                Résultat final
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AGENT LIBRARY */}
      <div
        style={{
          padding: "0 clamp(24px,4vw,64px) 96px",
          maxWidth: 1320,
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.06em", color: "var(--steel)" }}>
          BIBLIOTHÈQUE D&apos;AGENTS
        </span>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "clamp(24px,2.6vw,32px)",
            margin: "8px 0 32px",
            letterSpacing: "-0.01em",
          }}
        >
          Quinze compétences spécialisées, prêtes à l&apos;emploi
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          {[
            { code: "PR", name: "Prospecting Agent", desc: "Détecte de nouveaux prospects via OMPIC, LinkedIn Sales Navigator et Pages Jaunes Maroc, puis alimente le pipeline commercial." },
            { code: "MK", name: "Marketing Assistant", desc: "Conçoit positionnement, plan et contenus à partir d'une intention marché." },
            { code: "SL", name: "Sales Assistant", desc: "Construit stratégie commerciale et proposition à partir d'un lead qualifié." },
            { code: "LQ", name: "Lead Qualification", desc: "Score, priorise et transmet un résultat structuré au commercial." },
            { code: "CS", name: "Customer Support", desc: "Classe, résout ou escalade une demande client vers un humain si besoin." },
            { code: "FN", name: "Finance Assistant", desc: "Analyse, chiffre et documente une décision financière courante." },
            { code: "OP", name: "Operations Assistant", desc: "Suit l'exécution d'un processus et signale les écarts à traiter." },
          ].map((agent) => (
            <div
              key={agent.code}
              style={{
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: 20,
                background: "var(--surface)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: "var(--steel-tint)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  color: "var(--steel)",
                  fontSize: 13,
                }}
              >
                {agent.code}
              </div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{agent.name}</div>
              <p style={{ fontSize: 13, color: "var(--graphite)", lineHeight: 1.55, margin: 0 }}>{agent.desc}</p>
              <Link href="/agents/lead-qualification"  style={{ fontSize: 13, fontWeight: 600, color: "var(--steel)", marginTop: 6 }}>
                Ouvrir le Studio →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* INTEGRATIONS */}
      <div
        style={{
          padding: "0 clamp(24px,4vw,64px) 96px",
          maxWidth: 1320,
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.06em", color: "var(--steel)" }}>
          COUCHE D&apos;INTÉGRATION
        </span>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "clamp(24px,2.6vw,32px)",
            margin: "8px 0 8px",
            letterSpacing: "-0.01em",
          }}
        >
          Les agents parlent à vos outils, pas l&apos;inverse
        </h2>
        <p style={{ fontSize: 14, color: "var(--graphite)", margin: "0 0 28px", maxWidth: 560 }}>
          Des connecteurs globaux (Stripe, Salesforce, Google Workspace…) partout dans le monde, complétés par des
          connecteurs locaux activés selon votre marché.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {["ERP", "CRM"].map((item) => (
            <div
              key={item}
              style={{
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: 16,
                background: "var(--surface)",
                textAlign: "center",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {item}
            </div>
          ))}
          <div
            style={{
              border: "1.5px solid var(--steel)",
              borderRadius: 10,
              padding: 16,
              background: "var(--steel-tint)",
              textAlign: "center",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--steel)",
            }}
          >
            WhatsApp Business
          </div>
          {["Comptabilité", "Email", "OMPIC", "Excel / CSV", "API / Webhooks", "Bases de données", "CIH · CMI"].map(
            (item) => (
              <div
                key={item}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  padding: 16,
                  background: "var(--surface)",
                  textAlign: "center",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {item}
              </div>
            )
          )}
        </div>
      </div>

      {/* IMPLEMENTATION TIMELINE */}
      <div
        id="implementation"
        style={{
          padding: "0 clamp(24px,4vw,64px) 100px",
          maxWidth: 1320,
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.06em", color: "var(--steel)" }}>
          RÔLE DE L&apos;AGENCE
        </span>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "clamp(24px,2.6vw,32px)",
            margin: "8px 0 36px",
            letterSpacing: "-0.01em",
          }}
        >
          Cinq étapes, de l&apos;audit à l&apos;optimisation continue
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 0,
            position: "relative",
          }}
        >
          {[
            { step: "01 · IDENTIFY", title: "Identifier", desc: "Cartographier les processus automatisables." },
            { step: "02 · DESIGN", title: "Concevoir", desc: "Définir agents, workflows et contrats de données." },
            { step: "03 · INTEGRATE", title: "Intégrer", desc: "Connecter les agents à vos outils réels." },
            { step: "04 · DEPLOY", title: "Déployer", desc: "Mettre en production et former les équipes." },
            { step: "05 · OPTIMIZE", title: "Optimiser", desc: "Mesurer les résultats et ajuster en continu." },
          ].map((phase) => (
            <div
              key={phase.step}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                paddingRight: 16,
                borderTop: "2px solid var(--steel-deep)",
                paddingTop: 16,
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--steel)" }}>
                {phase.step}
              </span>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{phase.title}</div>
              <p style={{ fontSize: 13, color: "var(--graphite)", lineHeight: 1.55, margin: 0 }}>{phase.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FINAL CTA */}
      <div
        id="contact"
        style={{
          background: "var(--steel-deep)",
          color: "#f5f6f8",
          padding: "clamp(48px,6vw,72px) clamp(24px,4vw,64px)",
        }}
      >
        <div
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            display: "flex",
            gap: 56,
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <div style={{ flex: "1 1 380px", minWidth: 300 }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "clamp(24px,3vw,34px)",
                lineHeight: 1.1,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Prêt à transformer un processus métier en workflow d&apos;agents ?
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "#c7ccd4", margin: "16px 0 0", maxWidth: 440 }}>
              Un premier échange suffit pour identifier le processus le plus rentable à automatiser dans votre
              organisation.
            </p>
            <a
              href="#contact"
              style={{
                display: "inline-block",
                background: "#f5f6f8",
                color: "var(--steel-deep)",
                fontSize: 14,
                fontWeight: 700,
                padding: "13px 24px",
                borderRadius: 9,
                marginTop: 28,
              }}
            >
              Demander un diagnostic
            </a>
          </div>
          <div style={{ flex: "1 1 260px", minWidth: 240, display: "flex", flexDirection: "column", gap: 14, fontSize: 14 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.06em", color: "#8b93a1" }}>
              CONTACT
            </span>
            <span>contact@iachain.ai</span>
            <span>Casablanca, Maroc</span>
            <span style={{ color: "#8b93a1" }}>Un produit SOCYTAY</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div
        style={{
          padding: "20px clamp(24px,4vw,64px)",
          borderTop: "1px solid var(--line)",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
          fontSize: 12,
          color: "var(--graphite)",
        }}
      >
        <span>© 2026 IAChain. Tous droits réservés.</span>
        <span>Conception : Agents spécialisés → Studios individuels → Workflows multi-agents → Business Deliverables.</span>
      </div>
    </div>
  );
}