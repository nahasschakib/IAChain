import { sql } from "@/lib/db";
import type { Brandkit } from "@/lib/brandkit-regle";
import type { LigneDevis } from "@/lib/karima-facture";

export type FactureResume = {
  id: number;
  numero: string | null;
  client: string;
  statut: string; // brouillon | a_valider | valide | rejete
  total_ttc: number;
  date_emission: string | null; // AAAA-MM-JJ
  devis_version: string | null;
};

export type FactureDetail = FactureResume & {
  date_echeance: string | null;
  devise: string;
  reference_commande: string | null;
  emetteur: Brandkit;
  client_ice: string | null;
  client_identifiant_fiscal: string | null;
  client_rc: string | null;
  client_adresse: string | null;
  lignes: LigneDevis[];
  remise_pct: number;
  total_brut_ht: number;
  remise_montant: number;
  total_net_ht: number;
  tva_pct: number;
  total_tva: number;
  controle: { verdict?: string; derogation_couverte?: boolean; politique_version?: number | null } | null;
  transmission: { statut: string; xml_profil: string | null; a_xml: boolean } | null;
};

const num = (v: unknown) => Number(v ?? 0);

// Les plus récentes d'abord, toutes les factures de l'organisation (brouillons et rejetées comprises).
export async function listerFactures(orgId: string): Promise<FactureResume[]> {
  const rows = await sql`
    SELECT id, numero, client, statut, total_ttc, devis_version,
           to_char(date_emission, 'YYYY-MM-DD') AS date_emission
    FROM factures
    WHERE org_id = ${orgId}
    ORDER BY id DESC
    LIMIT 100
  `;
  return rows.map((r) => ({
    id: Number(r.id),
    numero: (r.numero as string | null) ?? null,
    client: String(r.client),
    statut: String(r.statut),
    total_ttc: num(r.total_ttc),
    date_emission: (r.date_emission as string | null) ?? null,
    devis_version: (r.devis_version as string | null) ?? null,
  }));
}

export async function chargerFacture(orgId: string, id: number): Promise<FactureDetail | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const rows = await sql`
    SELECT f.id, f.numero, f.client, f.statut, f.total_ttc, f.devis_version, f.devise, f.reference_commande,
           f.emetteur, f.client_ice, f.client_identifiant_fiscal, f.client_rc, f.client_adresse, f.lignes,
           f.remise_pct, f.total_brut_ht, f.remise_montant, f.total_ht, f.total_tva, f.tva_detail, f.controle,
           to_char(f.date_emission, 'YYYY-MM-DD') AS date_emission,
           to_char(f.date_echeance, 'YYYY-MM-DD') AS date_echeance,
           t.statut AS t_statut, t.xml_profil AS t_profil, (t.xml IS NOT NULL) AS t_a_xml
    FROM factures f
    LEFT JOIN facture_transmissions t
      ON t.facture_id = f.id AND t.org_id = f.org_id AND t.fournisseur = 'dgi'
    WHERE f.id = ${id} AND f.org_id = ${orgId}
  `;
  const r = rows[0];
  if (!r) return null;
  const detail = Array.isArray(r.tva_detail) ? (r.tva_detail as { taux?: unknown }[]) : [];
  return {
    id: Number(r.id),
    numero: (r.numero as string | null) ?? null,
    client: String(r.client),
    statut: String(r.statut),
    total_ttc: num(r.total_ttc),
    date_emission: (r.date_emission as string | null) ?? null,
    date_echeance: (r.date_echeance as string | null) ?? null,
    devis_version: (r.devis_version as string | null) ?? null,
    devise: String(r.devise ?? "MAD"),
    reference_commande: (r.reference_commande as string | null) ?? null,
    emetteur: (r.emetteur ?? {}) as Brandkit,
    client_ice: (r.client_ice as string | null) ?? null,
    client_identifiant_fiscal: (r.client_identifiant_fiscal as string | null) ?? null,
    client_rc: (r.client_rc as string | null) ?? null,
    client_adresse: (r.client_adresse as string | null) ?? null,
    lignes: Array.isArray(r.lignes) ? (r.lignes as LigneDevis[]) : [],
    remise_pct: num(r.remise_pct),
    total_brut_ht: num(r.total_brut_ht),
    remise_montant: num(r.remise_montant),
    total_net_ht: num(r.total_ht),
    tva_pct: num(detail[0]?.taux),
    total_tva: num(r.total_tva),
    controle: (r.controle ?? null) as FactureDetail["controle"],
    transmission: r.t_statut
      ? { statut: String(r.t_statut), xml_profil: (r.t_profil as string | null) ?? null, a_xml: Boolean(r.t_a_xml) }
      : null,
  };
}