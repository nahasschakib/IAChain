"use client";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { runLina } from "@/app/agents/lina-actions";
import type { LinaOutcome } from "@/lib/lina";

type Values = Record<string, string | boolean | string[]>;
export type LinaRunState = { pending: boolean; outcome: LinaOutcome | null };

export default function LinaLiveRun({
  values,
  onState,
}: {
  values: Values;
  onState: (s: LinaRunState) => void;
}) {
  const [pending, startTransition] = useTransition();

  const launch = () => {
    onState({ pending: true, outcome: null });
    startTransition(async () => {
      const outcome = await runLina({
        brief: String(values.brief ?? ""),
        formats: Array.isArray(values.formats) ? values.formats : [],
        ton: String(values.ton_editorial ?? "Expert"),
        registre: String(values.registre ?? "Direct"),
      });
      onState({ pending: false, outcome });
    });
  };

  return (
    <Button type="button" onClick={launch} disabled={pending} style={{ width: "100%" }}>
      {pending ? "Rédaction en cours…" : "Rédiger les contenus avec l'IA"}
    </Button>
  );
}