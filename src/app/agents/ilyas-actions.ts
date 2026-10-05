"use server";

import { resolveTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { executeIlyas } from "@/lib/ilyas-core";
import type { IlyasOutcome } from "@/lib/ilyas";

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
    revalidatePath("/agents/ilyas");
    revalidatePath("/agents");
    revalidatePath("/deliverables");
    revalidatePath("/dashboard");
  }
  return outcome;
}