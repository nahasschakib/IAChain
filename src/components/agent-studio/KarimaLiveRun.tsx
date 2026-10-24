"use client";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { chargerPourKarima, runKarima } from "@/app/agents/karima-actions";
import type { DevisAFacturer, KarimaOutcome } from "@/lib/karima-core";

type Values = Record<string, string | boolean | string[]>;
export type KarimaRunState = { pending: boolean; outcome: KarimaOutcome | null };
type Identite = { ice: string; fiscal: string; rc: string; adresse: string };

const champ: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "6px 8px",
  fontSize: 12,
  background: "var(--surface, #fff)",
  color: "inherit",
  width: "100%",
  boxSizing: "border-box",
};
const petit: React.CSSProperties = { fontSize: 11.5, color: "var(--muted-foreground)", lineHeight: 1.45 };
const mad = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Identité déjà connue du client, reprise de sa fiche pour préremplir les champs.
const identite = (d?: DevisAFacturer): Identite => ({
  ice: d?.clientIce ?? "",
  fiscal: d?.clientIdentifiantFiscal ?? "",
  rc: d?.clientRc ?? "",
  adresse: d?.clientAdresse ?? "",
});

export default function KarimaLiveRun({ values, onState }: { values: Values; onState: (s: KarimaRunState) => void }) {
  const [pending, startTransition] = useTransition();
  const [liste, setListe] = useState<DevisAFacturer[] | null>(null);
  const [choix, setChoix] = useState("");
  const [id, setId] = useState<Identite>({ ice: "", fiscal: "", rc: "", adresse: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [fait, setFait] = useState(false);

  useEffect(() => {
    let vivant = true;
    chargerPourKarima()
      .then((l) => {
        if (!vivant) return;
        setListe(l);
        const premier = l.find((d) => !d.factureStatut);
        if (premier) {
          setChoix(String(premier.validationId));
          setId(identite(premier));
        }
      })
      .catch(() => vivant && setMessage("Impossible de charger les devis validés. Recharge la page."));
    return () => {
      vivant = false;
    };
  }, []);

  const facturables = (liste ?? []).filter((d) => !d.factureStatut);
  const dejaFactures = (liste ?? []).filter((d) => d.factureStatut);
  const choisi = facturables.find((d) => String(d.validationId) === choix);

  const etapes = [
    { fait: facturables.length > 0 || dejaFactures.length > 0, titre: "Valide un devis", aide: "Un humain doit avoir validé le devis (Approbations)." },
    { fait: choisi !== undefined && id.ice.trim() !== "" && id.adresse.trim() !== "", titre: "Vérifie l'identité du client", aide: "ICE et adresse sont obligatoires." },
    { fait, titre: "Établis la facture", aide: "Les montants sont repris du devis ; un humain valide ensuite la facture." },
  ];
  const courante = etapes.findIndex((e) => !e.fait);

  const choisir = (v: string) => {
    setChoix(v);
    setId(identite(facturables.find((d) => String(d.validationId) === v)));
  };

  const lancer = () => {
    if (!choisi) return;
    setMessage(null);
    onState({ pending: true, outcome: null });
    startTransition(async () => {
      let outcome: KarimaOutcome;
      try {
        outcome = await runKarima({
          validationId: choisi.validationId,
          clientIce: id.ice,
          clientIdentifiantFiscal: id.fiscal,
          clientRc: id.rc,
          clientAdresse: id.adresse,
          referenceCommande: String(values.commande ?? "").trim(),
        });
      } catch {
        outcome = { ok: false, error: "L'agent n'a pas pu répondre. Réessaie dans un instant." };
      }
      if (outcome.ok) {
        setFait(true);
        try {
          const l = await chargerPourKarima();
          setListe(l);
          const suivant = l.find((d) => !d.factureStatut);
          setChoix(suivant ? String(suivant.validationId) : "");
          setId(identite(suivant));
        } catch {
          /* la liste se mettra à jour au prochain chargement */
        }
      } else {
        setMessage(outcome.error);
      }
      onState({ pending: false, outcome });
    });
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>COMMENT ÇA MARCHE</div>
        <div style={{ display: "grid", gap: 8 }}>
          {etapes.map((e, i) => (
            <div key={e.titre} style={{ display: "flex", gap: 8, fontSize: 12, opacity: e.fait || i === courante ? 1 : 0.55 }}>
              <span style={{ fontWeight: 700 }}>{e.fait ? "✓" : i + 1}</span>
              <span>
                <strong>{e.titre}.</strong> {e.aide}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600 }}>Devis validé à facturer</label>
        {liste === null ? (
          <div style={petit}>Chargement…</div>
        ) : facturables.length === 0 ? (
          <div style={petit}>Aucun devis validé en attente de facture. Un devis est validé dans Approbations après le contrôle de Nadia.</div>
        ) : (
          <select style={champ} value={choix} onChange={(e) => choisir(e.target.value)} disabled={pending}>
            {facturables.map((d) => (
              <option key={d.validationId} value={String(d.validationId)}>
                {d.client}
                {d.devisVersion ? ` · ${d.devisVersion}` : ""}
                {d.totalTtc !== null ? ` · ${mad(d.totalTtc)} MAD TTC` : ""}
              </option>
            ))}
          </select>
        )}
                {dejaFactures.length > 0 && (
          <div style={petit}>
            Déjà facturés ou en cours :{" "}
            {dejaFactures.map((d, i) => (
              <span key={d.validationId}>
                {i > 0 ? " ; " : ""}
                {d.client}
                {d.devisVersion ? ` ${d.devisVersion}` : ""}{" "}
                {d.factureId ? (
                  <Link href={`/factures/${d.factureId}`} style={{ textDecoration: "underline" }}>
                    ({d.factureNumero ? `facture ${d.factureNumero}` : "en attente de validation"})
                  </Link>
                ) : null}
              </span>
            ))}
            {"."}
          </div>
        )}
      </div>

      {choisi && (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>IDENTITÉ LÉGALE DU CLIENT</div>
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600 }}>ICE (15 chiffres)</label>
            <input style={champ} inputMode="numeric" value={id.ice} onChange={(e) => setId({ ...id, ice: e.target.value })} disabled={pending} />
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Adresse</label>
            <input style={champ} value={id.adresse} maxLength={300} onChange={(e) => setId({ ...id, adresse: e.target.value })} disabled={pending} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Identifiant fiscal (facultatif)</label>
              <input style={champ} value={id.fiscal} maxLength={120} onChange={(e) => setId({ ...id, fiscal: e.target.value })} disabled={pending} />
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>RC (facultatif)</label>
              <input style={champ} value={id.rc} maxLength={120} onChange={(e) => setId({ ...id, rc: e.target.value })} disabled={pending} />
            </div>
          </div>
          <div style={petit}>
            {choisi.identiteClientComplete
              ? "Identité reprise de la fiche client. Toute modification est enregistrée pour les prochaines factures."
              : "Cette identité sera enregistrée sur la fiche du client pour ses prochaines factures."}
          </div>
        </div>
      )}

      {message && <div style={{ fontSize: 12, color: "var(--red)" }}>{message}</div>}
      <div style={petit}>
        La facture reprend exactement les montants du devis validé. Elle est réservée aux administrateurs de l&apos;organisation, et le brand kit (Paramètres) doit être complet.
      </div>
      <Button onClick={lancer} disabled={pending || !choisi}>
        {pending ? "Établissement en cours…" : "Établir la facture"}
      </Button>
    </div>
  );
}