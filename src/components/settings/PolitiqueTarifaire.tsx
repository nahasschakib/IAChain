"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { savePolitique } from "@/app/settings/politique-actions";
import { erreursPolitique, type GrilleSegment, type PolitiqueTarifaire as Politique } from "@/lib/politique-regle";

type Grille = "" | GrilleSegment;

const CHAMP: CSSProperties = {
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 13,
  background: "var(--surface)",
  color: "var(--ink)",
  width: "100%",
  boxSizing: "border-box",
};
const LABEL: CSSProperties = { fontSize: 12, color: "var(--graphite)", marginBottom: 4, display: "block" };
const AIDE: CSSProperties = { fontSize: 11.5, color: "var(--graphite)", marginTop: 4 };
const TITRE: CSSProperties = { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, marginBottom: 10 };
const BOUTON: CSSProperties = {
  background: "var(--steel-deep)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "9px 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
const BOUTON_LEGER: CSSProperties = {
  background: "transparent",
  color: "var(--steel-deep)",
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 13,
  cursor: "pointer",
};

const GRILLES: { value: Grille; label: string }[] = [
  { value: "", label: "Non rattaché" },
  { value: "standard", label: "Grille standard" },
  { value: "grands_comptes", label: "Grille grands comptes" },
];

const fmt = (n: number) => String(n).replace(".", ",");
const num = (s: string) => (/^\s*\d+([.,]\d+)?\s*$/.test(s) ? Number(s.trim().replace(",", ".")) : NaN);

export default function PolitiqueTarifaire({
  politique,
  segments,
  canEdit,
}: {
  politique: Politique | null;
  segments: string[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [standard, setStandard] = useState(politique ? fmt(politique.plafonds.standard) : "");
  const [grandsComptes, setGrandsComptes] = useState(politique ? fmt(politique.plafonds.grands_comptes) : "");
  const [derogation, setDerogation] = useState(politique ? fmt(politique.plafonds.derogation) : "");
  const [mapping, setMapping] = useState<Record<string, Grille>>(
    Object.fromEntries(segments.map((s) => [s, (politique?.segments[s] ?? "") as Grille])),
  );
  const [motifs, setMotifs] = useState<string[]>(politique?.motifs ?? []);
  const [nouveauMotif, setNouveauMotif] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Consultation seule pour les membres qui ne sont pas administrateurs.
  if (!canEdit) {
    return (
      <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 8 }}>
        {politique ? (
          <>
            <div style={{ color: "var(--graphite)" }}>Version {politique.version} en vigueur.</div>
            <div>Plafond standard : {fmt(politique.plafonds.standard)} %</div>
            <div>Plafond grands comptes : {fmt(politique.plafonds.grands_comptes)} %</div>
            <div>Plafond de dérogation : {fmt(politique.plafonds.derogation)} %</div>
          </>
        ) : (
          <div style={{ color: "var(--graphite)" }}>Aucune politique tarifaire définie pour cette organisation.</div>
        )}
        <div style={AIDE}>Seuls les administrateurs de l&apos;organisation peuvent la modifier.</div>
      </div>
    );
  }

  function ajouterMotif() {
    const m = nouveauMotif.replace(/\s+/g, " ").trim();
    if (!m) return;
    if (motifs.some((x) => x.toLowerCase() === m.toLowerCase())) {
      setMessage({ ok: false, text: "Ce motif existe déjà." });
      return;
    }
    setMotifs([...motifs, m]);
    setNouveauMotif("");
    setMessage(null);
  }

  async function enregistrer() {
    setMessage(null);
    const plafonds = { standard: num(standard), grands_comptes: num(grandsComptes), derogation: num(derogation) };
    const invalide = (
      [
        ["standard", "Grille standard"],
        ["grands_comptes", "Grille grands comptes"],
        ["derogation", "Plafond de dérogation"],
      ] as const
    ).find(([k]) => Number.isNaN(plafonds[k]));
    if (invalide) {
      setMessage({ ok: false, text: `${invalide[1]} : saisis un nombre seul, par exemple 5 ou 7,5.` });
      return;
    }
    const rattaches = Object.fromEntries(Object.entries(mapping).filter(([, g]) => g !== "")) as Record<string, GrilleSegment>;
    const erreurs = erreursPolitique({ plafonds, segments: rattaches, motifs });
    if (erreurs.length > 0) {
      setMessage({ ok: false, text: erreurs[0] });
      return;
    }
    setPending(true);
    try {
      const r = await savePolitique({ plafonds, segments: rattaches, motifs, note });
      if (r.ok) {
        setNote("");
        setMessage({ ok: true, text: `Version ${r.version} enregistrée et active.` });
        router.refresh();
      } else {
        setMessage({ ok: false, text: r.error });
      }
    } catch {
      setMessage({ ok: false, text: "Enregistrement impossible. Réessaie dans un instant." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontSize: 12.5, color: "var(--graphite)", lineHeight: 1.5 }}>
        {politique
          ? `Version ${politique.version} en vigueur. Chaque enregistrement crée une nouvelle version et conserve l'historique.`
          : "Aucune politique active : tant qu'elle n'est pas définie, Karim ne propose aucune remise et Nadia renvoie les dossiers à un contrôle manuel."}
      </div>

      <div>
        <div style={TITRE}>Plafonds de remise</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <label>
            <span style={LABEL}>Grille standard (%)</span>
            <input style={CHAMP} inputMode="decimal" placeholder="Ex. : 5" value={standard} onChange={(e) => setStandard(e.target.value)} />
          </label>
          <label>
            <span style={LABEL}>Grille grands comptes (%)</span>
            <input style={CHAMP} inputMode="decimal" placeholder="Ex. : 10" value={grandsComptes} onChange={(e) => setGrandsComptes(e.target.value)} />
          </label>
          <label>
            <span style={LABEL}>Plafond de dérogation (%)</span>
            <input style={CHAMP} inputMode="decimal" placeholder="Ex. : 15" value={derogation} onChange={(e) => setDerogation(e.target.value)} />
          </label>
        </div>
        <div style={AIDE}>
          Les deux premières grilles sont les remises maximales sans dérogation. Au-delà, une remise exige un motif d&apos;exception et
          l&apos;approbation de la direction, jusqu&apos;au plafond de dérogation ; au-delà de celui-ci, elle est refusée.
        </div>
      </div>

      <div>
        <div style={TITRE}>Grille de chaque segment</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {segments.map((s) => (
            <div key={s} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 13 }}>{s}</span>
              <select
                style={CHAMP}
                value={mapping[s] ?? ""}
                onChange={(e) => setMapping({ ...mapping, [s]: e.target.value as Grille })}
              >
                {GRILLES.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div style={AIDE}>Un segment non rattaché n&apos;a pas de remise admissible : le dossier est alors contrôlé à la main.</div>
      </div>

      <div>
        <div style={TITRE}>Motifs d&apos;exception autorisés</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
          {motifs.length === 0 && <div style={AIDE}>Aucun motif : aucune dérogation ne pourra être acceptée.</div>}
          {motifs.map((m) => (
            <div key={m} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
              <span>{m}</span>
              <button type="button" style={BOUTON_LEGER} onClick={() => setMotifs(motifs.filter((x) => x !== m))}>
                Retirer
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={CHAMP}
            placeholder="Ex. : volume exceptionnel"
            maxLength={80}
            value={nouveauMotif}
            onChange={(e) => setNouveauMotif(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                ajouterMotif();
              }
            }}
          />
          <button type="button" style={BOUTON_LEGER} onClick={ajouterMotif}>
            Ajouter
          </button>
        </div>
      </div>

      <label>
        <span style={LABEL}>Note de version (facultatif)</span>
        <input style={CHAMP} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button type="button" style={{ ...BOUTON, opacity: pending ? 0.6 : 1 }} disabled={pending} onClick={enregistrer}>
          {pending ? "Enregistrement…" : "Enregistrer une nouvelle version"}
        </button>
        {message && (
          <span style={{ fontSize: 13, color: message.ok ? "var(--steel-deep)" : "#b91c1c" }}>{message.text}</span>
        )}
      </div>
    </div>
  );
}