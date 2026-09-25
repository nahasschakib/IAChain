"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import IlyasPreview from "./previews/IlyasPreview";
import AminePreview from "./previews/AminePreview";
import type { Agent, TaskField, CheckboxGroupOption, SourceListOption } from "./types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import YasminePreview from "./previews/YasminePreview";
import OthmanePreview from "./previews/OthmanePreview";
import LinaPreview from "./previews/LinaPreview";
import KarimaPreview from "./previews/KarimaPreview";
import AnasPreview from "./previews/AnasPreview";
import NadiaPreview from "./previews/NadiaPreview";
import SalmaPreview from "./previews/SalmaPreview";
import YoussefPreview from "./previews/YoussefPreview";
import HamzaPreview from "./previews/HamzaPreview";
import HindPreview from "./previews/HindPreview";
import RachidPreview from "./previews/RachidPreview";
import KarimPreview from "./previews/KarimPreview";
import ImanePreview from "./previews/ImanePreview";
import SofiaPreview from "./previews/SofiaPreview";
import MehdiPreview from "./previews/MehdiPreview";
import ZinebPreview from "./previews/ZinebPreview";
import { useAgentRun } from "./useAgentRun";
import { getRunConfig, APPROVAL_ACTION } from "./runConfig";

type FieldValue = string | boolean | string[];
type Values = Record<string, FieldValue>;

const PREVIEWS: Record<string, React.ComponentType<{ values: Values }>> = {
  ilyas: IlyasPreview,
  amine: AminePreview,
  yasmine: YasminePreview,
  othmane: OthmanePreview,
  lina: LinaPreview,
  karima: KarimaPreview,
  anas: AnasPreview,
  nadia: NadiaPreview,
  salma: SalmaPreview,
  youssef: YoussefPreview,
  hamza: HamzaPreview,
  hind: HindPreview,
  rachid: RachidPreview,
  karim: KarimPreview,
  imane: ImanePreview,
  sofia: SofiaPreview,
  mehdi: MehdiPreview,
  zineb: ZinebPreview,
};

const monoLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono, monospace)",
  fontSize: "10px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--muted-foreground)",
};

function formatCost(value: Agent["cost_estimate"]) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return `≈ ${n.toFixed(2).replace(".", ",")} MAD`;
}

export default function NouvelleTacheTab({ agent, taskFields }: { agent: Agent; taskFields: TaskField[] }) {
  const router = useRouter();
  const config = getRunConfig(agent.slug);
  const { status, step, run } = useAgentRun(config.steps.length);
  const cost = formatCost(agent.cost_estimate);

  const [values, setValues] = useState<Values>(() => {
    const initial: Values = {};
    for (const f of taskFields) {
      if (f.field_type === "checkbox") {
        initial[f.field_key] = f.default_value === "true";
      } else if (f.field_type === "checkbox-group") {
        const opts = (f.options as CheckboxGroupOption[]) || [];
        initial[f.field_key] = opts.filter((o) => o.checked).map((o) => o.label);
      } else {
        initial[f.field_key] = f.default_value || "";
      }
    }
    return initial;
  });

  const Preview = PREVIEWS[agent.slug];

  const buttonLabel =
    status === "running" ? "Exécution en cours…" : status === "done" ? "Relancer l'agent" : config.buttonLabel;
  const previewState =
    status === "done" ? config.doneLabel : status === "running" ? "génération…" : "aperçu live des entrées";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "32px" }}>
      <div>
        <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", color: "var(--muted-foreground)", marginBottom: "8px" }}>
          ENTRÉES DE LA TÂCHE
        </div>
        <p style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--muted-foreground)", margin: "0 0 16px" }}>
          {config.inputsNote}
        </p>
        {taskFields.map((field) => (
          <FieldRenderer
            key={field.field_key}
            field={field}
            value={values[field.field_key]}
            onChange={(v) => setValues((prev) => ({ ...prev, [field.field_key]: v }))}
          />
        ))}

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "8px" }}>
          {cost && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>Coût estimé de l&apos;exécution</span>
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "12px" }}>{cost}</span>
            </div>
          )}
          <Button type="button" onClick={run} disabled={status === "running"} style={{ width: "100%" }}>
            {buttonLabel}
          </Button>
          <div style={{ fontSize: "11.5px", lineHeight: 1.5, color: "var(--muted-foreground)", marginTop: "10px" }}>
            L&apos;agent ne répond pas : il produit un livrable puis déclenche une action métier.
          </div>
          {status !== "idle" && (
            <div style={{ fontSize: "11.5px", lineHeight: 1.5, color: "var(--muted-foreground)", marginTop: "8px" }}>
              Simulation : le moteur IA n&apos;est pas encore branché, aucun agent n&apos;a réellement travaillé.
            </div>
          )}
        </div>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", color: "var(--muted-foreground)" }}>
            APERÇU DU LIVRABLE
          </span>
          <span
            style={{
              ...monoLabel,
              textTransform: "none",
              border: "1px solid var(--border)",
              borderRadius: "3px",
              padding: "2px 6px",
              background: "var(--surface, #fff)",
            }}
          >
            {previewState}
          </span>
        </div>

        {Preview ? (
          <Preview values={values} />
        ) : (
          <div style={{ padding: "40px", border: "1px dashed var(--border)", borderRadius: "12px", textAlign: "center", color: "var(--muted-foreground)" }}>
            Aperçu à venir pour cet agent.
          </div>
        )}

        {status === "done" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px" }}>
            {config.actions.map((label) =>
              label === APPROVAL_ACTION ? (
                <Button key={label} type="button" variant="outline" size="sm" onClick={() => router.push("/approvals")}>
                  {label}
                </Button>
              ) : (
                <Button key={label} type="button" variant="outline" size="sm" disabled title="Bientôt disponible">
                  {label}
                </Button>
              )
            )}
          </div>
        )}

        {status !== "idle" && (
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "4px",
              background: "var(--surface, #fff)",
              padding: "14px 18px",
              marginTop: "16px",
            }}
          >
            <div style={{ ...monoLabel, marginBottom: "10px" }}>Exécution — statut opérationnel · simulation</div>
            {config.steps.slice(0, step).map((label, i) => (
              <div
                key={label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "20px minmax(0, 1fr) auto",
                  gap: "8px",
                  alignItems: "center",
                  padding: "6px 0",
                  fontSize: "13px",
                  borderTop: i === 0 ? "none" : "1px solid var(--border)",
                }}
              >
                <span style={{ color: "#166534", fontWeight: 700 }}>✓</span>
                <span>{label}</span>
                <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "11px", color: "var(--muted-foreground)" }}>
                  {((i + 1) * 0.62).toFixed(1).replace(".", ",")} s
                </span>
              </div>
            ))}
            {status === "running" && (
              <div style={{ fontSize: "13px", color: "var(--muted-foreground)", padding: "6px 0 0" }}>…</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: TaskField;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      {field.field_type !== "checkbox" && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600 }}>{field.label}</label>
          {field.provenance && (
            <Badge variant="outline" style={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}>
              {field.provenance}
            </Badge>
          )}
        </div>
      )}

      {field.field_type === "textarea" && (
        <Textarea
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      )}

      {field.field_type === "checkbox-group" && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {(field.options as CheckboxGroupOption[]).map((opt) => {
            const selected = (value as string[]) || [];
            const checked = selected.includes(opt.label);
            return (
              <Button
                key={opt.label}
                type="button"
                size="sm"
                variant={checked ? "default" : "outline"}
                onClick={() => onChange(checked ? selected.filter((v) => v !== opt.label) : [...selected, opt.label])}
                style={{ borderRadius: "999px" }}
              >
                {opt.label}
              </Button>
            );
          })}
        </div>
      )}

      {field.field_type === "source-list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {(field.options as SourceListOption[]).map((src) => (
            <Card key={src.label}>
              <CardContent style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600 }}>
                    <span style={{ width: "8px", height: "8px", background: "var(--primary)", display: "inline-block", flexShrink: 0 }} />
                    {src.label}
                  </span>
                  <Badge
                    variant={src.status === "ACTIVE" ? "default" : src.status === "INDISPONIBLE" ? "destructive" : "secondary"}
                    style={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}
                  >
                    {src.status}
                  </Badge>
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "4px", marginLeft: "16px", lineHeight: 1.4 }}>
                  {src.desc}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {field.field_type === "volume-select" && (
        <div style={{ display: "flex", gap: "8px" }}>
          {(field.options as number[]).map((n) => (
            <Button
              key={n}
              type="button"
              variant={value === String(n) ? "default" : "outline"}
              onClick={() => onChange(String(n))}
              style={{ flex: 1 }}
            >
              {n}
            </Button>
          ))}
        </div>
      )}

      {field.field_type === "checkbox" && (
        <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px" }}>
          <Checkbox checked={!!value} onCheckedChange={(c) => onChange(c === true)} />
          {field.label}
        </label>
      )}
    </div>
  );
}