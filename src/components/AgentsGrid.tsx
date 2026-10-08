"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Target,
  Flag,
  FileText,
  Mail,
  Percent,
  Receipt,
  Clock,
  Headphones,
  AlertTriangle,
  PenLine,
  Megaphone,
  Eye,
  BarChart3,
  Users,
  TrendingUp,
  ShoppingCart,
  Activity,
  Gauge,
  ShieldCheck,
  Waves,
  GitFork,
  Wrench,
  Shield,
  RefreshCw,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

export type Agent = {
  name: string;
  slug: string;
  code: string;
  category: string;
  role: string;
  description: string;
  version: string;
  icon: string;
  input_label: string;
  output_label: string;
  workflow_count: number;
  perm_auto: number;
  perm_approval: number;
  perm_blocked: number;
  status: string;
};

const ICONS: Record<string, LucideIcon> = {
  search: Search,
  filter: Filter,
  target: Target,
  flag: Flag,
  "file-text": FileText,
  mail: Mail,
  percent: Percent,
  receipt: Receipt,
  clock: Clock,
  headphones: Headphones,
  "alert-triangle": AlertTriangle,
  pen: PenLine,
  megaphone: Megaphone,
  eye: Eye,
  "bar-chart": BarChart3,
  users: Users,
  "trending-up": TrendingUp,
  "shopping-cart": ShoppingCart,
   activity: Activity,
  gauge: Gauge,
  "shield-check": ShieldCheck,
  waves: Waves,
  "git-fork": GitFork,
  wrench: Wrench,
  shield: Shield,
  "refresh-cw": RefreshCw,
  "book-open": BookOpen,
  
};

const CATEGORY_ORDER = ["SALES", "MARKETING", "E-COMMERCE", "FINANCE", "SUPPORT", "OPS", "RH", "QUALITÉ"];

function useColumns() {
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    const mqSmall = window.matchMedia("(max-width: 640px)");
    const mqMedium = window.matchMedia("(max-width: 1024px)");

    const update = () => {
      if (mqSmall.matches) setColumns(1);
      else if (mqMedium.matches) setColumns(2);
      else setColumns(3);
    };

    update();
    mqSmall.addEventListener("change", update);
    mqMedium.addEventListener("change", update);
    return () => {
      mqSmall.removeEventListener("change", update);
      mqMedium.removeEventListener("change", update);
    };
  }, []);

  return columns;
}

function autonomyLabel(a: Agent): string {
  const parts: string[] = [];
  if (a.perm_auto) parts.push(`${a.perm_auto} auto`);
  if (a.perm_approval) parts.push(`${a.perm_approval} avec validation`);
  if (a.perm_blocked)
    parts.push(`${a.perm_blocked} bloquée${a.perm_blocked > 1 ? "s" : ""}`);
  return parts.length ? parts.join(" · ") : "non définie";
}

export default function AgentsGrid({ agents }: { agents: Agent[] }) {
  const [active, setActive] = useState("TOUS");
  const [hovered, setHovered] = useState<string | null>(null);
  const columns = useColumns();
  const [view, setView] = useState<"carte" | "contrat" | "liste">("carte");
    const present = Array.from(new Set(agents.map((a) => a.category.toUpperCase())));
  const CATEGORIES = [
    "TOUS",
    ...CATEGORY_ORDER.filter((c) => present.includes(c)),
    ...present.filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  const filtered = active === "TOUS" ? agents : agents.filter((a) => a.category.toUpperCase() === active);

  return (
    <div>
               <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
        <div style={{ display: "inline-flex", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
          {(["carte", "contrat", "liste"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              style={{
                font: "inherit",
                fontSize: "12px",
                fontWeight: 600,
                padding: "7px 14px",
                border: "none",
                cursor: "pointer",
                textTransform: "capitalize",
                background: view === v ? "var(--steel-deep)" : "transparent",
                color: view === v ? "#f5f6f8" : "var(--muted-foreground)",
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              border: active === cat ? "1px solid var(--steel-strong, #2f4a63)" : "1px solid var(--border)",
              background: active === cat ? "var(--steel-tint)" : "transparent",
              color: active === cat ? "var(--steel-strong, #2f4a63)" : "var(--muted-foreground)",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.02em",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

            {view === "carte" && (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: "20px",
        }}
      >
     
        {filtered.map((agent) => {
          const Icon = ICONS[agent.icon] ?? Search;
          const initial = agent.name.charAt(0).toUpperCase();
          const isHovered = hovered === agent.slug;

          return (
            <div
              key={agent.slug}
              onMouseEnter={() => setHovered(agent.slug)}
              onMouseLeave={() => setHovered(null)}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "4px",
                padding: "22px",
                background: "var(--surface, #fff)",
                boxShadow: isHovered
                  ? "0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.05)"
                  : "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
                transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                transition: "all 0.18s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      background: "linear-gradient(135deg, var(--steel-tint), var(--steel-deep, #3d5f80))",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                      fontWeight: 700,
                      color: "var(--steel-strong, #2f4a63)",
                    }}
                  >
                    {initial}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-6px",
                      right: "-6px",
                      width: "24px",
                      height: "24px",
                      background: "var(--steel-strong, #2f4a63)",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 1px 2px rgba(15, 23, 42, 0.15)",
                    }}
                  >
                    <Icon size={14} color="#fff" />
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      background: "var(--steel-tint)",
                      borderRadius: "3px",
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    {agent.code}
                  </span>
                  <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "6px", fontFamily: "monospace" }}>
                    {agent.version}
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: "19px", fontWeight: 700, marginBottom: "2px", letterSpacing: "-0.01em" }}>{agent.name}</h3>
              <div style={{ color: "var(--muted-foreground)", fontSize: "13px", fontWeight: 500, marginBottom: "12px" }}>
                {agent.role}
              </div>
              <p style={{ color: "var(--muted-foreground)", fontSize: "13px", lineHeight: 1.55, marginBottom: "16px", minHeight: "40px" }}>
                {agent.description}
              </p>

              <div style={{ display: "flex", gap: "24px", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--muted-foreground)", letterSpacing: "0.06em", marginBottom: "3px" }}>
                    Entrée
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 500 }}>{agent.input_label}</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--muted-foreground)", letterSpacing: "0.06em", marginBottom: "3px" }}>
                    Sortie
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 500 }}>{agent.output_label}</div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px",
                  borderTop: "1px solid var(--border)",
                  paddingTop: "14px",
                }}
              >
                                <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                  Utilisé dans {agent.workflow_count} workflow{agent.workflow_count > 1 ? "s" : ""}
                  <br />
                  Autonomie : {autonomyLabel(agent)}
                </span>
                <Link
                  href={`/agents/${agent.slug}`}
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--steel-strong, #2f4a63)",
                  }}
                >
                  Ouvrir le studio →
                </Link>
              </div>
            </div>
          );
                })}
      </div>
      )}

      {view === "contrat" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map((agent) => (
            <Link
              key={agent.slug}
              href={`/agents/${agent.slug}`}
              style={{
                display: "grid",
                gridTemplateColumns: "84px minmax(140px, 1fr) minmax(0, 2fr) 60px",
                alignItems: "center",
                gap: "16px",
                padding: "14px 18px",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                background: "var(--surface, #fff)",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
                color: "inherit",
              }}
            >
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "12px", fontWeight: 600 }}>{agent.code}</span>
              <span>
                <span style={{ fontWeight: 700, fontSize: "15px" }}>{agent.name}</span>
                <span style={{ display: "block", fontSize: "12px", color: "var(--muted-foreground)" }}>{agent.role}</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", flexWrap: "wrap" }}>
                <span style={{ background: "var(--steel-tint)", padding: "4px 9px", borderRadius: "6px" }}>{agent.input_label}</span>
                <span style={{ color: "var(--muted-foreground)" }}>→</span>
                <span style={{ background: "var(--steel-tint)", padding: "4px 9px", borderRadius: "6px" }}>{agent.output_label}</span>
              </span>
              <span style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--muted-foreground)", textAlign: "right" }}>
                {agent.version}
              </span>
            </Link>
          ))}
        </div>
      )}

      {view === "liste" && (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "10px",
            background: "var(--surface, #fff)",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
          }}
        >
          {filtered.map((agent, i) => (
            <Link
              key={agent.slug}
              href={`/agents/${agent.slug}`}
              style={{
                display: "grid",
                gridTemplateColumns: "84px minmax(120px, 1fr) minmax(0, 2fr) 110px 90px",
                alignItems: "center",
                gap: "16px",
                padding: "12px 18px",
                borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                color: "inherit",
                fontSize: "13px",
              }}
            >
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "12px", fontWeight: 600 }}>{agent.code}</span>
              <span style={{ fontWeight: 700 }}>{agent.name}</span>
              <span style={{ color: "var(--muted-foreground)" }}>{agent.role}</span>
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "11px", textTransform: "uppercase" }}>
                {agent.category}
              </span>
              <span style={{ fontSize: "12px", color: "var(--muted-foreground)", textAlign: "right" }}>
                {`${agent.workflow_count} workflow${agent.workflow_count > 1 ? "s" : ""}`}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}