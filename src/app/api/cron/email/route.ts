import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { synchroniserImap } from "@/lib/email-sync-imap";
import { trierEmailsOrganisation } from "@/lib/email-tri-org";
import { declencherSupport } from "@/lib/email-declenchement";
import { traiterSuivis } from "@/lib/suivi-traiter";
import { lancerAnalyseHamza } from "@/lib/hamza-analyse-org";

export const maxDuration = 60;

const UTILISATEUR_SYSTEME = "system:cron";
const BUDGET_MS = 45_000;

// Comparaison à temps constant : on compare les empreintes, qui ont toujours la même taille.
function secretValide(entete: string | null): boolean {
  const attendu = process.env.CRON_SECRET;
  if (!attendu || attendu.length < 16) return false;
  if (!entete || !entete.startsWith("Bearer ")) return false;
  const a = createHash("sha256").update(entete.slice(7)).digest();
  const b = createHash("sha256").update(attendu).digest();
  return timingSafeEqual(a, b);
}

// Appelé toutes les 30 minutes par GitHub Actions : synchronise la boîte IMAP,
// trie les nouveaux e-mails, puis prépare les brouillons à valider. N'envoie rien.
export async function POST(req: Request) {
  if (!secretValide(req.headers.get("authorization")))
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const debut = Date.now();
  const orgs = (await sql`
    SELECT DISTINCT org_id FROM email_connexions WHERE fournisseur = 'imap'
  `) as { org_id: string }[];

  const resultats: Record<string, unknown>[] = [];

  for (let i = 0; i < orgs.length; i++) {
    if (Date.now() - debut > BUDGET_MS) {
      resultats.push({ organisation: i + 1, ignoree: "budget de temps épuisé" });
      continue;
    }
    const orgId = orgs[i].org_id;
    const ligne: Record<string, unknown> = { organisation: i + 1 };

    try {
      const s = await synchroniserImap(orgId);
      ligne.sync = s.ok ? { lus: s.lus, nouveaux: s.nouveaux } : { erreur: s.error };
    } catch (e) {
      console.error("cron email : sync", e);
      ligne.sync = { erreur: "exception" };
    }

    try {
      const t = await trierEmailsOrganisation(orgId, UTILISATEUR_SYSTEME);
      ligne.tri = t.ok ? { tries: t.tries, echecs: t.echecs } : { erreur: t.error };
    } catch (e) {
      console.error("cron email : tri", e);
      ligne.tri = { erreur: "exception" };
    }

    try {
      const d = await declencherSupport(orgId, UTILISATEUR_SYSTEME);
      ligne.declenchement = d.ok
        ? {
            brouillons_a_valider: d.brouillonsAValider,
            brouillons_prets: d.brouillonsPrets,
            bloques: d.bloques,
            en_attente_humaine: d.enAttente,
            echecs: d.echecs,
          }
        : { erreur: d.error };
    } catch (e) {
      console.error("cron email : declenchement", e);
      ligne.declenchement = { erreur: "exception" };
    }
    if (Date.now() - debut > BUDGET_MS) {
      ligne.suivi = { ignore: "budget de temps épuisé" };
    } else {
      try {
        const s = await traiterSuivis(orgId, UTILISATEUR_SYSTEME);
        ligne.suivi =
          "erreur" in s
            ? { erreur: s.erreur }
            : { exclus: s.exclus, brouillons: s.brouillons, bloques: s.bloques, echecs: s.echecs };
      } catch (e) {
        console.error("cron email : suivi", e);
        ligne.suivi = { erreur: "exception" };
      }
    }

    // Analyse hebdomadaire de Hamza : au plus une fois tous les 7 jours par organisation.
    if (Date.now() - debut > BUDGET_MS) {
      ligne.hamza = { ignore: "budget de temps épuisé" };
    } else {
      try {
        const recente = await sql`
          SELECT 1 FROM analyses_causes
          WHERE org_id = ${orgId} AND created_at > now() - interval '7 days'
          LIMIT 1
        `;
        if (recente[0]) {
          ligne.hamza = { ignore: "analyse récente (moins de 7 jours)" };
        } else {
          const a = await lancerAnalyseHamza(orgId, UTILISATEUR_SYSTEME, 7);
          ligne.hamza = a.ok
            ? { ok: true, nb_emails: a.nbEmails, causes: a.causes }
            : { ignore: a.error, status: a.status };
        }
      } catch (e) {
        console.error("cron email : hamza", e);
        ligne.hamza = { erreur: "exception" };
      }
    }

    resultats.push(ligne);
  }

  return NextResponse.json({ ok: true, organisations: orgs.length, resultats, duree_ms: Date.now() - debut });
}