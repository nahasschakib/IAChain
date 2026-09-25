"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type RunStatus = "idle" | "running" | "done";

/**
 * SIMULATION : aucun moteur IA n'est branché pour l'instant.
 * Quand il sera opérationnel, remplacer le contenu de run() par l'appel réel
 * (server action ou API) et alimenter status / step avec sa progression.
 * Le reste de l'interface n'a pas à changer.
 */
export function useAgentRun(stepCount: number, stepDelayMs = 620) {
  const [status, setStatus] = useState<RunStatus>("idle");
  const [step, setStep] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const run = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setStatus("running");
    setStep(0);

    const tick = (current: number) => {
      timer.current = setTimeout(() => {
        const next = current + 1;
        setStep(next);
        if (next >= stepCount) {
          setStatus("done");
        } else {
          tick(next);
        }
      }, stepDelayMs);
    };
    tick(0);
  }, [stepCount, stepDelayMs]);

  return { status, step, run };
}