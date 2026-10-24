import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import ImprimerBouton from "@/components/factures/ImprimerBouton";
import { getTenantContext } from "@/lib/tenant";
import { chargerFacture } from "@/lib/factures";
import { montantEnLettres } from "@/lib/montant-lettres";

export const dynamic = "force-dynamic";

const CARD_SHADOW = "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)";
const mad = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = (iso: string | null) => (iso ? iso.split("-").reverse().join("/") : "—");
const taux = (n: number) => String(n).replace(".", ",");
// RIB marocain : code banque (3), code ville (3), numéro de compte (16), clé (2).
const rib = (r: string | null) => (r && /^\d{24}$/.test(r) ? `${r.slice(0, 3)} ${r.slice(3, 6)} ${r.slice(6, 22)} ${r.slice(22)}` : r ?? "");

const PRINT_CSS = `@page { size: A4; margin: 14mm; }
@media print {
  html, body { background: #fff !important; }
  body * { visibility: hidden !important; }
  #facture-doc, #facture-doc * { visibility: visible !important; }
  #facture-doc { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; border-radius: 0 !important; padding: 0 !important; }
}`;

const petit = { fontSize: 12, color: "#475569", lineHeight: 1.5 } as const;
const th = { textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", padding: "6px 8px", borderBottom: "1px solid #cbd5e1" } as const;
const td = { fontSize: 13, padding: "8px", borderBottom: "1px solid #e2e8f0", verticalAlign: "top" } as const;

export default async function FacturePage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { orgId, isOrgAdmin } = await getTenantContext();
  if (!isOrgAdmin) notFound();
  const { id } = await params;
  const f = await chargerFacture(orgId, Number(id));
  if (!f) notFound();

  const e = f.emetteur;
  const valide = f.statut === "valide";
  const ligneFiscale = (libelle: string, v: string | null | undefined) => (v ? <div style={petit}>{libelle} : {v}</div> : null);

  return (
    <AppShell
      topbar={
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
          <Link href="/factures" style={{ color: "var(--graphite)", textDecoration: "none", fontWeight: 400 }}>
            Factures ·{" "}
          </Link>
          {f.numero ?? "Brouillon"}
        </span>
      }
    >
      <style>{PRINT_CSS}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 820 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <ImprimerBouton />
          {valide && f.transmission?.a_xml !== false && (
            <a
              href={`/api/karima/xml?facture_id=${f.id}`}
              style={{ fontSize: 13, fontWeight: 600, color: "var(--steel-deep)", border: "1px solid var(--line)", borderRadius: 8, padding: "9px 16px", textDecoration: "none" }}
            >
              Télécharger le XML
            </a>
          )}
        </div>

        <div id="facture-doc" style={{ background: "#fff", color: "#0f172a", border: "1px solid var(--line)", borderRadius: 14, padding: "32px 36px", boxShadow: CARD_SHADOW }}>
          {!valide && (
            <div style={{ border: "2px solid #b3261e", color: "#b3261e", borderRadius: 8, padding: "8px 12px", fontWeight: 700, fontSize: 13, marginBottom: 20 }}>
              {f.statut === "rejete" ? "FACTURE REJETÉE" : "BROUILLON"} : ce document n&apos;est pas une facture valable.
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", gap: 24, marginBottom: 28 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{e.raison_sociale}</div>
              {e.nom_commercial && e.nom_commercial !== e.raison_sociale && <div style={petit}>{e.nom_commercial}</div>}
              {(e.forme_juridique || e.capital_social !== null) && (
                <div style={petit}>
                  {e.forme_juridique}
                  {e.capital_social !== null && e.capital_social !== undefined ? ` · capital ${mad(Number(e.capital_social))} ${f.devise}` : ""}
                </div>
              )}
              <div style={petit}>{[e.adresse, [e.code_postal, e.ville].filter(Boolean).join(" ")].filter(Boolean).join(", ")}</div>
              {ligneFiscale("ICE", e.ice)}
              {ligneFiscale("IF", e.identifiant_fiscal)}
              {ligneFiscale("RC", e.rc ? `${e.rc}${e.rc_tribunal ? ` (${e.rc_tribunal})` : ""}` : null)}
              {ligneFiscale("Taxe professionnelle", e.taxe_professionnelle)}
              {ligneFiscale("CNSS", e.cnss)}
              {ligneFiscale("Tél.", e.telephone)}
              {ligneFiscale("E-mail", e.email_contact)}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700, fontSize: 22, letterSpacing: "0.04em" }}>FACTURE</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{f.numero ?? "—"}</div>
              <div style={petit}>Émise le {date(f.date_emission)}</div>
              <div style={petit}>Échéance : {date(f.date_echeance)}</div>
              {f.reference_commande && <div style={petit}>Votre commande : {f.reference_commande}</div>}
              {f.devis_version && <div style={petit}>Devis {f.devis_version}</div>}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>FACTURÉ À</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{f.client}</div>
            {f.client_adresse && <div style={petit}>{f.client_adresse}</div>}
            {ligneFiscale("ICE", f.client_ice)}
            {ligneFiscale("IF", f.client_identifiant_fiscal)}
            {ligneFiscale("RC", f.client_rc)}
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
            <thead>
              <tr>
                <th style={th}>Désignation</th>
                <th style={{ ...th, textAlign: "right" }}>Qté</th>
                <th style={{ ...th, textAlign: "right" }}>Prix unitaire HT</th>
                <th style={{ ...th, textAlign: "right" }}>Total HT</th>
              </tr>
            </thead>
            <tbody>
              {f.lignes.map((l, i) => (
                <tr key={i}>
                  <td style={td}>
                    <div style={{ fontWeight: 600 }}>{l.libelle}</div>
                    {l.description && <div style={petit}>{l.description}</div>}
                  </td>
                  <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                    {taux(l.quantite)} {l.unite}
                  </td>
                  <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>{mad(l.prix_unitaire_ht)}</td>
                  <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>{mad(l.total_ht)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginLeft: "auto", width: 320, fontSize: 13 }}>
            {[
              ["Total HT avant remise", mad(f.total_brut_ht)],
              ...(f.remise_montant > 0 ? [[`Remise (${taux(f.remise_pct)} %)`, `− ${mad(f.remise_montant)}`]] : []),
              ["Net HT", mad(f.total_net_ht)],
              [`TVA ${taux(f.tva_pct)} %`, mad(f.total_tva)],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span>{k}</span>
                <span>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", marginTop: 4, borderTop: "2px solid #0f172a", fontWeight: 700, fontSize: 15 }}>
              <span>Total TTC ({f.devise})</span>
              <span>{mad(f.total_ttc)}</span>
            </div>
          </div>

         {f.devise === "MAD" && (
            <div style={{ marginTop: 20, fontSize: 13, fontStyle: "italic", lineHeight: 1.5 }}>
              Arrêtée la présente facture à la somme de : <strong>{montantEnLettres(f.total_ttc)}</strong> toutes taxes comprises.
            </div>
          )}

          {(e.rib || e.banque) && (
            <div style={{ marginTop: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>RÈGLEMENT</div>
              {e.banque && <div style={petit}>Banque : {e.banque}</div>}
              {e.rib && <div style={petit}>RIB : {rib(e.rib)}</div>}
              <div style={petit}>À régler avant le {date(f.date_echeance)}.</div>
            </div>
          )}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 22px", fontSize: 12.5, color: "var(--graphite)", lineHeight: 1.6, boxShadow: CARD_SHADOW }}>
          <div>
            <strong>Contrôle de remise (Nadia) :</strong>{" "}
            {f.controle?.verdict
              ? `${f.controle.verdict}${f.controle.derogation_couverte ? " (dérogation validée sur le devis)" : ""}${f.controle.politique_version ? ` · politique v${f.controle.politique_version}` : ""}`
              : "non enregistré (facture établie avant ce contrôle)"}
          </div>
          <div>
            <strong>Transmission à la DGI :</strong>{" "}
            {f.transmission ? `${f.transmission.statut === "non_transmise" ? "non transmise" : f.transmission.statut}${f.transmission.xml_profil ? ` · ${f.transmission.xml_profil}` : ""}` : "aucun XML généré"}
          </div>
          <div>
            Ce document imprimé n&apos;est pas une facture électronique au sens de la réforme de la DGI : la transmission à la plateforme n&apos;est pas branchée, ses spécifications n&apos;étant pas publiées.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
