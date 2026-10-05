"use client";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { runOthmane } from "@/app/agents/othmane-actions";
import type { OthmaneOutcome } from "@/lib/othmane";

type Values = Record<string, string | boolean | string[]>;
export type OthmaneRunState = { pending: boolean; outcome: OthmaneOutcome | null };

export default function OthmaneLiveRun({
  values,
  onState,
}: {
  values: Values;
  onState: (s: OthmaneRunState) => void;
}) {
  const [pending, startTransition] = useTransition();

  const launch = () => {
    onState({ pending: true, outcome: null });
    startTransition(async () => {
      const outcome = await runOthmane({
        objectif: String(values.objectif ?? ""),
        canaux: Array.isArray(values.canaux) ? values.canaux : [],
        budgetK: Number(values.budget) || 38,
      });
      onState({ pending: false, outcome });
    });
  };

  return (
    <Button type="button" onClick={launch} disabled={pending} style={{ width: "100%" }}>
      {pending ? "Construction du plan…" : "Construire le plan avec l'IA"}
    </Button>
  );
}