import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { computeCost } from "@/lib/cost";
import { trierEmail } from "@/lib/tri-email";

const LIMITE = 20;

type EmailATrier = {
  id: string;
  expediteur: string | null;
  objet: string | null;
  extrait: string | null;
};

export async function POST() {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (orgRole !== "org:admin") {
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });
  }

  const agents = await sql`SELECT id FROM agents WHERE name = 'Imane'`;
  const agentId = agents[0]?.id as number | undefined;
  if (!agentId) {
    return NextResponse.json({ error: "Agent Imane introuvable" }, { status: 500 });
  }

  const aTrier = (await sql`
    SELECT id, expediteur, objet, extrait
    FROM emails_entrants
    WHERE org_id = ${orgId} AND tri_categorie IS NULL
    ORDER BY recu_le DESC NULLS LAST
    LIMIT ${LIMITE}
  `) as EmailATrier[];

  let tries = 0;
  let echecs = 0;
  let coutMad = 0;
  const parCategorie: Record<string, number> = {};

  for (const m of aTrier) {
    try {
      const r = await trierEmail(m);
      const cost = await computeCost(r.model, r.tokens_entree, r.tokens_sortie);
      const stored = {
        categorie: r.categorie,
        priorite: r.priorite,
        sentiment: r.sentiment,
        equipe: r.equipe,
        traitement: r.traitement,
        cost_mad: cost?.mad ?? null,
        cost_usd: cost?.usd ?? null,
        usd_mad_rate: cost?.rate ?? null,
      };

      // Le contenu de l'e-mail n'est jamais copié dans agent_runs : seulement son identifiant
      await sql`
        INSERT INTO agent_runs
          (org_id, agent_id, user_id, input, result, model, input_tokens, output_tokens, status, duree_ms)
        VALUES
          (${orgId}, ${agentId}, ${userId}, ${JSON.stringify({ email_id: m.id })}::jsonb,
           ${JSON.stringify(stored)}::jsonb, ${r.model}, ${r.tokens_entree}, ${r.tokens_sortie},
           'ok', ${r.duree_ms})
      `;
      await sql`
        UPDATE emails_entrants
        SET tri_categorie = ${r.categorie},
            tri_priorite = ${r.priorite},
            tri_sentiment = ${r.sentiment},
            tri_equipe = ${r.equipe},
            tri_traitement = ${r.traitement},
            tri_justification = ${r.justification},
            tri_par = 'Imane',
            tri_le = now()
        WHERE id = ${m.id} AND org_id = ${orgId}
      `;
      tries += 1;
      coutMad += cost?.mad ?? 0;
      parCategorie[r.categorie] = (parCategorie[r.categorie] ?? 0) + 1;
    } catch (e) {
      echecs += 1;
      try {
        await sql`
          INSERT INTO agent_runs (org_id, agent_id, user_id, input, status, error)
          VALUES (${orgId}, ${agentId}, ${userId}, ${JSON.stringify({ email_id: m.id })}::jsonb,
                  'erreur', ${e instanceof Error ? e.message.slice(0, 500) : "inconnue"})
        `;
      } catch {}
    }
  }

  return NextResponse.json({
    ok: true,
    tries,
    echecs,
    restants_possibles: aTrier.length === LIMITE,
    par_categorie: parCategorie,
    cout_mad: Number(coutMad.toFixed(4)),
  });
}