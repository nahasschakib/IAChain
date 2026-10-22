import { sql } from "@/lib/db";
import { runAiTool } from "@/lib/ai";
import { computeCost } from "@/lib/cost";
import { introAcceptable } from "@/lib/salma";
import {
  ANAS_NURTURING_SYSTEM,
  CANAUX,
  MATURITES,
  NB_MAX,
  NB_MIN,
  REGISTRES_NURTURING,
  libelleJour,
  longueurMax,
  messageModele,
  nurturingTool,
  planSequence,
  type AnasNurturingOutcome,
  type Canal,
  type Maturite,
  type ToucheRedigee,
} from "@/lib/anas-nurturing";

type Ctx = { orgId: string; userId: string };

export type NurturingInput = {
  client: string;
  theme: string;
  maturite: string;
  canaux: string[];
  nbTouches: number;
  registre: string;
};

// Cœur d'Anas (séquence de nurturing) : brouillon + approbation. N'envoie rien à personne.
export async function executeAnasNurturing(
  ctx: Ctx,
  input: NurturingInput
): Promise<{ outcome: AnasNurturingOutcome; agentRunId: number | null }> {
  const { orgId, userId } = ctx;
  const echec = (error: string) => ({ outcome: { ok: false as const, error }, agentRunId: null });

  const client = String(input.client ?? "").replace(/\s+/g, " ").trim();
  if (client.length < 2 || client.length > 120) return echec("Indique le nom du prospect (2 à 120 caractères).");
  const theme = String(input.theme ?? "").replace(/\s+/g, " ").trim();
  if (theme.length > 120) return echec("Le thème est limité à 120 caractères.");
  if (!(MATURITES as readonly string[]).includes(input.maturite)) return echec("Choisis la maturité du prospect.");
  const maturite = input.maturite as Maturite;
  const canaux = CANAUX.filter((c) => (input.canaux ?? []).includes(c));
  if (canaux.length === 0) return echec("Choisis au moins un canal.");
  const nb = Number(input.nbTouches);
  if (!Number.isInteger(nb) || nb < NB_MIN || nb > NB_MAX) return echec(`Nombre de touches : un entier entre ${NB_MIN} et ${NB_MAX}.`);
  const registre = (REGISTRES_NURTURING as readonly string[]).includes(input.registre)
    ? (input.registre as (typeof REGISTRES_NURTURING)[number])
    : "Direct";

  const agents = await sql`SELECT id, name FROM agents WHERE slug = 'anas'`;
  const agent = agents[0];
  if (!agent) return echec("Agent introuvable.");
  const agentId = agent.id as number;

  const deja = await sql`
    SELECT 1 FROM sequences_nurturing WHERE org_id = ${orgId} AND lower(client) = lower(${client}) AND statut = 'a_valider' LIMIT 1
  `;
  if (deja.length > 0) return echec("Une séquence est déjà en attente d'approbation pour ce prospect.");

  const plan = planSequence({ client, theme, maturite, canaux, nb });
  const traceInput = JSON.stringify({ etape: "nurturing", client, theme, maturite, canaux, nb_touches: nb, registre });

  let aiTokensIn = 0;
  let aiTokensOut = 0;
  let aiModel: string | null = null;
  let coutMad = 0;
  let coutUsd = 0;
  const iaParRang = new Map<number, string>();

  try {
    try {
      const lignes = plan.map((t) => `${t.rang}. ${t.canal} — ${t.objectif}`).join("\n");
      const prompt =
        `<prospect>\nClient : ${client}\nThème : ${theme || "non précisé"}\nMaturité : ${maturite}\n</prospect>\n\n` +
        `Registre demandé : ${registre}.\nTouches à rédiger :\n${lignes}`;
      const ai = await runAiTool({ system: ANAS_NURTURING_SYSTEM, prompt, tool: nurturingTool, tier: "fast", maxTokens: 1500 });
      aiModel = ai.model;
      aiTokensIn = ai.inputTokens;
      aiTokensOut = ai.outputTokens;
      const cost = await computeCost(ai.model, ai.inputTokens, ai.outputTokens);
      coutMad = cost?.mad ?? 0;
      coutUsd = cost?.usd ?? 0;
      const msgs = (ai.data as Record<string, unknown> | null)?.messages;
      if (Array.isArray(msgs)) {
        for (const m of msgs) {
          const o = (m ?? {}) as Record<string, unknown>;
          const rang = Number(o.rang);
          const corps = String(o.corps ?? "").replace(/\s+/g, " ").trim();
          if (Number.isInteger(rang) && !iaParRang.has(rang)) iaParRang.set(rang, corps);
        }
      }
    } catch (e) {
      console.error("executeAnasNurturing ia", e);
    }

    const touches: ToucheRedigee[] = plan.map((t) => {
      const texte = iaParRang.get(t.rang) ?? "";
      if (texte && texte.length <= longueurMax(t.canal) && introAcceptable(texte, client, [theme])) {
        return { ...t, corps: texte, source: "ia" as const };
      }
      return { ...t, corps: messageModele(client, theme, t.objectif, registre), source: "modele" as const };
    });
    const nbIa = touches.filter((t) => t.source === "ia").length;
    const source: "ia" | "modele" | "mixte" = nbIa === touches.length ? "ia" : nbIa === 0 ? "modele" : "mixte";

    let version: string | null = null;
    try {
      const n = await sql`SELECT COUNT(*) AS n FROM sequences_nurturing WHERE org_id = ${orgId}`;
      version = `v${Number(n[0].n) + 1}`;
    } catch (e) {
      console.error("executeAnasNurturing version", e);
    }

    const run = await sql`
      INSERT INTO agent_runs (org_id, agent_id, user_id, input, result, model, input_tokens, output_tokens, cost_mad, cost_usd, status)
      VALUES (${orgId}, ${agentId}, ${userId}, ${traceInput}::jsonb,
              ${JSON.stringify({ statut: "Séquence prête", client, maturite, nb_touches: nb, texte_source: source, cost_mad: coutMad })}::jsonb,
              ${aiModel}, ${aiTokensIn}, ${aiTokensOut}, ${coutMad}, ${coutUsd}, 'ok')
      RETURNING id
    `;
    const agentRunId = run[0].id as number;

    const ins = await sql`
      INSERT INTO sequences_nurturing
        (org_id, client, theme, maturite, canaux, nb_touches, registre, touches, texte_source, statut, version, agent_run_id, created_by)
      VALUES (${orgId}, ${client}, ${theme || null}, ${maturite}, ${JSON.stringify(canaux)}::jsonb, ${nb}, ${registre},
              ${JSON.stringify(touches)}::jsonb, ${source}, 'brouillon', ${version}, ${agentRunId}, ${userId})
      RETURNING id
    `;
    const sequenceId = ins[0].id as number;

    // Approbation humaine : le brouillon reste « brouillon » si elle ne peut pas être créée.
    let approbation = false;
    try {
      const extrait = touches
        .map((t) => `${libelleJour(t.jour)} · ${t.canal} · ${t.objectif}${t.objet ? `\nObjet : ${t.objet}` : ""}\n${t.corps}`)
        .join("\n\n");
      const payload = {
        source: "Proposé par Agent Anas · Séquence de nurturing",
        aiReco: "Valider la séquence (aucun envoi automatique)",
        chips: ["Prospect to Cash", `${nb} touches`, maturite],
        extractTitle: `Séquence de nurturing · ${client}`,
        extract: extrait,
        props: [
          { k: "Prospect", v: client },
          { k: "Thème", v: theme || "non précisé" },
          { k: "Maturité", v: maturite },
          { k: "Canaux", v: canaux.join(", ") },
          { k: "Touches", v: String(nb) },
        ],
        lineage: ["Calendrier et canaux fixés par le code", "Messages rédigés par Anas", "Validation humaine"],
        sequence_id: sequenceId,
      };
      await sql`
        INSERT INTO approvals (title, tag, agent_id, agent_label, payload, org_id)
        VALUES (${`Séquence de nurturing · ${client}`}, 'Séquence de nurturing', ${agentId}, ${agent.name as string},
                ${JSON.stringify(payload)}::jsonb, ${orgId})
      `;
      await sql`UPDATE sequences_nurturing SET statut = 'a_valider' WHERE id = ${sequenceId} AND org_id = ${orgId}`;
      approbation = true;
    } catch (e) {
      console.error("executeAnasNurturing approbation", e);
    }

    try {
      await sql`
        INSERT INTO agent_execution_history (agent_id, exec_date, description, status, org_id)
        VALUES (${agentId}, CURRENT_DATE, ${`Séquence de nurturing · ${client} — ${nb} touches`}, 'En attente', ${orgId})
      `;
      await sql`
        INSERT INTO deliverables (title, agent_id, kind, version, agent_label, origin, currency, cost, org_id)
        VALUES (${`Séquence de nurturing — ${client}`}, ${agentId}, 'doc', ${version ?? "v1"},
                ${agent.name as string}, 'Agent Studio', 'MAD', ${coutMad.toFixed(4)}, ${orgId})
      `;
    } catch (e) {
      console.error("executeAnasNurturing trace", e);
    }

    return {
      outcome: {
        ok: true,
        costMad: coutMad,
        result: {
          sequence_id: sequenceId,
          client,
          theme,
          maturite,
          canaux: canaux as Canal[],
          nb_touches: nb,
          registre,
          touches,
          texte_source: source,
          approbation_creee: approbation,
          version,
        },
      },
      agentRunId,
    };
  } catch (e) {
    console.error("executeAnasNurturing", e);
    try {
      await sql`
        INSERT INTO agent_runs (org_id, agent_id, user_id, input, status, error)
        VALUES (${orgId}, ${agentId}, ${userId}, ${traceInput}::jsonb,
                'erreur', ${e instanceof Error ? e.message.slice(0, 500) : "inconnue"})
      `;
    } catch {}
    return echec("La séquence n'a pas pu être préparée. Réessaie dans un instant.");
  }
}