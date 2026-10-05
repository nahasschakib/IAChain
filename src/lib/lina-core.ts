import { sql } from "@/lib/db";
import { runAiTool } from "@/lib/ai";
import { computeCost } from "@/lib/cost";
import { loadLatestResult, rec } from "@/lib/agent-context";
import {
  FORMATS,
  TONS,
  REGISTRES,
  QUOTAS,
  LINA_SYSTEM,
  linaTool,
  parseLina,
  type LinaOutcome,
  type LinaResult,
  checkClaims,
  checkQuotas,
} from "@/lib/lina";

export type LinaCoreInput = { brief: string; formats: string[]; ton: string; registre: string };

function s(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

// Cœur de l'agent Lina : rédaction à partir du plan d'Othmane et de la veille de Sofia.
export async function executeLina(
  ctx: { orgId: string; userId: string },
  input: LinaCoreInput,
): Promise<{ outcome: LinaOutcome; agentRunId: number | null }> {
  const { orgId, userId } = ctx;

  const formats = (input.formats ?? []).filter((f) => (FORMATS as readonly string[]).includes(f));
  if (formats.length === 0)
    return { outcome: { ok: false, error: "Coche au moins un format." }, agentRunId: null };
  const ton = (TONS as readonly string[]).includes(input.ton) ? input.ton : "Expert";
  const registre = (REGISTRES as readonly string[]).includes(input.registre) ? input.registre : "Direct";

  const agents = await sql`SELECT id, name, output_label FROM agents WHERE slug = 'lina'`;
  const agent = agents[0];
  const agentId = agent?.id as number | undefined;
  if (!agent || !agentId) return { outcome: { ok: false, error: "Agent introuvable." }, agentRunId: null };

  const plan = await loadLatestResult(orgId, "othmane");
  const veille = await loadLatestResult(orgId, "sofia");

  // Brief : celui saisi, sinon l'objectif du plan d'Othmane.
  let brief = input.brief.trim();
  let source: "saisi" | "plan" = "saisi";
  if (brief.length < 20) {
    const objectif = s(plan?.objectif, 800);
    if (objectif) {
      brief = `Contenus à produire pour le plan marketing : ${objectif}`;
      source = "plan";
    } else {
      return {
        outcome: {
          ok: false,
          error: "Brief trop court (20 caractères minimum), et aucun plan d'Othmane n'est disponible pour le compléter.",
        },
        agentRunId: null,
      };
    }
  }
  if (brief.length > 2000)
    return { outcome: { ok: false, error: "Brief trop long (2000 caractères maximum)." }, agentRunId: null };

  const profil = await sql`SELECT offer FROM org_profile WHERE org_id = ${orgId}`;
  const offre = s(profil[0]?.offer, 800);

  // Plan d'Othmane : synthèse + étapes de contenu et d'email.
  let planTxt = "";
  if (plan) {
    const etapes = (Array.isArray(plan.calendrier) ? plan.calendrier : [])
      .map((e) => rec(e))
      .filter((e) => e.canal === "Contenu organique" || e.canal === "Email")
      .slice(0, 14)
      .map((e) => `Semaine ${e.semaine} [${s(e.canal, 40)}] ${s(e.action, 250)} — ${s(e.livrable, 150)}`);
    planTxt =
      `<plan_marketing>\nSynthèse : ${s(plan.synthese, 900)}\n` +
      (etapes.length ? `Étapes éditoriales :\n${etapes.join("\n")}\n` : "") +
      `</plan_marketing>\n\n`;
  }

  // Veille de Sofia : angle éditorial.
  let veilleTxt = "";
  if (veille) {
    const sig = (Array.isArray(veille.signaux) ? veille.signaux : [])
      .slice(0, 5)
      .map((x, i) => `Signal ${i + 1} : ${s(rec(x).titre, 200)} — ${s(rec(x).resume, 300)}`);
    if (sig.length || veille.opportunite)
      veilleTxt = `<veille_marche>\nOpportunité : ${s(veille.opportunite, 600)}\n${sig.join("\n")}\n</veille_marche>\n\n`;
  }

  const demande = formats.map((f) => `${QUOTAS[f] ?? 1} × ${f}`).join(", ");
  const prompt =
        `<brief>\n${brief}\n</brief>\n\n` +
    (source === "plan"
      ? "Note : ce brief reprend une orientation stratégique du plan ; il ne décrit pas une offre déjà commercialisée.\n\n"
      : "") +
    `<ton>${ton}</ton>\n<registre>${registre}</registre>\n\n` +
    `<contenus_demandes>${demande}</contenus_demandes>\n\n` +
       (offre
      ? `<offre_actuelle>\n${offre}\n</offre_actuelle>\n\n`
      : "<offre_actuelle>Non renseignée.</offre_actuelle>\n\n") +
    (planTxt || veilleTxt
      ? "Les blocs suivants sont des orientations stratégiques et des observations de marché. Ils ne décrivent PAS des services déjà commercialisés.\n\n"
      : "") +
    planTxt +
    veilleTxt;

  try {
    const ai = await runAiTool({ system: LINA_SYSTEM, prompt, tool: linaTool(formats), tier: "fast", maxTokens: 6000 });
    const parsed = parseLina(ai.data, formats);
    const cost = await computeCost(ai.model, ai.inputTokens, ai.outputTokens);
    const sourceText = [brief, planTxt, veilleTxt, offre].join(" ");
    const verifs = checkClaims(parsed.contenus, sourceText, offre);
    parsed.points_a_verifier = [
  ...checkQuotas(parsed.contenus, formats),
  ...verifs,
  ...parsed.points_a_verifier,
].slice(0, 14);

    if (parsed.contenus.length === 0) {
      return { outcome: { ok: false, error: "Aucun contenu exploitable n'a été produit. Reformule le brief et relance." }, agentRunId: null };
    }

    const result: LinaResult = {
      brief,
      brief_source: source,
      formats,
      ton,
      registre,
      ...parsed,
      plan_utilise: Boolean(plan),
      veille_utilisee: Boolean(veille),
      nb_mots_total: parsed.contenus.reduce((n, c) => n + c.nb_mots, 0),
    };
    const stored = { ...result, cost_mad: cost?.mad ?? null, cost_usd: cost?.usd ?? null, usd_mad_rate: cost?.rate ?? null };

    const run = await sql`
      INSERT INTO agent_runs (org_id, agent_id, user_id, input, result, model, input_tokens, output_tokens, status)
      VALUES (${orgId}, ${agentId}, ${userId}, ${JSON.stringify({ brief, source, formats, ton, registre })}::jsonb,
              ${JSON.stringify(stored)}::jsonb, ${ai.model}, ${ai.inputTokens}, ${ai.outputTokens}, 'ok')
      RETURNING id
    `;
    const agentRunId = run[0].id as number;

    try {
      const description = `Contenus — ${result.contenus.length} livrable${result.contenus.length > 1 ? "s" : ""}, ${result.nb_mots_total} mots`;
      await sql`
        INSERT INTO agent_execution_history (agent_id, exec_date, description, status, org_id)
        VALUES (${agentId}, CURRENT_DATE, ${description}, 'Terminé', ${orgId})
      `;
      const prev = await sql`
        SELECT COUNT(*) AS n FROM deliverables
        WHERE agent_id = ${agentId} AND org_id = ${orgId} AND COALESCE(origin, '') NOT LIKE 'Simulation%'
      `;
      const titre = `${(agent.output_label as string) ?? "Contenus"} — ${brief.slice(0, 60)}`;
      const version = `v${Number(prev[0].n) + 1}`;
      await sql`
        INSERT INTO deliverables (title, agent_id, kind, version, agent_label, origin, currency, cost, org_id)
        VALUES (${titre}, ${agentId}, 'doc', ${version}, ${agent.name as string}, 'Agent Studio', 'MAD',
                ${cost ? cost.mad.toFixed(4) : null}, ${orgId})
      `;
    } catch (e) {
      console.error("executeLina trace", e);
    }

    return { outcome: { ok: true, result, costMad: cost?.mad }, agentRunId };
  } catch (e) {
    console.error("executeLina", e);
    try {
      await sql`
        INSERT INTO agent_runs (org_id, agent_id, user_id, input, status, error)
        VALUES (${orgId}, ${agentId}, ${userId}, ${JSON.stringify({ brief, formats })}::jsonb,
                'erreur', ${e instanceof Error ? e.message.slice(0, 500) : "inconnue"})
      `;
    } catch {}
    return { outcome: { ok: false, error: "L'agent n'a pas pu répondre. Réessaie dans un instant." }, agentRunId: null };
  }
}