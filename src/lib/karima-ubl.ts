// Export XML UBL 2.1 d'une facture validée de Karima. Aucun accès base, aucune IA.
// Profil DGI non publié : fichier NON transmissible à la plateforme, il sert à valider le modèle de données.
import type { Brandkit } from "@/lib/brandkit-regle";
import type { LigneDevis } from "@/lib/karima-facture";

export const UBL_CUSTOMIZATION_ID = "urn:iachain:ma:facture-electronique:ubl-2.1:profil-dgi-non-publie";
export const UBL_PROFILE_ID = "iachain-ma-non-officiel";
export const UBL_PROFIL_LIBELLE = "UBL 2.1 · profil DGI non publié";

export type FacturePourUbl = {
  numero: string;
  date_emission: string; // AAAA-MM-JJ
  date_echeance: string; // AAAA-MM-JJ
  devise: string;
  reference_commande: string | null;
  devis_version: string | null;
  emetteur: Brandkit;
  client: { nom: string; ice: string; identifiant_fiscal: string | null; rc: string | null; adresse: string };
  lignes: LigneDevis[];
  total_brut_ht: number;
  remise_pct: number;
  remise_montant: number;
  total_net_ht: number;
  tva_pct: number;
  tva_montant: number;
  total_ttc: number;
};

const cts = (n: number) => Math.round(n * 100);
const m2 = (n: number) => n.toFixed(2);
const qte = (n: number) => String(Number(n.toFixed(4)));
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Échappement XML complet, avec retrait des caractères de contrôle interdits.
function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Codes d'unité UN/ECE Rec. 20 (à valider avant toute transmission).
function codeUnite(unite: string): string {
  const u = unite.trim().toLowerCase();
  if (u === "forfait") return "LS";
  if (u === "jour" || u === "jours") return "DAY";
  if (u === "mois") return "MON";
  if (u === "heure" || u === "heures") return "HUR";
  return "C62";
}

const categorieTva = (pct: number, indent: string) =>
  `${indent}<cac:TaxCategory>\n` +
  `${indent}  <cbc:ID>${pct > 0 ? "S" : "Z"}</cbc:ID>\n` +
  `${indent}  <cbc:Percent>${m2(pct)}</cbc:Percent>\n` +
  `${indent}  <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>\n` +
  `${indent}</cac:TaxCategory>\n`;

function controleCoherence(f: FacturePourUbl): void {
  const somme = f.lignes.reduce((s, l) => s + cts(l.total_ht), 0);
  if (somme !== cts(f.total_brut_ht)) throw new Error("Les lignes ne totalisent pas le HT avant remise.");
  if (cts(f.total_brut_ht) - cts(f.remise_montant) !== cts(f.total_net_ht)) throw new Error("Remise et net HT incohérents.");
  if (cts(f.total_net_ht) + cts(f.tva_montant) !== cts(f.total_ttc)) throw new Error("Net HT, TVA et TTC incohérents.");
  if (f.lignes.length === 0) throw new Error("Aucune ligne de facture.");
  if (!f.numero) throw new Error("Numéro de facture manquant.");
  if (!DATE.test(f.date_emission) || !DATE.test(f.date_echeance)) throw new Error("Dates de facture invalides.");
  if (!/^[0-9]{15}$/.test(f.client.ice)) throw new Error("ICE du client invalide.");
  if (!f.emetteur.ice || !f.emetteur.raison_sociale) throw new Error("Identité de l'émetteur incomplète.");
}

function adresse(rue: string | null, ville: string | null, cp: string | null, pays: string | null, indent: string): string {
  const marocain = (pays ?? "Maroc").trim().toLowerCase() === "maroc";
  const pays_xml = pays || marocain
    ? marocain
      ? `${indent}  <cac:Country><cbc:IdentificationCode>MA</cbc:IdentificationCode></cac:Country>\n`
      : `${indent}  <cac:Country><cbc:Name>${esc(pays)}</cbc:Name></cac:Country>\n`
    : "";
  return (
    `${indent}<cac:PostalAddress>\n` +
    (rue ? `${indent}  <cbc:StreetName>${esc(rue)}</cbc:StreetName>\n` : "") +
    (ville ? `${indent}  <cbc:CityName>${esc(ville)}</cbc:CityName>\n` : "") +
    (cp ? `${indent}  <cbc:PostalZone>${esc(cp)}</cbc:PostalZone>\n` : "") +
    pays_xml +
    `${indent}</cac:PostalAddress>\n`
  );
}

export function construireUbl(f: FacturePourUbl): string {
  controleCoherence(f);
  const e = f.emetteur;
  const dev = esc(f.devise || "MAD");
  const montant = (tag: string, v: number) => `<cbc:${tag} currencyID="${dev}">${m2(v)}</cbc:${tag}>`;

  const emetteur =
    `  <cac:AccountingSupplierParty>\n    <cac:Party>\n` +
    `      <cac:PartyIdentification><cbc:ID schemeID="ICE">${esc(e.ice)}</cbc:ID></cac:PartyIdentification>\n` +
    (e.nom_commercial ? `      <cac:PartyName><cbc:Name>${esc(e.nom_commercial)}</cbc:Name></cac:PartyName>\n` : "") +
    adresse(e.adresse, e.ville, e.code_postal, e.pays, "      ") +
    (e.identifiant_fiscal
      ? `      <cac:PartyTaxScheme>\n        <cbc:RegistrationName>${esc(e.raison_sociale)}</cbc:RegistrationName>\n` +
        `        <cbc:CompanyID>${esc(e.identifiant_fiscal)}</cbc:CompanyID>\n` +
        `        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>\n      </cac:PartyTaxScheme>\n`
      : "") +
    `      <cac:PartyLegalEntity>\n        <cbc:RegistrationName>${esc(e.raison_sociale)}</cbc:RegistrationName>\n` +
    (e.rc ? `        <cbc:CompanyID schemeID="RC">${esc(e.rc)}</cbc:CompanyID>\n` : "") +
    (e.forme_juridique ? `        <cbc:CompanyLegalForm>${esc(e.forme_juridique)}</cbc:CompanyLegalForm>\n` : "") +
    (e.capital_social !== null && e.capital_social !== undefined
      ? `        <cbc:CorporateStockAmount currencyID="${dev}">${m2(e.capital_social)}</cbc:CorporateStockAmount>\n`
      : "") +
    `      </cac:PartyLegalEntity>\n` +
    (e.telephone || e.email_contact
      ? `      <cac:Contact>\n` +
        (e.telephone ? `        <cbc:Telephone>${esc(e.telephone)}</cbc:Telephone>\n` : "") +
        (e.email_contact ? `        <cbc:ElectronicMail>${esc(e.email_contact)}</cbc:ElectronicMail>\n` : "") +
        `      </cac:Contact>\n`
      : "") +
    `    </cac:Party>\n  </cac:AccountingSupplierParty>\n`;

  const c = f.client;
  const client =
    `  <cac:AccountingCustomerParty>\n    <cac:Party>\n` +
    `      <cac:PartyIdentification><cbc:ID schemeID="ICE">${esc(c.ice)}</cbc:ID></cac:PartyIdentification>\n` +
    adresse(c.adresse, null, null, null, "      ") +
    (c.identifiant_fiscal
      ? `      <cac:PartyTaxScheme>\n        <cbc:RegistrationName>${esc(c.nom)}</cbc:RegistrationName>\n` +
        `        <cbc:CompanyID>${esc(c.identifiant_fiscal)}</cbc:CompanyID>\n` +
        `        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>\n      </cac:PartyTaxScheme>\n`
      : "") +
    `      <cac:PartyLegalEntity>\n        <cbc:RegistrationName>${esc(c.nom)}</cbc:RegistrationName>\n` +
    (c.rc ? `        <cbc:CompanyID schemeID="RC">${esc(c.rc)}</cbc:CompanyID>\n` : "") +
    `      </cac:PartyLegalEntity>\n    </cac:Party>\n  </cac:AccountingCustomerParty>\n`;

  const paiement = e.rib
    ? `  <cac:PaymentMeans>\n    <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>\n` +
      `    <cac:PayeeFinancialAccount>\n      <cbc:ID>${esc(e.rib)}</cbc:ID>\n` +
      (e.banque ? `      <cac:FinancialInstitutionBranch><cbc:Name>${esc(e.banque)}</cbc:Name></cac:FinancialInstitutionBranch>\n` : "") +
      `    </cac:PayeeFinancialAccount>\n  </cac:PaymentMeans>\n`
    : "";

  const remise =
    cts(f.remise_montant) > 0
      ? `  <cac:AllowanceCharge>\n    <cbc:ChargeIndicator>false</cbc:ChargeIndicator>\n` +
        `    <cbc:AllowanceChargeReason>Remise commerciale</cbc:AllowanceChargeReason>\n` +
        `    <cbc:MultiplierFactorNumeric>${m2(f.remise_pct)}</cbc:MultiplierFactorNumeric>\n` +
        `    ${montant("Amount", f.remise_montant)}\n    ${montant("BaseAmount", f.total_brut_ht)}\n` +
        categorieTva(f.tva_pct, "    ") +
        `  </cac:AllowanceCharge>\n`
      : "";

  const lignes = f.lignes
    .map(
      (l, i) =>
        `  <cac:InvoiceLine>\n    <cbc:ID>${i + 1}</cbc:ID>\n` +
        `    <cbc:InvoicedQuantity unitCode="${codeUnite(l.unite)}">${qte(l.quantite)}</cbc:InvoicedQuantity>\n` +
        `    ${montant("LineExtensionAmount", l.total_ht)}\n    <cac:Item>\n` +
        (l.description ? `      <cbc:Description>${esc(l.description)}</cbc:Description>\n` : "") +
        `      <cbc:Name>${esc(l.libelle)}</cbc:Name>\n` +
        categorieTva(f.tva_pct, "      ").replace("cac:TaxCategory", "cac:ClassifiedTaxCategory").replace("/cac:TaxCategory", "/cac:ClassifiedTaxCategory") +
        `    </cac:Item>\n    <cac:Price>\n      ${montant("PriceAmount", l.prix_unitaire_ht)}\n    </cac:Price>\n  </cac:InvoiceLine>\n`
    )
    .join("");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"\n` +
    `         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"\n` +
    `         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">\n` +
    `  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>\n` +
    `  <cbc:CustomizationID>${UBL_CUSTOMIZATION_ID}</cbc:CustomizationID>\n` +
    `  <cbc:ProfileID>${UBL_PROFILE_ID}</cbc:ProfileID>\n` +
    `  <cbc:ID>${esc(f.numero)}</cbc:ID>\n` +
    `  <cbc:IssueDate>${f.date_emission}</cbc:IssueDate>\n` +
    `  <cbc:DueDate>${f.date_echeance}</cbc:DueDate>\n` +
    `  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>\n` +
    `  <cbc:Note>Profil DGI non publié : fichier non transmissible à la plateforme.${f.devis_version ? ` Devis ${esc(f.devis_version)}.` : ""}</cbc:Note>\n` +
    `  <cbc:DocumentCurrencyCode>${dev}</cbc:DocumentCurrencyCode>\n` +
    (f.reference_commande ? `  <cac:OrderReference><cbc:ID>${esc(f.reference_commande)}</cbc:ID></cac:OrderReference>\n` : "") +
    emetteur +
    client +
    paiement +
    `  <cac:PaymentTerms><cbc:Note>Échéance le ${f.date_echeance}</cbc:Note></cac:PaymentTerms>\n` +
    remise +
    `  <cac:TaxTotal>\n    ${montant("TaxAmount", f.tva_montant)}\n    <cac:TaxSubtotal>\n` +
    `      ${montant("TaxableAmount", f.total_net_ht)}\n      ${montant("TaxAmount", f.tva_montant)}\n` +
    categorieTva(f.tva_pct, "      ") +
    `    </cac:TaxSubtotal>\n  </cac:TaxTotal>\n` +
    `  <cac:LegalMonetaryTotal>\n` +
    `    ${montant("LineExtensionAmount", f.total_brut_ht)}\n    ${montant("TaxExclusiveAmount", f.total_net_ht)}\n` +
    `    ${montant("TaxInclusiveAmount", f.total_ttc)}\n    ${montant("AllowanceTotalAmount", f.remise_montant)}\n` +
    `    ${montant("PayableAmount", f.total_ttc)}\n  </cac:LegalMonetaryTotal>\n` +
    lignes +
    `</Invoice>\n`
  );
}