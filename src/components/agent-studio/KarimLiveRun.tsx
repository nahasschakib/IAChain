"use client";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { runKarim } from "@/app/agents/karim-actions";
import type { KarimOutcome } from "@/lib/karim";

type Values = Record<string, string | boolean | string[]>;
export type KarimRunState = { pending: boolean; outcome: KarimOutcome | null };

const one = (v: Values[string] | undefined) =>
  Array.isArray(v) ? (v[0] ?? "") : typeof v === "string" ? v : "";

export default function KarimLiveRun({
  values,
  onState,
}: {
  values: Values;
  onState: (s: KarimRunState) => void;
}) {
  const [pending, startTransition] = useTransition();

  const launch = () => {
    onState({ pending: true, outcome: null });
    startTransition(async () => {
      const outcome = await runKarim({
        profil: String(values.profil_qualifie ?? ""),
        budget: one(values.budget_estime),
        registre: one(values.registre),
      });
      onState({ pending: false, outcome });
    });
  };

  return (
    <Button type="button" onClick={launch} disabled={pending} style={{ width: "100%" }}>
      {pending ? "Préparation du plan en cours…" : "Préparer le plan avec l'IA"}
    </Button>
  );
}