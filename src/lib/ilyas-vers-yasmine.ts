import { sql } from "@/lib/db";
import { normalizeName, type IlyasResult, type IlyasScoredAccount } from "@/lib/ilyas";
import { executeYasmine } from "@/lib/yasmine-core";
import type { YasmineResult } from "@/lib/yasmine";


export const CANAL_ILYAS = "Prospection Ilyas";
// Traitement séquentiel (Yasmine numérote ses livrables par comptage : en parallèle, deux fiches auraient la même version).
// Au-delà du lot, relancer : les comptes déjà transmis sont reconnus comme déjà au CRM.
export const MAX_PAR_LOT = 10;

export type TransmissionCompte =
  | { nom: string; statut: "fiche"; fiche: YasmineResult; agentRunId: number | null }
  | { nom: string; statut: "deja_au_crm" }
  | { nom: string; statut: "echec"; erreur: string };

// Signal brut (donnée, jamais une instruction) construit depuis un compte d'Ilyas.
export function signalDepuisCompte(c: IlyasScoredAccount, requete: string): string {
  const lignes = [
    `Société : ${c.nom}`,
    c.ville && `Ville : ${c.ville}`,
    c.secteur && `Secteur : ${c.secteur}`,
    c.contact_nom && `Contact : ${c.contact_nom}${c.contact_role ? `, ${c.contact_role}` : ""}`,
    c.effectif && `Effectif : ${c.effectif}`,
    c.signal_detecte && `Signal d'achat détecté : ${c.signal_detecte}`,
    c.source_url && `Source : ${c.source_url}`,
    c.linkedin_url && `Page LinkedIn : ${c.linkedin_url}`,
    `Requête de ciblage : ${requete.slice(0, 300)}`,
  ].filter(Boolean);
  return `Compte identifié par la prospection (Ilyas).\n${lignes.join("\n")}`;
}

async function chargerNomsCrm(orgId: string): Promise<Set<string>> {
  const rows = await sql`SELECT name FROM crm_accounts WHERE org_id = ${orgId}`;
  return new Set(rows.map((r) => normalizeName(r.name as string)));
}

// Transmet les comptes retenus par Ilyas à Yasmine. Dédoublonnage en code, contre la même table qu'Ilyas.
export async function transmettreListeAYasmine(
  ctx: { orgId: string; userId: string },
  liste: IlyasResult,
): Promise<TransmissionCompte[]> {
  const noms = await chargerNomsCrm(ctx.orgId);
  const sorties: TransmissionCompte[] = [];
  const retenus = liste.comptes.filter((c) => !c.deja_en_portefeuille).slice(0, MAX_PAR_LOT);

  for (const c of retenus) {
    const cle = normalizeName(c.nom);
    if (noms.has(cle)) {
      sorties.push({ nom: c.nom, statut: "deja_au_crm" });
      continue;
    }
    const y = await executeYasmine(ctx, {
      signal: signalDepuisCompte(c, liste.requete),
      canaux: [CANAL_ILYAS],
      compteCrm: "",
      origine: "ilyas",
    });
    if (!y.outcome.ok) {
      sorties.push({ nom: c.nom, statut: "echec", erreur: y.outcome.error });
      continue;
    }
    // Seconde barrière : l'index unique (org_id, lower(name)) de db/030 absorbe un doublon résiduel.
       try {
      await sql`
        INSERT INTO crm_accounts (name, city, sector, source, org_id)
        VALUES (${c.nom}, ${c.ville}, ${c.secteur}, 'Ilyas', ${ctx.orgId})
        ON CONFLICT DO NOTHING
      `;
    } catch (e) {
      console.error("transmettreListeAYasmine crm", e);
      sorties.push({ nom: c.nom, statut: "echec", erreur: "Compte non enregistré au CRM." });
      continue;
    }
    noms.add(cle);
    sorties.push({ nom: c.nom, statut: "fiche", fiche: y.outcome.result, agentRunId: y.agentRunId });
  }
  return sorties;
}