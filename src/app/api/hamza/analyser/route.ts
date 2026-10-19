import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";
import { analyserCauses } from "@/lib/hamza-causes";

export const maxDuration = 60;

const JOURS_DEFAUT = 7;
const JOURS_MAX = 90;

const GRAVITE_LABEL: Record<string, string> = { faible: "faible", moyenne: "moyenne", elevee: "élevée" };

function jjmmaaaa(d: Date): string {
  return d.toISOString().slice(0, 10).split("-").reverse().join("/");
}

export async function POST(req: Request) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (orgRole !== "org:admin")
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });

  let jours = JOURS_DEFAUT;
  try {
    const body = await req.json();
    const n = Math.floor(Number(body?.jours));
    if (Number.isFinite(n) && n >= 1) jours = Math.min(n, JOURS_MAX);
  } catch {}

  const ag = await sql`SELECT id FROM agents WHERE name = 'Hamza'`;
  if (!ag[0]) return NextResponse.json({ error: "Agent introuvable" }, { status: 500 });
  const agentId = ag[0].id as number;

  // Une seule analyse en attente de validation à la fois (évite les doublons coûteux).
  const enAttente = await sql`
    SELECT id FROM analyses_causes WHERE org_id = ${orgId} AND statut = 'a_valider' LIMIT 1
  `;
  if (enAttente[0])
    return NextResponse.json(
      { ok: false, error: "Une analyse est déjà en attente de validation." },
      { status: 409 }
    );

  const fin = new Date();
  const debut = new Date(fin.getTime() - jours * 24 * 60 * 60 * 1000);

  const r = await analyserCauses({ orgId, userId, agentId }, { debut, fin });
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 422 });

  try {
    const lignes: string[] = [r.synthese];
    if (r.causes.length > 0) {
      lignes.push("", "Causes identifiées :");
      for (const c of r.causes) {
        const n = c.emails.length;
        lignes.push(
          `• ${c.cause} (gravité ${GRAVITE_LABEL[c.gravite] ?? c.gravite}, ${n} e-mail${n > 1 ? "s" : ""}) — ${c.description}`
        );
      }
    }
    if (r.recommandations.length > 0) {
      lignes.push("", "Recommandations :");
      for (const x of r.recommandations) lignes.push(`• [${x.priorite}] ${x.action}`);
    }

    const periode = `du ${jjmmaaaa(debut)} au ${jjmmaaaa(fin)}`;
    const payload = {
      source: "Proposé par Agent Hamza · Analyse des causes",
      aiReco: "Valider l'analyse des causes",
      chips: ["Support Client", `${r.nbEmails} e-mails`],
      extractTitle: "Synthèse de l'analyse",
      extract: lignes.join("\n"),
      props: [
        { k: "Période", v: periode },
        { k: "E-mails analysés", v: String(r.nbEmails) },
        { k: "Causes identifiées", v: String(r.causes.length) },
      ],
      lineage: ["E-mails triés", "Analyse Hamza", "Validation humaine"],
      analyse_id: r.analyseId,
    };
    await sql`
      INSERT INTO approvals (title, tag, agent_id, agent_label, payload, org_id)
      VALUES (${`Analyse des causes · ${periode}`}, 'Analyse des causes', ${agentId}, 'Hamza',
              ${JSON.stringify(payload)}::jsonb, ${orgId})
    `;
    await sql`
      UPDATE analyses_causes SET statut = 'a_valider'
      WHERE id = ${r.analyseId} AND org_id = ${orgId}
    `;
  } catch (err) {
    // L'analyse est conservée en statut « brouillon » ; rien n'est perdu.
    console.error("hamza approbation", err);
    return NextResponse.json(
      { ok: false, error: "Analyse produite, mais l'approbation n'a pas pu être créée." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    analyse_id: r.analyseId,
    nb_emails: r.nbEmails,
    causes: r.causes.length,
    recommandations: r.recommandations.length,
  });
}