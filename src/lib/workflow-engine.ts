import { sql } from "@/lib/db";
import { executeYasmine } from "@/lib/yasmine-core";
import { executeMehdi } from "@/lib/mehdi-core";
import { executeKarim } from "@/lib/karim-core";
import { proposerLignesSalma } from "@/lib/salma-core";
import { executeNadia } from "@/lib/nadia-core";
import { BUDGETS_SALMA } from "@/lib/salma";
import { ficheToText } from "@/lib/yasmine";
import { profilFromMehdi } from "@/lib/karim";

export type ChainInput = {
  signal: string;
  canaux: string[];
  compteCrm: string;
  fit?: string;
  budget?: string;
  maturite?: string;
  segment?: string;
  enjeux?: string[];
  offer?: string;
};

export type ChainOutcome =
  | { ok: true; executionId: number; status: "termine" | "echoue" | "attente"; note: string }
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

// Chaîne Prospect to Cash : Yasmine → Mehdi → Karim (si Mehdi qualifie) → Salma (lignes proposées, puis pause).
// Le champ `mapping` des nœuds n'est pas interprété : les passages sont faits ici, en code.
// La suite (chiffrage par un humain, Nadia, validation du devis) est reprise par continuerApresSalma.
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
        // Rattache le go/no-go créé par Mehdi à ce dossier (visible dans « À faire » et dans la vue Dossier).
    try {
      await sql`
        UPDATE approvals
        SET payload = COALESCE(payload, '{}'::jsonb) || jsonb_build_object('dossier_id', ${executionId}::int)
        WHERE id = (
          SELECT a.id FROM approvals a
          WHERE a.org_id = ${ctx.orgId} AND a.tag = 'Go/no-go' AND a.status = 'en_attente'
            AND a.created_at >= (SELECT started_at FROM workflow_executions WHERE id = ${executionId})
          ORDER BY a.id DESC LIMIT 1
        )
      `;
    } catch (e) {
      console.error("runProspectToCash go/no-go", e);
    }

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
      segment: input.segment,
      enjeux: input.enjeux,
      offer: input.offer,
    });
    if (!k.outcome.ok) {
      await setNode(executionId, "karim", "failed", k.outcome.error, k.agentRunId);
      await finish(executionId, "echoue", 2, "karim");
      return { ok: true, executionId, status: "echoue", note: k.outcome.error };
    }
    const plan = k.outcome.result;
    const statut = plan.statut;
    await setNode(executionId, "karim", "done", statut, k.agentRunId);

    // Sans plan d'approche exploitable, la chaîne s'arrête ici comme avant.
    if (statut !== "Plan prêt") {
      await finish(executionId, "termine", 3, "karim");
      return { ok: true, executionId, status: "termine", note: `${societe} · ${noteMehdi} · ${statut}` };
    }

    // 4) Salma : lignes du catalogue proposées à partir du client (Yasmine), de l'angle d'approche et du cadre
    // budgétaire (Karim). Un humain valide ensuite les lignes dans le Studio de Salma : la chaîne attend.
    await sql`
      INSERT INTO workflow_node_runs (execution_id, node_key, state, org_id)
      VALUES (${executionId}, 'salma', 'running', ${ctx.orgId}),
             (${executionId}, 'nadia', 'pending', ${ctx.orgId}),
             (${executionId}, 'approval', 'pending', ${ctx.orgId})
    `;
    const cadre = (BUDGETS_SALMA as readonly string[]).find((b) => String(plan.budget_cadre ?? "").includes(b)) ?? "";
    const s = await proposerLignesSalma(ctx, { client: societe, objectif: plan.approach_angle, budget: cadre });
    if (!s.outcome.ok) {
      await setNode(executionId, "salma", "pending", `Lignes non proposées : ${s.outcome.error}`);
      await finish(executionId, "termine", 3, "karim");
      return { ok: true, executionId, status: "termine", note: `${societe} · ${noteMehdi} · ${statut} · Salma non lancée : ${s.outcome.error}` };
    }
    const n = s.outcome.proposition.lignes.length;
    await setNode(
      executionId,
      "salma",
      "waiting",
      n > 0 ? `Lignes à valider (${n})` : "Aucune ligne retenue : à compléter",
      s.agentRunId
    );
    await sql`
      UPDATE workflow_executions SET progress_done = 3, progress_total = 6, current_step = 'salma'
      WHERE id = ${executionId}
    `;
    return {
      ok: true,
      executionId,
      status: "attente",
      note: `${societe} · ${noteMehdi} · ${statut} · Salma a proposé ${n} ligne${n > 1 ? "s" : ""} : à valider dans le Studio de Salma`,
    };
  } catch (e) {
    console.error("runProspectToCash", e);
    try {
      await finish(executionId, "echoue", 0, "yasmine");
    } catch {}
    return { ok: false, error: "La chaîne a échoué. Réessaie dans un instant." };
  }
}

// Reprise de la chaîne après le chiffrage de Salma (humain) : Nadia contrôle la remise, puis la validation du
// devis est soumise, rattachée à la même exécution. Sans effet si l'exécution de Salma n'appartient pas à une chaîne
// en attente. N'échoue jamais bruyamment : le chiffrage est déjà enregistré.
export async function continuerApresSalma(
  ctx: { orgId: string; userId: string },
  salmaRunId: number
): Promise<void> {
  if (!Number.isInteger(salmaRunId)) return;
  const rows = await sql`
    SELECT execution_id FROM workflow_node_runs
    WHERE node_key = 'salma' AND state = 'waiting' AND agent_run_id = ${salmaRunId} AND org_id = ${ctx.orgId}
    LIMIT 1
  `;
  if (!rows[0]) return;
  const executionId = Number(rows[0].execution_id);

  // Prise du nœud en une instruction : un second chiffrage ne relance pas la chaîne.
  const pris = await sql`
    UPDATE workflow_node_runs SET state = 'done', note = 'Devis chiffré'
    WHERE execution_id = ${executionId} AND node_key = 'salma' AND state = 'waiting' AND org_id = ${ctx.orgId}
    RETURNING execution_id
  `;
  if (!pris[0]) return;
  await sql`
    UPDATE workflow_executions SET progress_done = 4, current_step = 'nadia'
    WHERE id = ${executionId} AND org_id = ${ctx.orgId}
  `;

  await setNode(executionId, "nadia", "running", null);
  const n = await executeNadia(ctx, { salmaRunId, executionId });
  if (!n.outcome.ok) {
    await setNode(executionId, "nadia", "failed", n.outcome.error);
    await finish(executionId, "echoue", 4, "nadia");
    return;
  }
  const r = n.outcome.result;
  await setNode(executionId, "nadia", "done", r.verdict, n.agentRunId);

  if (r.validation_devis === "soumise" || r.validation_devis === "deja_soumise") {
    // Une validation déjà en attente (contrôle fait à la main avant la reprise) est rattachée à cette exécution.
    await sql`
      UPDATE devis_validations SET execution_id = ${executionId}
      WHERE org_id = ${ctx.orgId} AND salma_run_id = ${salmaRunId} AND statut = 'a_valider' AND execution_id IS NULL
    `;
    await setNode(executionId, "approval", "waiting", "Validation du devis à décider");
    await sql`
      UPDATE workflow_executions SET progress_done = 5, current_step = 'approval'
      WHERE id = ${executionId} AND org_id = ${ctx.orgId}
    `;
  } else {
    await setNode(executionId, "approval", "pending", `Non lancé : ${r.verdict}`);
    await finish(executionId, "termine", 5, "nadia");
  }
}