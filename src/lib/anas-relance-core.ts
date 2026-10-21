import { sql } from "@/lib/db";
import { runAiTool } from "@/lib/ai";
import { computeCost } from "@/lib/cost";
import { introAcceptable } from "@/lib/salma";
import {
  ANAS_RELANCE_SYSTEM,
  JOURS_MAX,
  JOURS_MIN,
  REGISTRES_RELANCE,
  assemblerMessage,
  libelleNiveau,
  niveauRelance,
  objetRelance,
  rappelChiffre,
  relanceModele,
  relanceTool,
  type AnasRelanceOutcome,
  type PropositionRelance,
} from "@/lib/anas-relance";

type Ctx = { orgId: string; userId: string };

export type RelanceInput = {
  salmaRunId: number;
  joursSilence: number;
  registre: string;
};

const num = (v: unknown) => (v === null || v === undefined || v === "" ? NaN : Number(v));

// Propositions chiffrées de Salma, avec le dernier verdict de Nadia et l'état d'une éventuelle relance en attente.
export async function listerPourRelance(orgId: string): Promise<PropositionRelance[]> {
  const rows = await sql`
    SELECT r.id, r.result, r.created_at,
      (SELECT n.result->>'verdict' FROM agent_runs n
         WHERE n.org_id = r.org_id AND n.status = 'ok'
           AND n.agent_id = (SELECT id FROM agents WHERE slug = 'nadia')
           AND n.input->>'salma_run_id' = r.id::text
         ORDER BY n.id DESC LIMIT 1) AS verdict_nadia,
      EXISTS (SELECT 1 FROM relances_devis d
         WHERE d.org_id = r.org_id AND d.salma_run_id = r.id AND d.statut = 'a_valider') AS en_attente
    FROM agent_runs r
    WHERE r.org_id = ${orgId}
      AND r.agent_id = (SELECT id FROM agents WHERE slug = 'salma')
      AND r.status = 'ok'
      AND r.result->>'statut' = 'Proposition prête'
    ORDER BY r.id DESC
    LIMIT 20
  `;
  const out: PropositionRelance[] = [];
  for (const row of rows) {
    const r = (row.result ?? {}) as Record<string, unknown>;
    const client = typeof r.client === "string" ? r.client.trim() : "";
    const ttc = num(r.total_ttc);
    if (!client || !Number.isFinite(ttc)) continue;
    const delai = num(r.delai_jours);
    out.push({
      runId: row.id as number,
      client,
      version: typeof r.version === "string" ? r.version : null,
      total_ttc: ttc,
      delai_jours: Number.isFinite(delai) ? delai : null,
      remise_pct: Number.isFinite(num(r.remise_pct)) ? num(r.remise_pct) : 0,
      verdict_nadia: (row.verdict_nadia as string | null) ?? null,
      created_at: new Date(row.created_at as string).toISOString(),
      relance_en_attente: row.en_attente === true,
    });
  }
  return out;
}

// Cœur d'Anas (relance de devis) : brouillon + approbation. N'envoie rien à personne.
export async function executeAnasRelance(
  ctx: Ctx,
  input: RelanceInput
): Promise<{ outcome: AnasRelanceOutcome; agentRunId: number | null }> {
  const { orgId, userId } = ctx;
  const echec = (error: string) => ({ outcome: { ok: false as const, error }, agentRunId: null });

  const salmaRunId = Number(input.salmaRunId);
  if (!Number.isInteger(salmaRunId)) return echec("Choisis d'abord une proposition à relancer.");
  const jours = Number(input.joursSilence);
  if (!Number.isInteger(jours) || jours < JOURS_MIN || jours > JOURS_MAX)
    return echec(`Nombre de jours sans réponse : un entier entre ${JOURS_MIN} et ${JOURS_MAX}.`);
  const registre = (REGISTRES_RELANCE as readonly string[]).includes(input.registre)
    ? (input.registre as (typeof REGISTRES_RELANCE)[number])
    : "Direct";

  const agents = await sql`SELECT id, name, output_label FROM agents WHERE slug = 'anas'`;
  const agent = agents[0];
  if (!agent) return echec("Agent introuvable.");
  const agentId = agent.id as number;

  const liste = await listerPourRelance(orgId);
  const prop = liste.find((p) => p.runId === salmaRunId);
  if (!prop) return echec("Cette proposition est introuvable ou n'est pas chiffrée.");
  if (prop.relance_en_attente) return echec("Une relance est déjà en attente d'approbation pour cette proposition.");
  if (prop.verdict_nadia === "Non conforme")
    return echec("Le contrôle de remise de Nadia a jugé cette proposition non conforme : corrige-la avant de la relancer.");

  const niveau = niveauRelance(jours);
  const objet = objetRelance(prop.client, niveau, prop.version);
  const rappel = rappelChiffre(prop);
  const traceInput = JSON.stringify({ etape: "relance_devis", salma_run_id: salmaRunId, jours_silence: jours, registre, niveau });

  let aiTokensIn = 0;
  let aiTokensOut = 0;
  let aiModel: string | null = null;
  let coutMad = 0;
  let coutUsd = 0;
  let corps = relanceModele(prop.client, niveau, registre);
  let source: "ia" | "modele" = "modele";

  try {
    const prompt =
      `<proposition>\nClient : ${prop.client}\n</proposition>\n\n` +
      `Niveau de relance : ${niveau} (${libelleNiveau(niveau)}).\nRegistre demandé : ${registre}.`;
    try {
      const ai = await runAiTool({ system: ANAS_RELANCE_SYSTEM, prompt, tool: relanceTool, tier: "fast" });
      aiModel = ai.model;
      aiTokensIn = ai.inputTokens;
      aiTokensOut = ai.outputTokens;
      const cost = await computeCost(ai.model, ai.inputTokens, ai.outputTokens);
      coutMad = cost?.mad ?? 0;
      coutUsd = cost?.usd ?? 0;
      const texte = String((ai.data as Record<string, unknown> | null)?.corps ?? "").replace(/\s+/g, " ").trim();
      if (introAcceptable(texte, prop.client, [])) {
        corps = texte;
        source = "ia";
      }
    } catch (e) {
      console.error("executeAnasRelance ia", e);
    }
    const texteFinal = assemblerMessage(corps, rappel);

    let version: string | null = null;
    try {
      const n = await sql`SELECT COUNT(*) AS n FROM relances_devis WHERE org_id = ${orgId}`;
      version = `v${Number(n[0].n) + 1}`;
    } catch (e) {
      console.error("executeAnasRelance version", e);
    }

    const run = await sql`
      INSERT INTO agent_runs (org_id, agent_id, user_id, input, result, model, input_tokens, output_tokens, cost_mad, cost_usd, status)
      VALUES (${orgId}, ${agentId}, ${userId}, ${traceInput}::jsonb,
              ${JSON.stringify({ statut: "Relance prête", client: prop.client, niveau, texte_source: source, cost_mad: coutMad })}::jsonb,
              ${aiModel}, ${aiTokensIn}, ${aiTokensOut}, ${coutMad}, ${coutUsd}, 'ok')
      RETURNING id
    `;
    const agentRunId = run[0].id as number;

    const ins = await sql`
      INSERT INTO relances_devis
        (org_id, salma_run_id, client, jours_silence, niveau, registre, canal, objet, texte, texte_source,
         statut, version, agent_run_id, created_by)
      VALUES (${orgId}, ${salmaRunId}, ${prop.client}, ${jours}, ${niveau}, ${registre}, 'email', ${objet}, ${texteFinal},
              ${source}, 'brouillon', ${version}, ${agentRunId}, ${userId})
      RETURNING id
    `;
    const relanceId = ins[0].id as number;

    // Approbation humaine : le brouillon reste « brouillon » si elle ne peut pas être créée.
    let approbation = false;
    try {
      const payload = {
        source: "Proposé par Agent Anas · Relance de devis",
        aiReco: "Valider la relance (aucun envoi automatique)",
        chips: ["Prospect to Cash", libelleNiveau(niveau)],
        extractTitle: objet,
        extract: texteFinal,
        props: [
          { k: "Client", v: prop.client },
          { k: "Proposition", v: prop.version ?? `n° ${salmaRunId}` },
          { k: "Jours sans réponse", v: String(jours) },
          { k: "Contrôle de remise", v: prop.verdict_nadia ?? "non contrôlée" },
        ],
        lineage: ["Proposition de Salma", "Relance rédigée par Anas", "Validation humaine"],
        relance_id: relanceId,
      };
      await sql`
        INSERT INTO approvals (title, tag, agent_id, agent_label, payload, org_id)
        VALUES (${`Relance de devis · ${prop.client}`}, 'Relance de devis', ${agentId}, ${agent.name as string},
                ${JSON.stringify(payload)}::jsonb, ${orgId})
      `;
      await sql`UPDATE relances_devis SET statut = 'a_valider' WHERE id = ${relanceId} AND org_id = ${orgId}`;
      approbation = true;
    } catch (e) {
      console.error("executeAnasRelance approbation", e);
    }

    try {
      await sql`
        INSERT INTO agent_execution_history (agent_id, exec_date, description, status, org_id)
        VALUES (${agentId}, CURRENT_DATE, ${`Relance de devis · ${prop.client} — ${libelleNiveau(niveau)}`}, 'En attente', ${orgId})
      `;
      const label = `Relance de devis`;
      await sql`
        INSERT INTO deliverables (title, agent_id, kind, version, agent_label, origin, currency, cost, org_id)
        VALUES (${`${label} — ${prop.client}`}, ${agentId}, 'doc', ${version ?? "v1"},
                ${agent.name as string}, 'Agent Studio', 'MAD', ${coutMad.toFixed(4)}, ${orgId})
      `;
    } catch (e) {
      console.error("executeAnasRelance trace", e);
    }

    return {
      outcome: {
        ok: true,
        costMad: coutMad,
        result: {
          relance_id: relanceId,
          client: prop.client,
          proposition_run_id: salmaRunId,
          proposition_version: prop.version,
          niveau,
          jours_silence: jours,
          registre,
          canal: "email",
          objet,
          texte: texteFinal,
          texte_source: source,
          verdict_nadia: prop.verdict_nadia,
          approbation_creee: approbation,
          version,
        },
      },
      agentRunId,
    };
  } catch (e) {
    console.error("executeAnasRelance", e);
    try {
      await sql`
        INSERT INTO agent_runs (org_id, agent_id, user_id, input, status, error)
        VALUES (${orgId}, ${agentId}, ${userId}, ${traceInput}::jsonb,
                'erreur', ${e instanceof Error ? e.message.slice(0, 500) : "inconnue"})
      `;
    } catch {}
    return echec("La relance n'a pas pu être préparée. Réessaie dans un instant.");
  }
}