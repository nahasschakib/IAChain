import { sql } from "@/lib/db";
import { runAiTool } from "@/lib/ai";
import { computeCost } from "@/lib/cost";
import { getOrgProfile } from "@/lib/org-profile";
import { getPolitiqueActive } from "@/lib/politique-tarifaire";
import { listPrestations } from "@/lib/catalogue-prestations";
import { remiseKarim, type KarimRemise } from "@/lib/karim";
import {
  BUDGETS_SALMA,
  REGISTRES_SALMA,
  SALMA_PROPOSE_SYSTEM,
  SALMA_REDIGE_SYSTEM,
  calculerTotaux,
  construireLignes,
  delaiTotal,
  introAcceptable,
  introModele,
  parseProposition,
  positionBudget,
  proposerTool,
  redigerTool,
  remiseInfo,
  type LigneChoisie,
  type SalmaOutcome,
  type SalmaProposeOutcome,
  type SalmaResult,
} from "@/lib/salma";

type Ctx = { orgId: string; userId: string };

export type SalmaProposeInput = {
  client: string;
  objectif: string; // angle d'approche de Karim (dérivé) ou saisie
  budget: string; // cadre retenu par Mehdi (dérivé) : « < 50k MAD », « 50-200k MAD », « 200k+ MAD » ou vide
};

export type SalmaCoreInput = {
  agentRunId: number; // exécution créée par la proposition de lignes
  registre: string;
  remise: number; // en %
  segment?: string; // segment retenu par Karim (facultatif)
  lignes: LigneChoisie[];
};

async function agentSalma() {
  const agents = await sql`SELECT id, name, output_label FROM agents WHERE slug = 'salma'`;
  return agents[0] as { id: number; name: string; output_label: string | null } | undefined;
}

// Étape 1 : l'IA propose des lignes, uniquement parmi le catalogue actif de l'organisation.
// Cette étape crée l'exécution de Salma ; l'étape 2 la complète (une exécution par devis).
export async function proposerLignesSalma(
  ctx: Ctx,
  input: SalmaProposeInput
): Promise<{ outcome: SalmaProposeOutcome; agentRunId: number | null }> {
  const { orgId, userId } = ctx;
  const client = String(input.client ?? "").replace(/\s+/g, " ").trim();
  const objectif = String(input.objectif ?? "").trim();
  const budget = String(input.budget ?? "").trim();
  const echec = (error: string) => ({ outcome: { ok: false as const, error }, agentRunId: null });
  if (client.length < 2) return echec("Nom du client trop court (2 caractères minimum).");
  if (client.length > 120) return echec("Nom du client trop long (120 caractères maximum).");
  if (objectif.length > 2000) return echec("Objectif trop long (2000 caractères maximum).");
  if (budget && !(BUDGETS_SALMA as readonly string[]).includes(budget)) return echec("Cadre budgétaire inconnu.");

  const agent = await agentSalma();
  if (!agent) return echec("Agent introuvable.");

  const catalogue = await listPrestations(orgId, true);
  if (catalogue.length === 0)
    return echec("Le catalogue de prestations est vide : ajoute des prestations dans Paramètres avant de chiffrer.");

  const traceInput = JSON.stringify({ etape: "lignes", client, objectif, budget });
  const liste = catalogue
    .map(
      (p) =>
        `- id ${p.id} : ${p.libelle} (${p.unite}, ${p.prix_ht} MAD HT${p.delai_jours !== null ? `, délai ${p.delai_jours} j` : ""})` +
        (p.description ? ` — ${p.description}` : "")
    )
    .join("\n");
  const prompt =
    `<besoin_prospect>\nClient : ${client}\nObjectif : ${objectif || "non fourni"}\n</besoin_prospect>\n\n` +
    `<catalogue>\n${liste}\n</catalogue>\n\n` +
    `Cadre budgétaire : ${budget || "non précisé"}.`;

  try {
    const ai = await runAiTool({ system: SALMA_PROPOSE_SYSTEM, prompt, tool: proposerTool(catalogue), tier: "fast" });
    const proposition = parseProposition(ai.data, catalogue);
    const cost = await computeCost(ai.model, ai.inputTokens, ai.outputTokens);
    const stored = {
      etape: "lignes",
      proposition,
      cost_mad: cost?.mad ?? null,
      cost_usd: cost?.usd ?? null,
      usd_mad_rate: cost?.rate ?? null,
    };
    const run = await sql`
      INSERT INTO agent_runs (org_id, agent_id, user_id, input, result, model, input_tokens, output_tokens, cost_mad, cost_usd, status)
      VALUES (${orgId}, ${agent.id}, ${userId}, ${traceInput}::jsonb, ${JSON.stringify(stored)}::jsonb,
              ${ai.model}, ${ai.inputTokens}, ${ai.outputTokens}, ${cost?.mad ?? null}, ${cost?.usd ?? null}, 'ok')
      RETURNING id
    `;
    const agentRunId = run[0].id as number;
    const org = await getOrgProfile(orgId);
    return {
      outcome: { ok: true, agentRunId, proposition, catalogue, segments: org.segments, costMad: cost?.mad },
      agentRunId,
    };
  } catch (e) {
    console.error("proposerLignesSalma", e);
    try {
      await sql`
        INSERT INTO agent_runs (org_id, agent_id, user_id, input, status, error)
        VALUES (${orgId}, ${agent.id}, ${userId}, ${traceInput}::jsonb,
                'erreur', ${e instanceof Error ? e.message.slice(0, 500) : "inconnue"})
      `;
    } catch {}
    return echec("L'agent n'a pas pu répondre. Réessaie dans un instant.");
  }
}

// Étape 2 : le commercial a ajusté les lignes. Le code calcule tout ; l'IA ne rédige que l'introduction.
// Cœur de l'agent Salma : appelé par l'écran Studio ET, plus tard, par le moteur de workflow.
export async function executeSalma(
  ctx: Ctx,
  input: SalmaCoreInput
): Promise<{ outcome: SalmaOutcome; agentRunId: number | null }> {
  const { orgId, userId } = ctx;
  const runId = Number(input.agentRunId);
  const echec = (error: string) => ({ outcome: { ok: false as const, error }, agentRunId: null });
  if (!Number.isInteger(runId)) return echec("Exécution de référence manquante : relance d'abord la proposition de lignes.");

  const agent = await agentSalma();
  if (!agent) return echec("Agent introuvable.");

  // L'exécution de référence fixe client, objectif et cadre budgétaire : ils ne sont pas rouverts ici.
  const prev = await sql`
    SELECT input, cost_mad, cost_usd FROM agent_runs
    WHERE id = ${runId} AND org_id = ${orgId} AND agent_id = ${agent.id} AND status = 'ok'
  `;
  if (!prev[0]) return echec("Exécution de référence introuvable : relance la proposition de lignes.");
  const ref = (prev[0].input ?? {}) as Record<string, unknown>;
  const client = String(ref.client ?? "");
  const objectif = String(ref.objectif ?? "");
  const budget = String(ref.budget ?? "");
  if (!client) return echec("Exécution de référence invalide : relance la proposition de lignes.");

  const registre = (REGISTRES_SALMA as readonly string[]).includes(input.registre)
    ? (input.registre as (typeof REGISTRES_SALMA)[number])
    : "Direct";

  const org = await getOrgProfile(orgId);
  const segment = String(input.segment ?? "").trim();
  if (segment && !org.segments.includes(segment)) return echec(`Segment « ${segment} » inconnu pour cette organisation.`);

  const catalogue = await listPrestations(orgId, true);
  const l = construireLignes(input.lignes, catalogue);
  if (!l.ok) return echec(l.error);
  const t = calculerTotaux(l.lignes, Number(input.remise));
  if (!t.ok) return echec(t.error);

  let plafond: KarimRemise;
  try {
    plafond = remiseKarim(await getPolitiqueActive(orgId), segment);
  } catch (e) {
    console.error("executeSalma politique", e);
    plafond = { defini: false, raison: "Politique tarifaire illisible (erreur technique)" };
  }

  const traceFinal = JSON.stringify({
    etape: "devis",
    registre,
    segment,
    remise: t.totaux.remise_pct,
    lignes: input.lignes.map((x) => ({ prestation_id: Number(x.prestation_id), quantite: Number(x.quantite) })),
  });

  const prompt =
    `<objectif_prospect>\n${objectif || "non fourni"}\n</objectif_prospect>\n\n` +
    `<prestations_retenues>\n${l.lignes.map((x) => `- ${x.libelle}`).join("\n")}\n</prestations_retenues>\n\n` +
    `Client : ${client}.\nRegistre demandé : ${registre}.`;

  try {
    const ai = await runAiTool({ system: SALMA_REDIGE_SYSTEM, prompt, tool: redigerTool, tier: "fast" });
    const texte = String((ai.data as Record<string, unknown> | null)?.introduction ?? "").replace(/\s+/g, " ").trim();
    const accepte = introAcceptable(texte, client, [objectif]);
    const cost = await computeCost(ai.model, ai.inputTokens, ai.outputTokens);
    const coutMad = Number(prev[0].cost_mad ?? 0) + (cost?.mad ?? 0);
    const coutUsd = Number(prev[0].cost_usd ?? 0) + (cost?.usd ?? 0);

    // Numéro de version : même règle que les autres agents (livrables non simulés).
    let version: string | null = null;
    try {
      const n = await sql`
        SELECT COUNT(*) AS n FROM deliverables
        WHERE agent_id = ${agent.id} AND org_id = ${orgId} AND COALESCE(origin, '') NOT LIKE 'Simulation%'
      `;
      version = `v${Number(n[0].n) + 1}`;
    } catch (e) {
      console.error("executeSalma version", e);
    }

    const result: SalmaResult = {
      client,
      objectif,
      budget,
      registre,
      segment,
      lignes: l.lignes,
      ...t.totaux,
      delai_jours: delaiTotal(l.lignes),
      introduction: accepte ? texte : introModele(client, registre),
      introduction_source: accepte ? "ia" : "modele",
      remise_plafond: plafond,
      remise_info: remiseInfo(plafond, t.totaux.remise_pct),
      position_budget: positionBudget(budget, t.totaux.total_ttc),
      version,
      statut: "Proposition prête",
    };
    const stored = { ...result, cost_mad: coutMad, cost_usd: coutUsd };

    const maj = await sql`
      UPDATE agent_runs
      SET input = input || ${traceFinal}::jsonb,
          result = ${JSON.stringify(stored)}::jsonb,
          model = ${ai.model},
          input_tokens = COALESCE(input_tokens, 0) + ${ai.inputTokens},
          output_tokens = COALESCE(output_tokens, 0) + ${ai.outputTokens},
          cost_mad = ${coutMad},
          cost_usd = ${coutUsd}
      WHERE id = ${runId} AND org_id = ${orgId} AND agent_id = ${agent.id} AND status = 'ok'
      RETURNING id
    `;
    if (!maj[0]) return echec("Exécution de référence introuvable : relance la proposition de lignes.");

    // Trace métier : historique et livrable (une nouvelle version à chaque chiffrage).
    try {
      const ttc = result.total_ttc.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      await sql`
        INSERT INTO agent_execution_history (agent_id, exec_date, description, status, org_id)
        VALUES (${agent.id}, CURRENT_DATE, ${`Proposition · ${client} — ${ttc} MAD TTC`}, 'Terminé', ${orgId})
      `;
      const base = agent.output_label ?? "Proposition commerciale";
      await sql`
        INSERT INTO deliverables (title, agent_id, kind, version, agent_label, origin, currency, cost, org_id)
        VALUES (${`${base} — ${client}`}, ${agent.id}, 'doc', ${version ?? "v1"},
                ${agent.name}, 'Agent Studio', 'MAD', ${coutMad.toFixed(4)}, ${orgId})
      `;
    } catch (e) {
      console.error("executeSalma trace", e);
    }

    return { outcome: { ok: true, result, costMad: coutMad }, agentRunId: runId };
  } catch (e) {
    console.error("executeSalma", e);
    try {
      await sql`
        INSERT INTO agent_runs (org_id, agent_id, user_id, input, status, error)
        VALUES (${orgId}, ${agent.id}, ${userId}, ${traceFinal}::jsonb,
                'erreur', ${e instanceof Error ? e.message.slice(0, 500) : "inconnue"})
      `;
    } catch {}
    return echec("L'agent n'a pas pu répondre. Réessaie dans un instant.");
  }
}