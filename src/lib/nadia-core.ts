import { sql } from "@/lib/db";
import { getPolitiqueActive } from "@/lib/politique-tarifaire";
import { formatMAD } from "@/lib/catalogue-regle";
import {
  MAX_COMMENTAIRE,
  MAX_MOTIF,
  construireVerdict,
  lireProposition,
  type ListePourNadia,
  type NadiaOutcome,
  type NadiaResult,
  type PropositionResume,
} from "@/lib/nadia";

type Ctx = { orgId: string; userId: string };

export type NadiaCoreInput = {
  salmaRunId: number; // exécution de Salma dont la proposition est contrôlée
  motifException?: string; // motif invoqué, à choisir dans la politique tarifaire
  commentaire?: string;
  segment?: string; // utilisé seulement si la proposition n'a pas de segment
  executionId?: number; // exécution de la chaîne Prospect to Cash dont ce contrôle fait partie (P4-09j)
};

// Propositions récentes de Salma (les plus récentes d'abord) et motifs de la politique active.
export async function listerPourNadia(orgId: string): Promise<ListePourNadia> {
  const rows = await sql`
    SELECT r.id, r.result, r.created_at
    FROM agent_runs r
    WHERE r.org_id = ${orgId}
      AND r.agent_id = (SELECT id FROM agents WHERE slug = 'salma')
      AND r.status = 'ok'
      AND r.result->>'statut' = 'Proposition prête'
    ORDER BY r.id DESC
    LIMIT 20
  `;
  const propositions: PropositionResume[] = [];
  for (const row of rows) {
    const p = lireProposition(row.result);
    if (p) propositions.push({ ...p, runId: row.id as number, created_at: new Date(row.created_at as string).toISOString() });
  }
  let politique: ListePourNadia["politique"] = null;
  try {
    const p = await getPolitiqueActive(orgId);
    if (p) politique = { version: p.version, motifs: p.motifs, segments: Object.keys(p.segments) };
  } catch (e) {
    console.error("listerPourNadia politique", e);
  }
  return { propositions, politique };
}

// Cœur de l'agent Nadia : appelé par l'écran Studio ET, plus tard, par le moteur de workflow.
export async function executeNadia(
  ctx: Ctx,
  input: NadiaCoreInput
): Promise<{ outcome: NadiaOutcome; agentRunId: number | null }> {
  const { orgId, userId } = ctx;
  const echec = (error: string) => ({ outcome: { ok: false as const, error }, agentRunId: null });

  const salmaRunId = Number(input.salmaRunId);
  if (!Number.isInteger(salmaRunId)) return echec("Choisis d'abord une proposition de Salma.");
  const executionId = Number.isInteger(Number(input.executionId)) && Number(input.executionId) > 0 ? Number(input.executionId) : null;
  const motifException = String(input.motifException ?? "").replace(/\s+/g, " ").trim();
  const commentaire = String(input.commentaire ?? "").trim();
  if (motifException.length > MAX_MOTIF) return echec(`Motif trop long (${MAX_MOTIF} caractères maximum).`);
  if (commentaire.length > MAX_COMMENTAIRE) return echec(`Commentaire trop long (${MAX_COMMENTAIRE} caractères maximum).`);

  const agents = await sql`SELECT id, name, output_label FROM agents WHERE slug = 'nadia'`;
  const agent = agents[0];
  const agentId = agent?.id as number | undefined;
  if (!agent || !agentId) return echec("Agent introuvable.");

  const src = await sql`
    SELECT result FROM agent_runs
    WHERE id = ${salmaRunId} AND org_id = ${orgId}
      AND agent_id = (SELECT id FROM agents WHERE slug = 'salma') AND status = 'ok'
  `;
  const prop = src[0] ? lireProposition(src[0].result) : null;
  if (!prop) return echec("Cette proposition de Salma est introuvable ou n'est pas chiffrée.");

  let politique;
  try {
    politique = await getPolitiqueActive(orgId);
  } catch (e) {
    console.error("executeNadia politique", e);
    return echec("Politique tarifaire illisible (erreur technique). Réessaie dans un instant.");
  }

  // Segment : celui de la proposition prime ; un segment choisi n'est accepté que s'il existe dans la politique.
  let propFinale = prop;
  let segmentSaisi = false;
  const segmentChoisi = String(input.segment ?? "").trim();
  if (!prop.segment && segmentChoisi) {
    if (!politique || !(segmentChoisi in politique.segments)) return echec("Segment inconnu dans la politique tarifaire.");
    propFinale = { ...prop, segment: segmentChoisi };
    segmentSaisi = true;
  }

  const traceInput = JSON.stringify({ salma_run_id: salmaRunId, motif_exception: motifException, commentaire, segment: segmentChoisi });
  try {
    const base = construireVerdict(politique, propFinale, motifException, commentaire, salmaRunId, segmentSaisi);

    // Numéro de version : même règle que les autres agents (livrables non simulés).
    let version: string | null = null;
    try {
      const n = await sql`
        SELECT COUNT(*) AS n FROM deliverables
        WHERE agent_id = ${agentId} AND org_id = ${orgId} AND COALESCE(origin, '') NOT LIKE 'Simulation%'
      `;
      version = `v${Number(n[0].n) + 1}`;
    } catch (e) {
      console.error("executeNadia version", e);
    }
    const result = { ...base, version };

    // Aucun appel IA : coût nul, aucun jeton.
    const run = await sql`
      INSERT INTO agent_runs (org_id, agent_id, user_id, input, result, input_tokens, output_tokens, cost_mad, cost_usd, status)
      VALUES (${orgId}, ${agentId}, ${userId}, ${traceInput}::jsonb, ${JSON.stringify({ ...result, cost_mad: 0 })}::jsonb,
              0, 0, 0, 0, 'ok')
      RETURNING id
    `;
    const agentRunId = run[0].id as number;

    // Trace métier : historique et livrable.
    try {
      const fini = result.verdict === "Conforme";
      await sql`
        INSERT INTO agent_execution_history (agent_id, exec_date, description, status, org_id)
        VALUES (${agentId}, CURRENT_DATE, ${`Contrôle de remise · ${prop.client} — ${result.verdict}`}, ${fini ? "Terminé" : "En attente"}, ${orgId})
      `;
      const label = (agent.output_label as string) ?? "Verdict de remise";
      await sql`
        INSERT INTO deliverables (title, agent_id, kind, version, agent_label, origin, currency, cost, org_id)
        VALUES (${`${label} — ${prop.client}`}, ${agentId}, 'doc', ${version ?? "v1"},
                ${agent.name as string}, 'Agent Studio', 'MAD', '0.0000', ${orgId})
      `;
    } catch (e) {
      console.error("executeNadia trace", e);
    }

    // Validation du devis (P4-10d) : un devis conforme, ou en dérogation, est soumis à une approbation humaine.
    // Un échec ici ne remet jamais en cause le verdict.
    let validation: NonNullable<NadiaResult["validation_devis"]> = "non_requise";
    if (result.verdict === "Conforme" || result.verdict === "Dérogation requise") {
      validation = "erreur";
      let validationId: number | null = null;
      try {
        const ins = await sql`
          INSERT INTO devis_validations (org_id, salma_run_id, nadia_run_id, client, verdict, created_by, execution_id)
          VALUES (${orgId}, ${salmaRunId}, ${agentRunId}, ${prop.client}, ${result.verdict}, ${userId}, ${executionId})
          ON CONFLICT DO NOTHING
          RETURNING id
        `;
        if (!ins[0]) {
          const ex = await sql`
            SELECT statut FROM devis_validations
            WHERE org_id = ${orgId} AND salma_run_id = ${salmaRunId} AND statut IN ('a_valider', 'valide')
            ORDER BY id DESC LIMIT 1
          `;
          validation = ex[0]?.statut === "valide" ? "deja_validee" : "deja_soumise";
        } else {
          validationId = ins[0].id as number;
          const ttc = Number((src[0].result as Record<string, unknown>)?.total_ttc);
          const payload = {
            source: "Proposé par Agent Nadia · Contrôle de remise",
            aiReco:
              result.verdict === "Conforme"
                ? "Valider le devis : remise conforme à la politique tarifaire"
                : "Valider le devis : dérogation de remise, accord de la direction requis",
            chips: ["Prospect to Cash", result.verdict],
            extractTitle: "Devis à valider",
            extract:
              `${prop.client} — ${Number.isFinite(ttc) ? `${formatMAD(ttc)} MAD TTC, ` : ""}remise ${String(prop.remise_pct).replace(".", ",")} %.\n` +
              `${result.motif}.`,
            props: [
              { k: "Client", v: prop.client },
              { k: "Proposition", v: prop.version ?? `n° ${salmaRunId}` },
              { k: "Remise", v: `${String(prop.remise_pct).replace(".", ",")} %` },
              { k: "Contrôle de remise", v: result.verdict },
            ],
            lineage: ["Proposition de Salma", "Contrôle de Nadia", "Validation humaine"],
            devis_validation_id: validationId,
          };
          await sql`
            INSERT INTO approvals (title, tag, agent_id, agent_label, payload, org_id)
            VALUES (${`Validation du devis · ${prop.client}`}, 'Validation du devis', ${agentId}, ${agent.name as string},
                    ${JSON.stringify(payload)}::jsonb, ${orgId})
          `;
          validation = "soumise";
        }
      } catch (e) {
        console.error("executeNadia validation devis", e);
        // Libère la place pour une nouvelle tentative si l'approbation n'a pas pu être créée.
        if (validationId !== null) {
          try {
            await sql`DELETE FROM devis_validations WHERE id = ${validationId} AND org_id = ${orgId} AND statut = 'a_valider'`;
          } catch {}
        }
      }
    }

    return { outcome: { ok: true, result: { ...result, validation_devis: validation } }, agentRunId };
  } catch (e) {
    console.error("executeNadia", e);
    try {
      await sql`
        INSERT INTO agent_runs (org_id, agent_id, user_id, input, status, error)
        VALUES (${orgId}, ${agentId}, ${userId}, ${traceInput}::jsonb,
                'erreur', ${e instanceof Error ? e.message.slice(0, 500) : "inconnue"})
      `;
    } catch {}
    return echec("Le contrôle n'a pas pu être enregistré. Réessaie dans un instant.");
  }
}