"use client";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { runSofia } from "@/app/agents/sofia-actions";
import type { SofiaOutcome } from "@/lib/sofia";

type Values = Record<string, string | boolean | string[]>;
export type SofiaRunState = { pending: boolean; outcome: SofiaOutcome | null };

const list = (v: Values[string] | undefined) => (Array.isArray(v) ? v : []);

export default function SofiaLiveRun({
  values,
  onState,
}: {
  values: Values;
  onState: (s: SofiaRunState) => void;
}) {
  const [pending, startTransition] = useTransition();

  const launch = () => {
    onState({ pending: true, outcome: null });
    startTransition(async () => {
      const outcome = await runSofia({
        thematique: String(values.thematique_veille ?? ""),
        sources: list(values.sources),
        zones: list(values.zone_geo),
        frequences: list(values.frequence),
        registre: String(values.registre ?? "Direct"),
      });
      onState({ pending: false, outcome });
    });
  };

  return (
    <Button type="button" onClick={launch} disabled={pending} style={{ width: "100%" }}>
      {pending ? "Veille en cours…" : "Lancer la veille avec l'IA"}
    </Button>
  );
}