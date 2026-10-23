import { sql } from "@/lib/db";
import { formatMAD } from "@/lib/catalogue-regle";
import { getBrandkit, brandkitManque, libellesManquants, type Brandkit } from "@/lib/brandkit";
import { calculerFacture, ecartsAvecDevis, lireDevisFacturable, type LigneDevis } from "@/lib/karima-facture";
import { construireUbl, UBL_PROFIL_LIBELLE, type FacturePourUbl } from "@/lib/karima-ubl";

type Ctx = { orgId: string; userId: string };

export type KarimaInput = {
  validationId: number; // devis validé (devis_validations) à facturer
  clientIce?: string;
  clientIdentifiantFiscal?: string;
  clientRc?: string;
  clientAdresse?: string;
  referenceCommande?: string;
};

export type DevisAFacturer = {
  validationId: number;
  salmaRunId: number;
  client: string;
  executionId: number | null;
  totalTtc: number | null;
  devisVersion: string | null;
  factureStatut: string | null; // facture déjà en cours ou validée pour ce devis
  factureNumero: string | null;
  identiteClientComplete: boolean; // ICE et adresse connus dans la fiche client
  clientIce: string | null;
  clientIdentifiantFiscal: string | null;
  clientRc: string | null;
  clientAdresse: string | null;
};


export type KarimaResult = {
  facture_id: number;
  client: string;
  devis_version: string | null;
  total_brut_ht: number;
  remise_montant: number;
  total_net_ht: number;
  tva_pct: number;
  tva_montant: number;
  total_ttc: number;
  client_ice: string;
  compte_client: "existant" | "cree" | "non_enregistre";
};

export type KarimaOutcome = { ok: true; result: KarimaResult } | { ok: false; error: string };

const ICE = /^[0-9]{15}$/;
const nettoyer = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();

// Devis validés par un humain, avec l'état de leur facture et la complétude de l'identité du client.
export async function listerPourKarima(orgId: string): Promise<DevisAFacturer[]> {
  const rows = await sql`
    SELECT v.id, v.salma_run_id, v.client, v.execution_id, a.result,
           f.statut AS facture_statut, f.numero AS facture_numero,
           c.ice AS compte_ice, c.adresse AS compte_adresse,
           c.identifiant_fiscal AS compte_if, c.rc AS compte_rc
    FROM devis_validations v
    JOIN agent_runs a ON a.id = v.salma_run_id AND a.org_id = v.org_id
    LEFT JOIN LATERAL (
      SELECT statut, numero FROM factures
      WHERE org_id = v.org_id AND validation_id = v.id AND statut IN ('brouillon', 'a_valider', 'valide')
      ORDER BY id DESC LIMIT 1
    ) f ON true
    LEFT JOIN LATERAL (
      SELECT ice, adresse, identifiant_fiscal, rc FROM crm_accounts
      WHERE org_id = v.org_id AND lower(name) = lower(v.client)
      ORDER BY id LIMIT 1
    ) c ON true
    WHERE v.org_id = ${orgId} AND v.statut = 'valide'
    ORDER BY v.id DESC
    LIMIT 20
  `;
  return rows.map((row) => {
    const r = (row.result ?? {}) as Record<string, unknown>;
    const ttc = Number(r.total_ttc);
    return {
      validationId: row.id as number,
      salmaRunId: row.salma_run_id as number,
      client: row.client as string,
      executionId: row.execution_id ? Number(row.execution_id) : null,
      totalTtc: Number.isFinite(ttc) ? ttc : null,
      devisVersion: typeof r.version === "string" ? r.version : null,
      factureStatut: (row.facture_statut as string | null) ?? null,
      factureNumero: (row.facture_numero as string | null) ?? null,
      identiteClientComplete: Boolean(row.compte_ice) && Boolean(row.compte_adresse),
      clientIce: (row.compte_ice as string | null) || null,
      clientIdentifiantFiscal: (row.compte_if as string | null) || null,
      clientRc: (row.compte_rc as string | null) || null,
      clientAdresse: (row.compte_adresse as string | null) || null,
    };
  });
}

// Cœur de Karima : établit un brouillon de facture à partir d'un devis validé et le soumet à l'approbation.
// Aucun appel IA, aucun envoi. Le numéro n'est attribué qu'à l'approbation (appliquerDecisionFacture).
export async function executeKarima(
  ctx: Ctx,
  input: KarimaInput
): Promise<{ outcome: KarimaOutcome; agentRunId: number | null }> {
  const { orgId, userId } = ctx;
  const echec = (error: string) => ({ outcome: { ok: false as const, error }, agentRunId: null });

  const validationId = Number(input.validationId);
  if (!Number.isInteger(validationId) || validationId <= 0) return echec("Choisis d'abord un devis validé.");

  const agents = await sql`SELECT id, name FROM agents WHERE slug = 'karima'`;
  const agent = agents[0];
  if (!agent) return echec("Agent introuvable.");
  const agentId = agent.id as number;

  const traceInput = JSON.stringify({ etape: "facture", validation_id: validationId });

  try {
    // 1. Le devis doit être validé et appartenir à l'organisation.
    const vals = await sql`
      SELECT id, salma_run_id, client, execution_id
      FROM devis_validations
      WHERE id = ${validationId} AND org_id = ${orgId} AND statut = 'valide'
    `;
    const val = vals[0];
    if (!val) return echec("Ce devis n'est pas validé ou est introuvable.");
    const salmaRunId = val.salma_run_id as number;

    const src = await sql`SELECT result FROM agent_runs WHERE id = ${salmaRunId} AND org_id = ${orgId}`;
    const lu = lireDevisFacturable(src[0]?.result);
    if (!lu.ok) return echec(`Devis illisible : ${lu.error}`);
    const devis = lu.devis;

    // 2. Recalcul depuis les lignes : la facture doit reprendre exactement les montants validés.
    const calcul = calculerFacture(devis);
    const ecarts = ecartsAvecDevis(devis, calcul);
    if (ecarts.length > 0) {
      return echec(`Les montants du devis ne correspondent pas au recalcul : ${ecarts.slice(0, 3).join(" ; ")}.`);
    }

    // 3. Brand kit de l'organisation (émetteur).
    const kit = await getBrandkit(orgId);
    const manque = brandkitManque(kit, "facture");
    if (!kit || manque.length > 0) {
      return echec(
        `Brand kit incomplet : renseigne dans Paramètres ${manque.length > 0 ? libellesManquants(manque) : "le brand kit"}.`
      );
    }

    // 4. Identité légale du client : fiche existante, complétée par la saisie.
    const comptes = await sql`
      SELECT id, ice, identifiant_fiscal, rc, adresse
      FROM crm_accounts
      WHERE org_id = ${orgId} AND lower(name) = lower(${devis.client})
      ORDER BY id LIMIT 1
    `;
    const compte = comptes[0] as Record<string, unknown> | undefined;
    const saisie = {
      ice: nettoyer(input.clientIce).replace(/\s/g, ""),
      identifiant_fiscal: nettoyer(input.clientIdentifiantFiscal),
      rc: nettoyer(input.clientRc),
      adresse: nettoyer(input.clientAdresse),
    };
    const ice = saisie.ice || String(compte?.ice ?? "");
    const identifiantFiscal = saisie.identifiant_fiscal || String(compte?.identifiant_fiscal ?? "");
    const rc = saisie.rc || String(compte?.rc ?? "");
    const adresse = saisie.adresse || String(compte?.adresse ?? "");
    const referenceCommande = nettoyer(input.referenceCommande);

    if (!ice) return echec(`ICE du client manquant : saisis l'ICE de ${devis.client} pour pouvoir facturer.`);
    if (!ICE.test(ice)) return echec("L'ICE du client comporte 15 chiffres.");
    if (!adresse) return echec(`Adresse du client manquante : saisis l'adresse de ${devis.client}.`);
    if (adresse.length > 300) return echec("Adresse du client trop longue (300 caractères maximum).");
    if (identifiantFiscal.length > 120 || rc.length > 120) return echec("IF ou RC du client trop long (120 caractères maximum).");
    if (referenceCommande.length > 120) return echec("Référence de commande trop longue (120 caractères maximum).");

    // La fiche client est enregistrée pour les factures suivantes. Un échec ici ne bloque pas la facture :
    // l'identité reste copiée sur la facture elle-même.
    let compteId: number | null = compte ? (compte.id as number) : null;
    let compteClient: KarimaResult["compte_client"] = compte ? "existant" : "non_enregistre";
    try {
      if (compte) {
        await sql`
          UPDATE crm_accounts
          SET ice = ${ice}, identifiant_fiscal = ${identifiantFiscal || null}, rc = ${rc || null}, adresse = ${adresse}
          WHERE id = ${compteId} AND org_id = ${orgId}
        `;
      } else {
        const ins = await sql`
          INSERT INTO crm_accounts (name, org_id, ice, identifiant_fiscal, rc, adresse)
          VALUES (${devis.client}, ${orgId}, ${ice}, ${identifiantFiscal || null}, ${rc || null}, ${adresse})
          RETURNING id
        `;
        compteId = ins[0].id as number;
        compteClient = "cree";
      }
    } catch (e) {
      console.error("executeKarima fiche client", e);
    }

    // 5. Version de la facture et trace de l'exécution (aucun jeton, coût nul).
    let version: string | null = null;
    try {
      const n = await sql`SELECT COUNT(*) AS n FROM factures WHERE org_id = ${orgId}`;
      version = `v${Number(n[0].n) + 1}`;
    } catch (e) {
      console.error("executeKarima version", e);
    }

    const run = await sql`
      INSERT INTO agent_runs (org_id, agent_id, user_id, input, result, input_tokens, output_tokens, cost_mad, cost_usd, status)
      VALUES (${orgId}, ${agentId}, ${userId}, ${traceInput}::jsonb,
              ${JSON.stringify({ statut: "Facture en brouillon", client: devis.client, total_ttc: calcul.total_ttc, cost_mad: 0 })}::jsonb,
              0, 0, 0, 0, 'ok')
      RETURNING id
    `;
    const agentRunId = run[0].id as number;

    // 6. Brouillon de facture. Un seul brouillon, en attente ou validé, par devis (index unique).
    const emetteur = { ...kit };
    const ins = await sql`
      INSERT INTO factures (
        org_id, salma_run_id, validation_id, execution_id, client, client_account_id,
        client_ice, client_identifiant_fiscal, client_rc, client_adresse,
        emetteur, lignes, remise_pct, total_brut_ht, remise_montant, total_ht, total_tva, total_ttc, tva_detail,
        devise, reference_commande, devis_version, statut, agent_run_id, version, created_by
      ) VALUES (
        ${orgId}, ${salmaRunId}, ${validationId}, ${val.execution_id ?? null}, ${devis.client}, ${compteId},
        ${ice}, ${identifiantFiscal || null}, ${rc || null}, ${adresse},
        ${JSON.stringify(emetteur)}::jsonb, ${JSON.stringify(calcul.lignes)}::jsonb, ${calcul.remise_pct},
        ${calcul.total_brut_ht}, ${calcul.remise_montant}, ${calcul.total_net_ht}, ${calcul.tva_montant}, ${calcul.total_ttc},
        ${JSON.stringify(calcul.tva_detail)}::jsonb,
        'MAD', ${referenceCommande || null}, ${devis.version}, 'brouillon', ${agentRunId}, ${version}, ${userId}
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `;
    if (!ins[0]) return { outcome: { ok: false, error: "Ce devis a déjà une facture en cours ou validée." }, agentRunId };
    const factureId = ins[0].id as number;

    // 7. Approbation humaine. Sans elle, le brouillon est supprimé pour permettre une nouvelle tentative.
    // Le payload ne porte ni execution_id ni node_key : aucun événement « étape validée » n'est émis.
    try {
      const payload = {
        source: "Proposé par Agent Karima · Facturation",
        aiReco: "Valider la facture : montants repris du devis validé (aucun envoi automatique)",
        chips: ["Prospect to Cash", `${formatMAD(calcul.total_ttc)} MAD TTC`],
        extractTitle: `Facture · ${devis.client}`,
        extract:
          `${devis.client} (ICE ${ice}).\n` +
          `${calcul.lignes.length} ligne(s), total HT avant remise ${formatMAD(calcul.total_brut_ht)} MAD, ` +
          `remise ${formatMAD(calcul.remise_montant)} MAD, net HT ${formatMAD(calcul.total_net_ht)} MAD.\n` +
          `TVA ${String(calcul.tva_pct).replace(".", ",")} % : ${formatMAD(calcul.tva_montant)} MAD. ` +
          `Total TTC : ${formatMAD(calcul.total_ttc)} MAD.`,
        props: [
          { k: "Client", v: devis.client },
          { k: "Devis", v: devis.version ?? `n° ${salmaRunId}` },
          { k: "Total TTC", v: `${formatMAD(calcul.total_ttc)} MAD` },
          { k: "Numéro", v: "Attribué à la validation" },
        ],
        lineage: ["Devis validé par un humain", "Facture établie par Karima", "Validation humaine"],
        facture_id: factureId,
      };
      await sql`
        INSERT INTO approvals (title, tag, agent_id, agent_label, payload, org_id)
        VALUES (${`Validation de la facture · ${devis.client}`}, 'Validation de la facture', ${agentId},
                ${agent.name as string}, ${JSON.stringify(payload)}::jsonb, ${orgId})
      `;
      await sql`UPDATE factures SET statut = 'a_valider' WHERE id = ${factureId} AND org_id = ${orgId} AND statut = 'brouillon'`;
    } catch (e) {
      console.error("executeKarima approbation", e);
      try {
        await sql`DELETE FROM factures WHERE id = ${factureId} AND org_id = ${orgId} AND statut = 'brouillon'`;
      } catch {}
      return { outcome: { ok: false, error: "La facture n'a pas pu être soumise à l'approbation. Réessaie dans un instant." }, agentRunId };
    }

    try {
      await sql`
        INSERT INTO agent_execution_history (agent_id, exec_date, description, status, org_id)
        VALUES (${agentId}, CURRENT_DATE, ${`Facture · ${devis.client} — en attente de validation`}, 'En attente', ${orgId})
      `;
    } catch (e) {
      console.error("executeKarima historique", e);
    }

    return {
      outcome: {
        ok: true,
        result: {
          facture_id: factureId,
          client: devis.client,
          devis_version: devis.version,
          total_brut_ht: calcul.total_brut_ht,
          remise_montant: calcul.remise_montant,
          total_net_ht: calcul.total_net_ht,
          tva_pct: calcul.tva_pct,
          tva_montant: calcul.tva_montant,
          total_ttc: calcul.total_ttc,
          client_ice: ice,
          compte_client: compteClient,
        },
      },
      agentRunId,
    };
  } catch (e) {
    console.error("executeKarima", e);
    try {
      await sql`
        INSERT INTO agent_runs (org_id, agent_id, user_id, input, status, error)
        VALUES (${orgId}, ${agentId}, ${userId}, ${traceInput}::jsonb,
                'erreur', ${e instanceof Error ? e.message.slice(0, 500) : "inconnue"})
      `;
    } catch {}
    return echec("La facture n'a pas pu être préparée. Réessaie dans un instant.");
  }
}

// Suite de la décision humaine (appelée par resolveApproval). Approbation : numéro AAAA-NNNN, date d'émission
// et échéance, attribués en UNE instruction (aucun trou de numérotation). Rejet : facture « rejete », sans numéro.
export async function appliquerDecisionFacture(a: {
  orgId: string;
  userId: string;
  factureId: number;
  decision: "approuve" | "rejete";
}): Promise<{ ok: true; numero: string | null } | { ok: false; error: string }> {
  const { orgId, userId, factureId, decision } = a;

  if (decision === "rejete") {
    await sql`
      UPDATE factures SET statut = 'rejete', decided_by = ${userId}, decided_at = now()
      WHERE id = ${factureId} AND org_id = ${orgId} AND statut = 'a_valider'
    `;
    return { ok: true, numero: null };
  }

  const rows = await sql`
    WITH cible AS (
      SELECT id FROM factures WHERE id = ${factureId} AND org_id = ${orgId} AND statut = 'a_valider'
    ),
    jour AS (
      SELECT (now() AT TIME ZONE 'Africa/Casablanca')::date AS d
    ),
    num AS (
      INSERT INTO facture_sequences (org_id, annee, dernier)
      SELECT ${orgId}, EXTRACT(YEAR FROM jour.d)::int, 1 FROM cible, jour
      ON CONFLICT (org_id, annee) DO UPDATE SET dernier = facture_sequences.dernier + 1
      RETURNING annee, dernier
    )
    UPDATE factures f
    SET statut = 'valide',
        annee = num.annee,
        seq = num.dernier,
        numero = num.annee::text || '-' || lpad(num.dernier::text, 4, '0'),
        date_emission = (SELECT d FROM jour),
        date_echeance = (SELECT d FROM jour)
          + COALESCE((SELECT delai_paiement_jours FROM facture_parametres WHERE org_id = ${orgId}), 30),
        decided_by = ${userId},
        decided_at = now()
    FROM num
    WHERE f.id = ${factureId} AND f.org_id = ${orgId} AND f.statut = 'a_valider'
    RETURNING f.numero, f.client, f.agent_run_id
  `;
  const f = rows[0];
  if (!f) return { ok: false, error: "Facture introuvable ou déjà décidée." };

  try {
    const ag = await sql`SELECT id, name, output_label FROM agents WHERE slug = 'karima'`;
    if (ag[0]) {
      const agentId = ag[0].id as number;
      await sql`
        INSERT INTO agent_execution_history (agent_id, exec_date, description, status, org_id)
        VALUES (${agentId}, CURRENT_DATE, ${`Facture ${f.numero as string} · ${f.client as string} — validée`}, 'Terminé', ${orgId})
      `;
      await sql`
        INSERT INTO deliverables (title, agent_id, kind, version, agent_label, origin, currency, cost, org_id)
        VALUES (${`Facture ${f.numero as string} — ${f.client as string}`}, ${agentId}, 'doc', 'v1',
                ${ag[0].name as string}, 'Agent Studio', 'MAD', '0.0000', ${orgId})
      `;
    }
  } catch (e) {
    console.error("appliquerDecisionFacture trace", e);
  }
  // XML de la facture : un échec n'annule jamais la validation (il sera régénéré au téléchargement).
  try {
    await genererEtEnregistrerXml(orgId, factureId);
  } catch (e) {
    console.error("appliquerDecisionFacture xml", e);
  }
  return { ok: true, numero: f.numero as string };
}
// Génère le XML UBL d'une facture validée et l'enregistre (statut de transmission « non_transmise »).
// Le fichier d'une facture déjà soumise à une plateforme n'est jamais écrasé.
async function genererEtEnregistrerXml(orgId: string, factureId: number): Promise<{ numero: string; xml: string } | null> {
  const rows = await sql`
    SELECT numero, to_char(date_emission, 'YYYY-MM-DD') AS date_emission,
           to_char(date_echeance, 'YYYY-MM-DD') AS date_echeance,
           devise, reference_commande, devis_version, emetteur, lignes, client,
           client_ice, client_identifiant_fiscal, client_rc, client_adresse,
           remise_pct, total_brut_ht, remise_montant, total_ht, total_tva, total_ttc, tva_detail
    FROM factures
    WHERE id = ${factureId} AND org_id = ${orgId} AND statut = 'valide'
  `;
  const f = rows[0];
  if (!f) return null;

  const detail = Array.isArray(f.tva_detail) ? (f.tva_detail as { taux?: unknown }[]) : [];
  const tauxTva = Number(detail[0]?.taux);
  if (!Number.isFinite(tauxTva)) throw new Error("Taux de TVA illisible sur la facture.");

  const facture: FacturePourUbl = {
    numero: String(f.numero),
    date_emission: String(f.date_emission),
    date_echeance: String(f.date_echeance),
    devise: String(f.devise ?? "MAD"),
    reference_commande: (f.reference_commande as string | null) ?? null,
    devis_version: (f.devis_version as string | null) ?? null,
    emetteur: f.emetteur as Brandkit,
    client: {
      nom: String(f.client),
      ice: String(f.client_ice ?? ""),
      identifiant_fiscal: (f.client_identifiant_fiscal as string | null) ?? null,
      rc: (f.client_rc as string | null) ?? null,
      adresse: String(f.client_adresse ?? ""),
    },
    lignes: f.lignes as LigneDevis[],
    total_brut_ht: Number(f.total_brut_ht),
    remise_pct: Number(f.remise_pct),
    remise_montant: Number(f.remise_montant),
    total_net_ht: Number(f.total_ht),
    tva_pct: tauxTva,
    tva_montant: Number(f.total_tva),
    total_ttc: Number(f.total_ttc),
  };
  const xml = construireUbl(facture);

  await sql`
    INSERT INTO facture_transmissions (org_id, facture_id, fournisseur, statut, xml, xml_profil)
    VALUES (${orgId}, ${factureId}, 'dgi', 'non_transmise', ${xml}, ${UBL_PROFIL_LIBELLE})
    ON CONFLICT (facture_id, fournisseur) DO UPDATE
      SET xml = EXCLUDED.xml, xml_profil = EXCLUDED.xml_profil, updated_at = now()
      WHERE facture_transmissions.statut = 'non_transmise'
  `;
  return { numero: String(f.numero), xml };
}

// XML d'une facture validée : celui déjà enregistré, sinon généré à la demande.
export async function xmlDeLaFacture(orgId: string, factureId: number): Promise<{ numero: string; xml: string } | null> {
  const ex = await sql`
    SELECT f.numero, t.xml
    FROM facture_transmissions t
    JOIN factures f ON f.id = t.facture_id AND f.org_id = t.org_id
    WHERE t.facture_id = ${factureId} AND t.org_id = ${orgId} AND t.fournisseur = 'dgi' AND t.xml IS NOT NULL
  `;
  if (ex[0]) return { numero: String(ex[0].numero), xml: String(ex[0].xml) };
  return genererEtEnregistrerXml(orgId, factureId);
}