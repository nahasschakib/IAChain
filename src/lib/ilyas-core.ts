import { sql } from "@/lib/db";
import { runAiTool } from "@/lib/ai";
import { computeCost } from "@/lib/cost";
import { searchBrave, type BraveResult } from "@/lib/brave";
import { findSocialLinks } from "@/lib/social";
import {
  SIGNAUX,
  SIGNAL_QUERY_HINTS,
  ILYAS_SYSTEM,
  ilyasTool,
  parseAccounts,
  scoreAccount,
  normalizeName,
  type IlyasOutcome,
  type IlyasResult,
  type IlyasScoredAccount,
} from "@/lib/ilyas";

export type IlyasCoreInput = {
  requete: string;
  signaux: string[];
  volumeCible: number;
  dedoublonner: boolean;
};

const CITIES = ["Casablanca", "Rabat", "Tanger", "Kénitra", "Marrakech", "Agadir", "Fès", "Mohammedia", "Oujda", "Meknès", "Tétouan", "Settat", "El Jadida", "Berrechid"];
const SECTORS = ["agroalimentaire", "automobile", "aéronautique", "textile", "pharmaceutique", "chimie", "plasturgie", "métallurgie", "logistique", "emballage", "papier", "électronique"];

// Une recherche par combinaison ville × secteur citée dans la requête (6 max).
function geoSectorQueries(requete: string): string[] {
  const cities = CITIES.filter((c) => new RegExp(c, "i").test(requete));
  const sectors = SECTORS.filter((s) => new RegExp(s, "i").test(requete));
  const out: string[] = [];
  for (const c of cities)
    for (const s of sectors) out.push(`usines ${s} ${c} Maroc directeur industriel OR DAF`);
  return out.slice(0, 6);
}

// Cœur de l'agent Ilyas : sourcing réel via Brave Search + extraction IA + scoring déterministe.
export async function executeIlyas(
  ctx: { orgId: string; userId: string },
  input: IlyasCoreInput,
): Promise<{ outcome: IlyasOutcome; agentRunId: number | null }> {
  const { orgId, userId } = ctx;

  const requete = input.requete.trim();
  const MOROCCO_HINTS =
    /maroc|marocain|casablanca|rabat|tanger|marrakech|agadir|fès|fez|kénitra|kenitra|mohammedia|oujda/i;
  const base = requete.slice(0, 250); // Brave refuse les requêtes trop longues
  const requeteGeo = MOROCCO_HINTS.test(base) ? base : `Maroc ${base}`;
  if (requete.length < 20)
    return {
      outcome: {
        ok: false,
        error: "Requête de ciblage trop courte (20 caractères minimum).",
      },
      agentRunId: null,
    };
  if (requete.length > 2000)
    return {
      outcome: {
        ok: false,
        error: "Requête de ciblage trop longue (2000 caractères maximum).",
      },
      agentRunId: null,
    };

  const signaux = (input.signaux ?? []).filter((s): s is string =>
    (SIGNAUX as readonly string[]).includes(s),
  );

  const agents =
    await sql`SELECT id, name, output_label FROM agents WHERE slug = 'ilyas'`;
  const agent = agents[0];
  const agentId = agent?.id as number | undefined;
  if (!agent || !agentId)
    return {
      outcome: { ok: false, error: "Agent introuvable." },
      agentRunId: null,
    };

  // Une requête Brave par signal coché (8 résultats max chacun) ; sinon une seule requête générale.
  const queries = (
    signaux.length > 0
      ? signaux.map(
          (s) =>
            `${requeteGeo} ${SIGNAL_QUERY_HINTS[s as (typeof SIGNAUX)[number]]}`,
        )
      : [requeteGeo]
  ).concat(geoSectorQueries(requete))
   .concat(`${base} site:.ma`);

  let raw: BraveResult[] = [];
  try {
    const settled = await Promise.allSettled(
      queries.slice(0, 12).map((q) => searchBrave(q, 20)),
    );
    const byUrl = new Map<string, BraveResult>();
    let ok = 0;
    for (const s of settled) {
      if (s.status !== "fulfilled") continue;
      ok++;
      for (const r of s.value) byUrl.set(r.url, r);
    }
    if (ok === 0) throw new Error("Toutes les requêtes Brave ont échoué");
    raw = Array.from(byUrl.values());
  } catch (e) {
    console.error("executeIlyas brave", e);
    return {
      outcome: {
        ok: false,
        error: "La recherche web a échoué. Réessaie dans un instant.",
      },
      agentRunId: null,
    };
  }

  if (raw.length === 0) {
    return {
      outcome: {
        ok: false,
        error: "Aucun résultat trouvé pour cette requête de ciblage.",
      },
      agentRunId: null,
    };
  }

  const validUrls = new Set(raw.map((r) => r.url));
  const resultsText = raw
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\nURL: ${r.url}\nExtrait: ${r.description}`,
    )
    .join("\n\n");

  const prompt =
    `<requete_ciblage>\n${requete}\n</requete_ciblage>\n\n` +
    (signaux.length > 0
      ? `Signaux d'achat recherchés : ${signaux.join(", ")}.\n\n`
      : "") +
    `<resultats_recherche>\n${resultsText}\n</resultats_recherche>`;

  try {
    const ai = await runAiTool({
      system: ILYAS_SYSTEM,
      prompt,
      tool: ilyasTool(signaux),
      tier: "fast",
      maxTokens: 4096,
    });
    const accounts = parseAccounts(ai.data, validUrls, signaux);
    const cost = await computeCost(ai.model, ai.inputTokens, ai.outputTokens);

    // Dédoublonnage CRM (optionnel) : comparaison de noms normalisés, en code — jamais par l'IA.
    let crmNames = new Set<string>();
    if (input.dedoublonner) {
      const rows = await sql`SELECT name FROM crm_accounts`;
      crmNames = new Set(rows.map((r) => normalizeName(r.name as string)));
    }

        const scored: IlyasScoredAccount[] = accounts
      .map((a) => ({
        ...a,
        score: scoreAccount(a, signaux),
        deja_en_portefeuille:
          input.dedoublonner && crmNames.has(normalizeName(a.nom)),
        linkedin_url: "",
        facebook_url: "",
        instagram_url: "",
      }))
      .sort((a, b) => b.score - a.score);

    // Le volume cible ne s'applique qu'aux comptes nouveaux ; les comptes déjà
    // en portefeuille restent listés comme écartés sans consommer le quota.
    const retenus = scored
      .filter((a) => !a.deja_en_portefeuille)
      .slice(0, Math.max(input.volumeCible, 1));
    const ecartes = scored.filter((a) => a.deja_en_portefeuille);
    const comptes = [...retenus, ...ecartes];

    // Pages sociales des comptes retenus (20 max, par lots de 4 pour rester sous la limite de débit Brave).
    const toEnrich = retenus.slice(0, 20);
    for (let i = 0; i < toEnrich.length; i += 4) {
      await Promise.all(
        toEnrich.slice(i, i + 4).map(async (a) => {
          const s = await findSocialLinks(a.nom, a.ville);
          a.linkedin_url = s.linkedin_url;
          a.facebook_url = s.facebook_url;
          a.instagram_url = s.instagram_url;
        }),
      );
    }

    const avecContact = retenus.filter((a) => a.contact_nom).length;

    const result: IlyasResult = {
      requete,
      comptes,
      comptes_retenus: retenus.length,
      comptes_ecartes: ecartes.length,
      pct_contact_trouve:
        retenus.length > 0
          ? Math.round((avecContact / retenus.length) * 100)
          : 0,
      dedoublonnage_actif: input.dedoublonner,
    };
    const stored = {
      ...result,
      cost_mad: cost?.mad ?? null,
      cost_usd: cost?.usd ?? null,
      usd_mad_rate: cost?.rate ?? null,
    };

    const run = await sql`
      INSERT INTO agent_runs (org_id, agent_id, user_id, input, result, model, input_tokens, output_tokens, status)
      VALUES (${orgId}, ${agentId}, ${userId}, ${JSON.stringify({ requete, signaux, volumeCible: input.volumeCible, dedoublonner: input.dedoublonner })}::jsonb,
              ${JSON.stringify(stored)}::jsonb, ${ai.model}, ${ai.inputTokens}, ${ai.outputTokens}, 'ok')
      RETURNING id
    `;
    const agentRunId = run[0].id as number;

    try {
      const description = `Ciblage — ${retenus.length} compte${retenus.length > 1 ? "s" : ""} retenu${retenus.length > 1 ? "s" : ""}`;
      await sql`
        INSERT INTO agent_execution_history (agent_id, exec_date, description, status, org_id)
        VALUES (${agentId}, CURRENT_DATE, ${description}, 'Terminé', ${orgId})
      `;
      if (retenus.length > 0) {
        const prev = await sql`
          SELECT COUNT(*) AS n FROM deliverables
          WHERE agent_id = ${agentId} AND org_id = ${orgId}
            AND COALESCE(origin, '') NOT LIKE 'Simulation%'
        `;
               const titre =
          (agent.output_label as string) ?? "Liste de comptes ciblés";
        const version = `v${Number(prev[0].n) + 1}`;
        await sql`
          INSERT INTO deliverables (title, agent_id, kind, version, agent_label, origin, currency, cost, org_id)
          VALUES (${titre}, ${agentId}, 'list', ${version},
                  ${agent.name as string}, 'Agent Studio', 'MAD', ${cost ? cost.mad.toFixed(4) : null}, ${orgId})
        `;
      }
    } catch (e) {
      console.error("executeIlyas trace", e);
    }

    return { outcome: { ok: true, result, costMad: cost?.mad }, agentRunId };
  } catch (e) {
    console.error("executeIlyas", e);
    try {
      await sql`
        INSERT INTO agent_runs (org_id, agent_id, user_id, input, status, error)
        VALUES (${orgId}, ${agentId}, ${userId}, ${JSON.stringify({ requete, signaux })}::jsonb,
                'erreur', ${e instanceof Error ? e.message.slice(0, 500) : "inconnue"})
      `;
    } catch {}
    return {
      outcome: {
        ok: false,
        error: "L'agent n'a pas pu répondre. Réessaie dans un instant.",
      },
      agentRunId: null,
    };
  }
}
