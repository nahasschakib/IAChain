"use server";

import { resolveTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { executeIlyas } from "@/lib/ilyas-core";
import type { IlyasOutcome } from "@/lib/ilyas";
import { transmettreListeAYasmine } from "@/lib/ilyas-vers-yasmine";

export async function runIlyas(input: {
  requete: string;
  signaux: string[];
  volumeCible: number;
  dedoublonner: boolean;
}): Promise<IlyasOutcome> {
  const t = await resolveTenant();
  if (!t.ok) return { ok: false, error: "Accès refusé." };
   const { outcome } = await executeIlyas(t.ctx, input);
  if (outcome.ok) {
    // Permission « Transmettre la liste à Yasmine » (AUTO) : ne doit jamais faire perdre la liste d'Ilyas.
    try {
      await transmettreListeAYasmine(t.ctx, outcome.result);
    } catch (e) {
      console.error("runIlyas transmission Yasmine", e);
    }
    revalidatePath("/agents/ilyas");
    revalidatePath("/agents/yasmine");
    revalidatePath("/agents");
    revalidatePath("/deliverables");
    revalidatePath("/dashboard");
  }
  return outcome;
}