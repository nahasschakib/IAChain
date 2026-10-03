import { sql } from "@/lib/db";
import { executeYasmine } from "@/lib/yasmine-core";
import { executeMehdi } from "@/lib/mehdi-core";
import { executeKarim } from "@/lib/karim-core";
import { ficheToText } from "@/lib/yasmine";
import { profilFromMehdi } from "@/lib/karim";

export type ChainInput = {
  signal: string;
  canaux: string[];
  compteCrm: string;
  fit?: string;
  budget?: string;
  maturite?: string;
};

export type ChainOutcome =
  | { ok: true; executionId: number; status: "termine" | "echoue"; note: string }
  | { ok: false; error: string };

type NodeState = "pending" | "waiting" | "running" | "done" | "failed";

async function setNode(
  executionId: number,
  nodeKey: string,
  state: NodeState,
  note: string | null,
  agentRunId: number | null = null
) {
  await sql`
    UPDATE workflow_node_runs
    SET state = ${state}, note = ${note}, agent_run_id = COALESCE(${agentRunId}, agent_run_id)
    WHERE execution_id = ${executionId} AND node_key = ${nodeKey}
  `;
}

async function finish(
  executionId: number,
  status: "termine" | "echoue",
  done: number,
  step: string
) {
  await sql`
    UPDATE workflow_executions
    SET status = ${status}, progress_done = ${done}, current_step = ${step}, finished_at = now()
    WHERE id = ${executionId}
  `;
}

// Chaîne Prospect to Cash, périmètre actuel : Yasmine → Mehdi → Karim (si Mehdi qualifie).
// Le champ `mapping` des nœuds n'est pas interprété : les passages sont faits ici, en code.
// Les étapes suivantes (Salma, Anas, Nadia, approbation) ne sont pas encore branchées.
export async function runProspectToCash(
  ctx: { orgId: string; userId: string },
  input: ChainInput
): Promise<ChainOutcome> {
  const signal = String(input.signal ?? "").trim();
  if (signal.length < 20) return { ok: false, error: "Signal trop court (20 caractères minimum)." };
  if (signal.length > 8000) return { ok: false, error: "Signal trop long (8000 caractères maximum)." };

  const wf = await sql`SELECT id FROM workflows WHERE slug = 'prospect-to-cash'`;
  if (!wf[0]) return { ok: false, error: "Workflow introuvable." };

  const exec = await sql`
    INSERT INTO workflow_executions (workflow_id, status, progress_done, progress_total, current_step, client_label, run_label, org_id)
    VALUES (${wf[0].id as number}, 'en_cours', 0, 3, 'yasmine', 'Capture en cours…', 'Exécution manuelle', ${ctx.orgId})
    RETURNING id
  `;
  const executionId = exec[0].id as number;
  await sql`UPDATE workflow_executions SET run_label = ${`#${executionId}`} WHERE id = ${executionId}`;

  await sql`
    INSERT INTO workflow_node_runs (execution_id, node_key, state, org_id)
    VALUES (${executionId}, 'yasmine', 'running', ${ctx.orgId}),
           (${executionId}, 'mehdi', 'pending', ${ctx.orgId}),
           (${executionId}, 'karim', 'pending', ${ctx.orgId})
  `;

  try {
    // 1) Yasmine
    const y = await executeYasmine(ctx, { signal, canaux: input.canaux, compteCrm: input.compteCrm });
    if (!y.outcome.ok) {
      await setNode(executionId, "yasmine", "failed", y.outcome.error, y.agentRunId);
      await finish(executionId, "echoue", 0, "yasmine");
      return { ok: true, executionId, status: "echoue", note: y.outcome.error };
    }
    const fiche = y.outcome.result;
    const societe = fiche.societe || "Prospect";
    await sql`UPDATE workflow_executions SET client_label = ${societe} WHERE id = ${executionId}`;

    if (fiche.verdict === "Signal insuffisant") {
      await setNode(executionId, "yasmine", "failed", "Signal insuffisant", y.agentRunId);
      await finish(executionId, "echoue", 0, "yasmine");
      return { ok: true, executionId, status: "echoue", note: "Signal insuffisant : la chaîne s'arrête avant Mehdi." };
    }
    await setNode(executionId, "yasmine", "done", fiche.verdict, y.agentRunId);
    await sql`UPDATE workflow_executions SET progress_done = 1, current_step = 'mehdi' WHERE id = ${executionId}`;

    // 2) Mehdi, alimenté par la fiche de Yasmine
    await setNode(executionId, "mehdi", "running", null);
    const ficheTexte = ficheToText(fiche);
        const m = await executeMehdi(ctx, {
      fiche: ficheTexte,
      fit: input.fit || "Non précisé",
      budget: input.budget || "Non précisé",
      maturite: input.maturite || "Non précisé",
    });
    if (!m.outcome.ok) {
      await setNode(executionId, "mehdi", "failed", m.outcome.error, m.agentRunId);
      await finish(executionId, "echoue", 1, "mehdi");
      return { ok: true, executionId, status: "echoue", note: m.outcome.error };
    }
    const q = m.outcome.result;
    const noteMehdi = q.verdict === "À compléter" ? "Fiche à compléter" : `${q.verdict} ${q.score}/100`;
    await setNode(executionId, "mehdi", "done", noteMehdi, m.agentRunId);

    // Seul un prospect « Qualifié » est transmis à Karim.
    if (q.verdict !== "Qualifié") {
      await setNode(executionId, "karim", "pending", `Non lancé : ${q.verdict}`);
      await finish(executionId, "termine", 2, "mehdi");
      return { ok: true, executionId, status: "termine", note: `${societe} · ${noteMehdi} · Karim non lancé` };
    }
    await sql`UPDATE workflow_executions SET progress_done = 2, current_step = 'karim' WHERE id = ${executionId}`;

    // 3) Karim, alimenté par la fiche de Yasmine et l'évaluation de Mehdi
    await setNode(executionId, "karim", "running", null);
    const k = await executeKarim(ctx, {
      profil: profilFromMehdi(ficheTexte, q),
      budget: q.budget_estime,
      registre: "Direct",
    });
    if (!k.outcome.ok) {
      await setNode(executionId, "karim", "failed", k.outcome.error, k.agentRunId);
      await finish(executionId, "echoue", 2, "karim");
      return { ok: true, executionId, status: "echoue", note: k.outcome.error };
    }
    const statut = k.outcome.result.statut;
    await setNode(executionId, "karim", "done", statut, k.agentRunId);
    await finish(executionId, "termine", 3, "karim");
    return { ok: true, executionId, status: "termine", note: `${societe} · ${noteMehdi} · ${statut}` };
  } catch (e) {
    console.error("runProspectToCash", e);
    try {
      await finish(executionId, "echoue", 0, "yasmine");
    } catch {}
    return { ok: false, error: "La chaîne a échoué. Réessaie dans un instant." };
  }
}