"use client";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { runIlyas } from "@/app/agents/ilyas-actions";
import type { IlyasOutcome } from "@/lib/ilyas";

type Values = Record<string, string | boolean | string[]>;
export type IlyasRunState = { pending: boolean; outcome: IlyasOutcome | null };

export default function IlyasLiveRun({
  values,
  onState,
}: {
  values: Values;
  onState: (s: IlyasRunState) => void;
}) {
  const [pending, startTransition] = useTransition();

  const launch = () => {
    onState({ pending: true, outcome: null });
    startTransition(async () => {
      const outcome = await runIlyas({
        requete: String(values.requete_ciblage ?? ""),
        signaux: Array.isArray(values.signaux_achat) ? values.signaux_achat : [],
        volumeCible: Number(values.volume_cible) || 30,
        dedoublonner: values.dedoublonner !== false,
      });
      onState({ pending: false, outcome });
    });
  };

  return (
    <Button type="button" onClick={launch} disabled={pending} style={{ width: "100%" }}>
      {pending ? "Recherche en cours…" : "Lancer le sourcing avec l'IA"}
    </Button>
  );
}