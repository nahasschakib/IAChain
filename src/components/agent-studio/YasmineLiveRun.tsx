"use client";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { runYasmine } from "@/app/agents/yasmine-actions";
import type { YasmineOutcome } from "@/lib/yasmine";

type Values = Record<string, string | boolean | string[]>;
export type YasmineRunState = { pending: boolean; outcome: YasmineOutcome | null };

export default function YasmineLiveRun({
  values,
  onState,
}: {
  values: Values;
  onState: (s: YasmineRunState) => void;
}) {
  const [pending, startTransition] = useTransition();

  const launch = () => {
    onState({ pending: true, outcome: null });
    startTransition(async () => {
      const outcome = await runYasmine({
        signal: String(values.signal_brut ?? ""),
        canaux: Array.isArray(values.canal_source) ? values.canal_source : [],
        compteCrm: String(values.compte_crm ?? ""),
      });
      onState({ pending: false, outcome });
    });
  };

  return (
    <Button type="button" onClick={launch} disabled={pending} style={{ width: "100%" }}>
      {pending ? "Capture en cours…" : "Capturer avec l'IA"}
    </Button>
  );
}