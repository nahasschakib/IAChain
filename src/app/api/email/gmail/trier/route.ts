import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
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

  // Messages de cette organisation pas encore triés (les plus récents d'abord)
  const aTrier = (await sql`
    SELECT id, expediteur, objet, extrait
    FROM emails_entrants
    WHERE org_id = ${orgId} AND tri_categorie IS NULL
    ORDER BY recu_le DESC NULLS LAST
    LIMIT ${LIMITE}
  `) as EmailATrier[];

  let tries = 0;
  let echecs = 0;
  let tokensEntree = 0;
  let tokensSortie = 0;
  const parCategorie: Record<string, number> = {};

  for (const m of aTrier) {
    try {
      const r = await trierEmail(m);
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
      tokensEntree += r.tokens_entree;
      tokensSortie += r.tokens_sortie;
      parCategorie[r.categorie] = (parCategorie[r.categorie] ?? 0) + 1;
    } catch {
      echecs += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    tries,
    echecs,
    restants_possibles: aTrier.length === LIMITE,
    par_categorie: parCategorie,
    tokens: { entree: tokensEntree, sortie: tokensSortie },
  });
}