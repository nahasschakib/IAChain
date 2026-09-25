"use client";
import { useState } from "react";
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

export default function NouvelleTacheTab({ agent, taskFields }: { agent: Agent; taskFields: TaskField[] }) {
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

  return (
    <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "32px" }}>
      <div>
        <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", color: "var(--muted-foreground)", marginBottom: "16px" }}>
          ENTRÉES DE LA TÂCHE
        </div>
        {taskFields.map((field) => (
          <FieldRenderer
            key={field.field_key}
            field={field}
            value={values[field.field_key]}
            onChange={(v) => setValues((prev) => ({ ...prev, [field.field_key]: v }))}
          />
        ))}
      </div>

      <div>
        <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", color: "var(--muted-foreground)", marginBottom: "16px" }}>
          APERÇU DU LIVRABLE
        </div>
        {Preview ? (
          <Preview values={values} />
        ) : (
          <div style={{ padding: "40px", border: "1px dashed var(--border)", borderRadius: "12px", textAlign: "center", color: "var(--muted-foreground)" }}>
            Aperçu à venir pour cet agent.
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