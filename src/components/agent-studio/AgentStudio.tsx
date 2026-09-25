"use client";
import { useState } from "react";
import Link from "next/link";
import NouvelleTacheTab from "./NouvelleTacheTab";
import ContratTab from "./ContratTab";
import ConfiancePermissionsTab from "./ConfiancePermissionsTab";
import LivrablesTab from "./LivrablesTab";
import type {
  Agent,
  TaskField,
  Contract,
  Permission,
  ExecutionHistoryEntry,
  Deliverable,
} from "./types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const TABS = [
  "Nouvelle tâche",
  "Contrat",
  "Confiance & permissions",
  "Livrables",
] as const;
type Tab = (typeof TABS)[number];

interface AgentStudioProps {
  agent: Agent;
  taskFields: TaskField[];
  contract: Contract;
  permissions: Permission[];
  executionHistory: ExecutionHistoryEntry[];
  deliverables: Deliverable[];
}

export default function AgentStudio({
  agent,
  taskFields,
  contract,
  permissions,
  executionHistory,
  deliverables,
}: AgentStudioProps) {
  const [tab, setTab] = useState<Tab>(TABS[0]);

  return (
    <div>
      <Link
        href="/agents"
        style={{ fontSize: "13px", color: "var(--muted-foreground)" }}
      >
        ← Agents
      </Link>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          marginTop: "16px",
          marginBottom: "12px",
          padding: "24px",
          background: "var(--surface, #fff)",
          border: "1px solid var(--border)",
          borderRadius: "4px",
          boxShadow:
            "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            background:
              "linear-gradient(135deg, var(--steel-tint), var(--steel-deep, #3d5f80))",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--steel-strong, #2f4a63)",
            flexShrink: 0,
          }}
        >
          {agent.name.charAt(0).toUpperCase()}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            flex: 1,
            minWidth: "240px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <h1
              style={{
                fontSize: "26px",
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              {agent.name}
            </h1>
            <Badge
              variant="secondary"
              style={{
                fontFamily: "monospace",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {agent.code}
            </Badge>
            <Badge
              style={{
                border: "1px solid #16653440",
                background: "#16653408",
                color: "#166534",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                fontFamily: "monospace",
              }}
            >
              {(agent.status || "actif").toUpperCase()}
            </Badge>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                color: "var(--muted-foreground)",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              {agent.role}
            </span>
            <span style={{ color: "var(--border)" }}>·</span>
            <Badge
              variant="outline"
              style={{
                fontFamily: "monospace",
                fontSize: "11px",
                color: "var(--muted-foreground)",
              }}
            >
              contrat {contract.meta?.version ?? "v1.0"}
            </Badge>
          </div>
        </div>
        <Button variant="outline" size="sm">
          Voir l&apos;usage en workflow
        </Button>
      </div>

      <p
        style={{
          color: "var(--muted-foreground)",
          fontSize: "14px",
          lineHeight: 1.6,
          margin: "16px 0 24px",
          maxWidth: "800px",
        }}
      >
        {agent.description}
      </p>
     

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList
          className="h-auto gap-6"
          style={{
            background: "var(--steel-tint)",
            borderRadius: "10px",
            padding: "6px 10px",
            marginBottom: "24px",
          }}
        >
          {TABS.map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="px-1 pb-2.5 pt-0 text-sm font-normal data-[state=active]:font-bold"
              style={{
                border: "none",
                borderBottom:
                  tab === t
                    ? "2px solid var(--steel-deep)"
                    : "2px solid transparent",
                borderRadius: 0,
                background: "transparent",
                boxShadow: "none",
                color: tab === t ? "var(--ink)" : "var(--muted-foreground)",
              }}
            >
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="Nouvelle tâche">
          <NouvelleTacheTab agent={agent} taskFields={taskFields} />
        </TabsContent>
        <TabsContent value="Contrat">
          <ContratTab contract={contract} />
        </TabsContent>
        <TabsContent value="Confiance & permissions">
          <ConfiancePermissionsTab
            permissions={permissions}
            executionHistory={executionHistory}
          />
        </TabsContent>
        <TabsContent value="Livrables">
          <LivrablesTab deliverables={deliverables} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
