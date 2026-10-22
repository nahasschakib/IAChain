"use client";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { proposerSalma, chiffrerSalma, dossiersChaine, reprendreDossier } from "@/app/agents/salma-actions";
import type { DossierChaine } from "@/lib/salma-chaine";
import { BUDGETS_SALMA, type SalmaOutcome } from "@/lib/salma";
import { formatMAD, type Prestation } from "@/lib/catalogue-regle";

type Values = Record<string, string | boolean | string[]>;
export type SalmaRunState = { pending: boolean; outcome: SalmaOutcome | null };

const one = (v: Values[string] | undefined) =>
  Array.isArray(v) ? (v[0] ?? "") : typeof v === "string" ? v : "";

// Le cadre budgétaire vient de Mehdi : on retient la valeur connue contenue dans le texte, sinon aucune.
const budgetConnu = (v: string) => BUDGETS_SALMA.find((b) => v.includes(b)) ?? "";

type Ligne = { prestation_id: number; quantite: string; justification: string };
type Etape = { agentRunId: number; catalogue: Prestation[]; segments: string[]; infos: string[] };

const champ: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "5px 8px",
  fontSize: 12,
  background: "var(--surface, #fff)",
  color: "inherit",
};
const petit: React.CSSProperties = { fontSize: 11.5, color: "var(--muted-foreground)", lineHeight: 1.45 };

export default function SalmaLiveRun({
  values,
  onState,
}: {
  values: Values;
  onState: (s: SalmaRunState) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [etape, setEtape] = useState<Etape | null>(null);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [segment, setSegment] = useState("");
  const [ajout, setAjout] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  // Saisie de secours : en dehors de la chaîne, rien ne dérive l'objectif ni le cadre budgétaire.
  const [objectifSaisi, setObjectifSaisi] = useState("");
  const [budgetSaisi, setBudgetSaisi] = useState("");
  const [chiffre, setChiffre] = useState(false);
  // Dossiers de la chaîne Prospect to Cash qui attendent la validation des lignes.
  const [dossiers, setDossiers] = useState<DossierChaine[]>([]);
  const [dossierRepris, setDossierRepris] = useState<string | null>(null);

  const chargerDossiers = () => {
    dossiersChaine()
      .then(setDossiers)
      .catch(() => setDossiers([]));
  };
  useEffect(chargerDossiers, []);

  const reprendre = (executionId: number) => {
    setMessage(null);
    setSucces(null);
    startTransition(async () => {
      try {
        const r = await reprendreDossier(executionId);
        if (!r.ok) {
          setMessage(r.error);
          chargerDossiers();
          return;
        }
        setEtape({ agentRunId: r.agentRunId, catalogue: r.catalogue, segments: r.segments, infos: r.proposition.informations_manquantes });
        setLignes(
          r.proposition.lignes.map((l) => ({
            prestation_id: l.prestation_id,
            quantite: String(l.quantite),
            justification: l.justification,
          }))
        );
        setSegment(r.segment);
        setAjout("");
        setChiffre(false);
        setDossierRepris(r.client);
        onState({ pending: false, outcome: null });
        if (r.proposition.lignes.length === 0)
          setMessage("L'IA n'a retenu aucune prestation du catalogue : ajoute-les à la main ci-dessous.");
      } catch {
        setMessage("Le dossier n'a pas pu être chargé. Réessaie dans un instant.");
      }
    });
  };

  // Guide : où en est l'utilisateur ?
  const objectifOk = (String(values.objectif ?? "").trim() || objectifSaisi.trim()).length >= 10;
  const clientOk = String(values.client ?? "").trim().length >= 2;
  const etapes = [
    { fait: objectifOk && clientOk, titre: "Décris le dossier", aide: "Client, remise, registre et objectif du prospect." },
    { fait: etape !== null, titre: "Demande les lignes à l'IA", aide: "Elle ne propose que des prestations de ton catalogue." },
    { fait: chiffre, titre: "Ajuste, puis chiffre", aide: "Quantités, segment du client, puis « Chiffrer la proposition »." },
  ];
  const courante = etapes.findIndex((e) => !e.fait);

  const parId = new Map((etape?.catalogue ?? []).map((p) => [p.id, p]));
  const restantes = (etape?.catalogue ?? []).filter((p) => !lignes.some((l) => l.prestation_id === p.id));

  const proposer = () => {
    setMessage(null);
    setChiffre(false);
    onState({ pending: true, outcome: null });
    startTransition(async () => {
      try {
        const r = await proposerSalma({
          client: String(values.client ?? ""),
          objectif: String(values.objectif ?? "").trim() || objectifSaisi,
          budget: budgetConnu(String(values.budget_cadre ?? "")) || budgetSaisi,
        });
        if (!r.ok) {
          setEtape(null);
          setLignes([]);
          setMessage(r.error);
        } else {
          setEtape({ agentRunId: r.agentRunId, catalogue: r.catalogue, segments: r.segments, infos: r.proposition.informations_manquantes });
          setLignes(
            r.proposition.lignes.map((l) => ({
              prestation_id: l.prestation_id,
              quantite: String(l.quantite),
              justification: l.justification,
            }))
          );
          setSegment("");
          setAjout("");
          if (r.proposition.lignes.length === 0)
            setMessage("L'IA n'a retenu aucune prestation du catalogue : ajoute-les à la main ci-dessous.");
        }
      } catch {
        setMessage("L'agent n'a pas pu répondre. Réessaie dans un instant.");
      }
      onState({ pending: false, outcome: null });
    });
  };

  const chiffrer = () => {
    if (!etape) return;
    setMessage(null);
    setSucces(null);
    const quantites = lignes.map((l) => (/^\s*\d+\s*$/.test(l.quantite) ? Number(l.quantite) : NaN));
    if (quantites.some((q) => Number.isNaN(q))) {
      setMessage("Quantités : saisis des nombres entiers.");
      return;
    }
    const brut = String(values.remise ?? "").trim();
    const remise = brut === "" ? 0 : /^\d+([.,]\d+)?$/.test(brut) ? Number(brut.replace(",", ".")) : NaN;
    if (Number.isNaN(remise)) {
      setMessage("Remise : saisis un nombre seul, par exemple 5 ou 7,5.");
      return;
    }
    onState({ pending: true, outcome: null });
    startTransition(async () => {
      let outcome: SalmaOutcome;
      try {
        outcome = await chiffrerSalma({
          agentRunId: etape.agentRunId,
          registre: one(values.registre),
          remise,
          segment: segment || undefined,
          lignes: lignes.map((l, i) => ({ prestation_id: l.prestation_id, quantite: quantites[i] })),
        });
      } catch {
        outcome = { ok: false, error: "L'agent n'a pas pu répondre. Réessaie dans un instant." };
      }
      if (!outcome.ok) setMessage(outcome.error);
      else if (dossierRepris) {
        setSucces(`Devis chiffré pour ${dossierRepris}. La chaîne continue : Nadia contrôle la remise, puis la validation du devis arrive dans Approbations.`);
        setDossierRepris(null);
        chargerDossiers();
      }
      setChiffre(outcome.ok);
      onState({ pending: false, outcome });
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "var(--muted-foreground)" }}>
          COMMENT ÇA MARCHE
        </div>
        {etapes.map((e, i) => (
          <div key={e.titre} style={{ display: "flex", gap: 10, alignItems: "flex-start", opacity: e.fait || i === courante ? 1 : 0.55 }}>
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: 999,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                background: e.fait ? "#166534" : i === courante ? "var(--steel-deep)" : "transparent",
                color: e.fait || i === courante ? "#fff" : "var(--muted-foreground)",
                border: e.fait || i === courante ? "none" : "1px solid var(--border)",
              }}
            >
              {e.fait ? "✓" : i + 1}
            </span>
            <div>
              <div style={{ fontSize: 13, fontWeight: i === courante ? 700 : 600 }}>{e.titre}</div>
              <div style={petit}>{e.aide}</div>
            </div>
          </div>
        ))}
        <div style={petit}>
          Le code calcule les montants, la TVA et le délai ; l&apos;IA ne choisit que des lignes du catalogue et rédige
          l&apos;introduction. Rien n&apos;est envoyé au client : la proposition passe ensuite par un contrôle puis une approbation.
        </div>
      </div>
      {dossiers.length > 0 && (
        <div style={{ border: "1px solid var(--steel-deep)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "var(--muted-foreground)" }}>
            DOSSIERS EN ATTENTE (CHAÎNE PROSPECT TO CASH)
          </div>
          <div style={petit}>
            Ces prospects ont été qualifiés par la chaîne. Salma a déjà proposé des lignes : clique sur « Reprendre », ajuste les
            quantités, puis chiffre. La chaîne repart toute seule vers Nadia.
          </div>
          {dossiers.map((d) => (
            <div key={d.executionId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, fontSize: 13 }}>
                <strong>{d.client}</strong> <span style={petit}>· exécution {d.runLabel ?? `#${d.executionId}`}{d.note ? ` · ${d.note}` : ""}</span>
              </div>
              <Button type="button" onClick={() => reprendre(d.executionId)} disabled={pending}>
                Reprendre
              </Button>
            </div>
          ))}
        </div>
      )}
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={petit}>Objectif du prospect (saisie ; dans la chaîne, il sera repris du plan de Karim)</span>
        <Textarea
          value={objectifSaisi}
          rows={3}
          maxLength={2000}
          disabled={pending}
          onChange={(e) => setObjectifSaisi(e.target.value)}
          placeholder="Ex. : automatiser la prise de commandes sur 3 sites, la relier à l'ERP et former les équipes."
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={petit}>Cadre budgétaire (saisie ; dans la chaîne, il sera repris de Mehdi)</span>
        <select style={champ} value={budgetSaisi} disabled={pending} onChange={(e) => setBudgetSaisi(e.target.value)}>
          <option value="">Non précisé</option>
          {BUDGETS_SALMA.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>
      <Button type="button" onClick={proposer} disabled={pending} style={{ width: "100%" }}>
        {pending ? "Travail en cours…" : etape ? "Relancer la proposition de lignes" : "Proposer les lignes avec l'IA"}
      </Button>

      {etape && (
        <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "var(--muted-foreground)" }}>
            LIGNES DU DEVIS
          </div>

          {lignes.length === 0 && <div style={petit}>Aucune ligne : ajoute au moins une prestation.</div>}

          {lignes.map((l) => {
            const p = parId.get(l.prestation_id);
            return (
              <div key={l.prestation_id} style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{p?.libelle ?? `Prestation ${l.prestation_id}`}</span>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setLignes(lignes.filter((x) => x.prestation_id !== l.prestation_id))}
                    style={{ ...champ, cursor: "pointer" }}
                  >
                    Retirer
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <input
                    style={{ ...champ, width: 64 }}
                    inputMode="numeric"
                    aria-label="Quantité"
                    disabled={pending}
                    value={l.quantite}
                    onChange={(e) =>
                      setLignes(lignes.map((x) => (x.prestation_id === l.prestation_id ? { ...x, quantite: e.target.value } : x)))
                    }
                  />
                  <span style={petit}>
                    × {p ? `${formatMAD(p.prix_ht)} MAD HT / ${p.unite}` : ""}
                  </span>
                </div>
                {l.justification && <div style={{ ...petit, marginTop: 4 }}>{l.justification}</div>}
              </div>
            );
          })}

          {restantes.length > 0 && (
            <div style={{ display: "flex", gap: 8 }}>
              <select style={{ ...champ, flex: 1, minWidth: 0 }} value={ajout} disabled={pending} onChange={(e) => setAjout(e.target.value)}>
                <option value="">Ajouter une prestation du catalogue…</option>
                {restantes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.libelle}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={pending || !ajout}
                style={{ ...champ, cursor: "pointer" }}
                onClick={() => {
                  setLignes([...lignes, { prestation_id: Number(ajout), quantite: "1", justification: "" }]);
                  setAjout("");
                }}
              >
                Ajouter
              </button>
            </div>
          )}

          {etape.infos.length > 0 && (
            <div style={petit}>
              <strong>À préciser avec le client :</strong> {etape.infos.join(" · ")}
            </div>
          )}

          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={petit}>Segment du client (détermine le plafond de remise)</span>
            <select style={champ} value={segment} disabled={pending} onChange={(e) => setSegment(e.target.value)}>
              <option value="">Non précisé</option>
              {etape.segments.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <Button type="button" onClick={chiffrer} disabled={pending || lignes.length === 0} style={{ width: "100%" }}>
            {pending ? "Chiffrage en cours…" : "Chiffrer la proposition"}
          </Button>
        </div>
      )}

      {succes && <div style={{ fontSize: 12.5, color: "#166534", lineHeight: 1.45 }}>{succes}</div>}
      {message && <div style={{ fontSize: 12.5, color: "var(--red, #b91c1c)", lineHeight: 1.45 }}>{message}</div>}
    </div>
  );
}