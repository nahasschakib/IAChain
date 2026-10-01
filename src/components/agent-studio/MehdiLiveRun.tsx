"use client";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { runMehdi } from "@/app/agents/mehdi-actions";
import type { MehdiOutcome } from "@/lib/mehdi";

type Values = Record<string, string | boolean | string[]>;
export type MehdiRunState = { pending: boolean; outcome: MehdiOutcome | null };

const first = (v: Values[string] | undefined) => (Array.isArray(v) && v[0] ? v[0] : "non précisé");

export default function MehdiLiveRun({
  values,
  onState,
}: {
  values: Values;
  onState: (s: MehdiRunState) => void;
}) {
  const [pending, startTransition] = useTransition();

  const launch = () => {
    onState({ pending: true, outcome: null });
    startTransition(async () => {
      const outcome = await runMehdi({
        fiche: String(values.fiche_prospect ?? ""),
        fit: first(values.fit_icp),
        budget: first(values.budget_estime),
        maturite: first(values.maturite_besoin),
      });
      onState({ pending: false, outcome });
    });
  };

  return (
    <Button type="button" onClick={launch} disabled={pending} style={{ width: "100%" }}>
      {pending ? "Analyse en cours…" : "Qualifier avec l'IA"}
    </Button>
  );
}