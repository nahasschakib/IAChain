"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { sauverBrandkit } from "@/app/settings/brandkit-actions";
import {
  LIBELLES,
  validerBrandkit,
  type Brandkit,
  type ChampBrandkit,
  type ErreursBrandkit,
} from "@/lib/brandkit-regle";

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
const ERREUR: CSSProperties = { fontSize: 11.5, color: "#b91c1c", marginTop: 4 };
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

const GROUPES: { titre: string; champs: ChampBrandkit[] }[] = [
  {
    titre: "Identité légale",
    champs: [
      "raison_sociale",
      "nom_commercial",
      "forme_juridique",
      "capital_social",
      "ice",
      "identifiant_fiscal",
      "rc",
      "rc_tribunal",
      "taxe_professionnelle",
      "cnss",
    ],
  },
  { titre: "Coordonnées", champs: ["adresse", "ville", "code_postal", "pays", "telephone", "email_contact", "site_web"] },
  { titre: "Banque", champs: ["banque", "rib"] },
];

const PLACEHOLDERS: Partial<Record<ChampBrandkit, string>> = {
  ice: "15 chiffres",
  rib: "24 chiffres",
  capital_social: "Ex. : 100000",
};

function valeurInitiale(kit: Brandkit | null, c: ChampBrandkit): string {
  if (!kit) return c === "pays" ? "Maroc" : "";
  const v = kit[c];
  return v === null || v === undefined ? "" : String(v);
}

export default function BrandkitForm({
  kit,
  ribMasque,
  manque,
  canEdit,
}: {
  kit: Brandkit | null; // le RIB n'est jamais transmis au navigateur : kit.rib est null
  ribMasque: string;
  manque: string; // libellés des champs encore à renseigner pour facturer, vide si complet
  canEdit: boolean;
}) {
  const router = useRouter();
  const tous = GROUPES.flatMap((g) => g.champs);
  const [valeurs, setValeurs] = useState<Record<string, string>>(
    Object.fromEntries(tous.map((c) => [c, valeurInitiale(kit, c)])),
  );
  const [erreurs, setErreurs] = useState<ErreursBrandkit>({});
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (!canEdit) {
    const lignes = tous.filter((c) => c !== "rib" && valeurInitiale(kit, c) !== "");
    return (
      <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 8 }}>
        {lignes.length === 0 && <div style={{ color: "var(--graphite)" }}>Brand kit non renseigné.</div>}
        {lignes.map((c) => (
          <div key={c} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span style={{ color: "var(--graphite)" }}>{LIBELLES[c]}</span>
            <span>{valeurInitiale(kit, c)}</span>
          </div>
        ))}
        {ribMasque && (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span style={{ color: "var(--graphite)" }}>RIB</span>
            <span>{ribMasque}</span>
          </div>
        )}
        <div style={AIDE}>Seuls les administrateurs de l&apos;organisation peuvent le modifier.</div>
      </div>
    );
  }

  async function enregistrer() {
    setMessage(null);
    const local = validerBrandkit(valeurs);
    if (!local.ok) {
      setErreurs(local.erreurs);
      setMessage({ ok: false, text: "Corrige les champs signalés." });
      return;
    }
    setErreurs({});
    setPending(true);
    try {
      const r = await sauverBrandkit(valeurs);
      if (r.ok) {
        setValeurs({ ...valeurs, rib: "" });
        setMessage({ ok: true, text: "Brand kit enregistré." });
        router.refresh();
      } else {
        setErreurs(r.erreurs ?? {});
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
        Ces informations sont saisies une seule fois et réutilisées par les processus (factures, propositions). Elles ne sont jamais
        transmises à un modèle d&apos;IA.
        {manque && <div style={{ marginTop: 6, color: "#b45309" }}>À compléter pour facturer : {manque}.</div>}
      </div>

      {GROUPES.map((g) => (
        <div key={g.titre}>
          <div style={TITRE}>{g.titre}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {g.champs.map((c) => (
              <label key={c}>
                <span style={LABEL}>{LIBELLES[c]}</span>
                <input
                  style={CHAMP}
                  value={valeurs[c] ?? ""}
                  placeholder={c === "rib" && ribMasque ? ribMasque : PLACEHOLDERS[c]}
                  inputMode={c === "ice" || c === "rib" || c === "capital_social" ? "numeric" : undefined}
                  onChange={(e) => setValeurs({ ...valeurs, [c]: e.target.value })}
                />
                {c === "rib" && ribMasque && !erreurs[c] && <div style={AIDE}>Laisse vide pour conserver le RIB enregistré.</div>}
                {erreurs[c] && <div style={ERREUR}>{erreurs[c]}</div>}
              </label>
            ))}
          </div>
        </div>
      ))}

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button type="button" style={{ ...BOUTON, opacity: pending ? 0.6 : 1 }} disabled={pending} onClick={enregistrer}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {message && <span style={{ fontSize: 13, color: message.ok ? "var(--steel-deep)" : "#b91c1c" }}>{message.text}</span>}
      </div>
    </div>
  );
}