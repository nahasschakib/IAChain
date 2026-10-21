"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { savePrestation, setPrestationActive } from "@/app/settings/catalogue-actions";
import { formatMAD, UNITES, type Prestation } from "@/lib/catalogue-regle";

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
  padding: "6px 10px",
  fontSize: 12.5,
  cursor: "pointer",
};

type Form = { id?: number; libelle: string; description: string; unite: string; prix: string; delai: string };
const VIDE: Form = { libelle: "", description: "", unite: "forfait", prix: "", delai: "" };

// Nombre seul, virgule ou point accepté ; tout autre texte est refusé.
const nombre = (s: string, entier: boolean) => {
  const re = entier ? /^\s*\d+\s*$/ : /^\s*\d+([.,]\d+)?\s*$/;
  return re.test(s) ? Number(s.trim().replace(",", ".")) : NaN;
};

export default function CataloguePrestations({
  prestations,
  canEdit,
}: {
  prestations: Prestation[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const actives = prestations.filter((p) => p.actif).length;

  async function enregistrer() {
    if (!form) return;
    setMessage(null);
    const prix = nombre(form.prix, false);
    if (Number.isNaN(prix)) {
      setMessage({ ok: false, text: "Prix HT : saisis un nombre seul, par exemple 12000 ou 7500,50." });
      return;
    }
    let delai: number | null = null;
    if (form.delai.trim() !== "") {
      delai = nombre(form.delai, true);
      if (Number.isNaN(delai)) {
        setMessage({ ok: false, text: "Délai : saisis un nombre entier de jours, par exemple 30." });
        return;
      }
    }
    setPending(true);
    try {
      const r = await savePrestation({
        id: form.id,
        libelle: form.libelle,
        description: form.description,
        unite: form.unite,
        prix_ht: prix,
        delai_jours: delai,
      });
      if (r.ok) {
        setForm(null);
        setMessage({ ok: true, text: "Prestation enregistrée." });
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

  async function basculer(p: Prestation) {
    setMessage(null);
    setPending(true);
    try {
      const r = await setPrestationActive(p.id, !p.actif);
      if (r.ok) router.refresh();
      else setMessage({ ok: false, text: r.error });
    } catch {
      setMessage({ ok: false, text: "Modification impossible. Réessaie dans un instant." });
    } finally {
      setPending(false);
    }
  }

  function modifier(p: Prestation) {
    setMessage(null);
    setForm({
      id: p.id,
      libelle: p.libelle,
      description: p.description ?? "",
      unite: p.unite,
      prix: String(p.prix_ht).replace(".", ","),
      delai: p.delai_jours === null ? "" : String(p.delai_jours),
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 12.5, color: "var(--graphite)", lineHeight: 1.5 }}>
        Les prestations que Salma peut chiffrer, avec leurs prix HT en MAD. Salma ne propose que des lignes de ce catalogue ; un
        devis déjà produit garde ses lignes, même si tu modifies un prix ensuite.
      </div>

      {prestations.length === 0 ? (
        <div style={AIDE}>Aucune prestation : Salma ne pourra pas chiffrer tant que le catalogue est vide.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {prestations.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderTop: "1px solid var(--line)",
                opacity: p.actif ? 1 : 0.55,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {p.libelle}
                  {!p.actif && <span style={{ fontWeight: 400, color: "var(--graphite)" }}> · désactivée</span>}
                </div>
                <div style={{ fontSize: 12, color: "var(--graphite)" }}>
                  {formatMAD(p.prix_ht)} MAD HT / {p.unite}
                  {p.delai_jours !== null ? ` · délai ${p.delai_jours} j` : ""}
                </div>
                {p.description && <div style={{ fontSize: 12, marginTop: 2 }}>{p.description}</div>}
              </div>
              {canEdit && (
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button type="button" style={BOUTON_LEGER} disabled={pending} onClick={() => modifier(p)}>
                    Modifier
                  </button>
                  <button type="button" style={BOUTON_LEGER} disabled={pending} onClick={() => basculer(p)}>
                    {p.actif ? "Désactiver" : "Réactiver"}
                  </button>
                </div>
              )}
            </div>
          ))}
          <div style={{ ...AIDE, borderTop: "1px solid var(--line)", paddingTop: 8 }}>
            {actives} prestation{actives > 1 ? "s" : ""} active{actives > 1 ? "s" : ""} sur {prestations.length}.
          </div>
        </div>
      )}

      {!canEdit && <div style={AIDE}>Seuls les administrateurs de l&apos;organisation peuvent modifier le catalogue.</div>}

      {canEdit && !form && (
        <div>
          <button type="button" style={BOUTON_LEGER} onClick={() => { setMessage(null); setForm({ ...VIDE }); }}>
            Ajouter une prestation
          </button>
        </div>
      )}

      {canEdit && form && (
        <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <label>
            <span style={LABEL}>Libellé</span>
            <input style={CHAMP} maxLength={120} placeholder="Ex. : Intégration ERP" value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} />
          </label>
          <label>
            <span style={LABEL}>Description (facultatif)</span>
            <input style={CHAMP} maxLength={400} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <label>
              <span style={LABEL}>Prix HT (MAD)</span>
              <input style={CHAMP} inputMode="decimal" placeholder="Ex. : 12000" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} />
            </label>
            <label>
              <span style={LABEL}>Unité</span>
              <select style={CHAMP} value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })}>
                {UNITES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span style={LABEL}>Délai en jours (facultatif)</span>
              <input style={CHAMP} inputMode="numeric" placeholder="Ex. : 30" value={form.delai} onChange={(e) => setForm({ ...form, delai: e.target.value })} />
            </label>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" style={{ ...BOUTON, opacity: pending ? 0.6 : 1 }} disabled={pending} onClick={enregistrer}>
              {pending ? "Enregistrement…" : form.id ? "Enregistrer les modifications" : "Ajouter au catalogue"}
            </button>
            <button type="button" style={BOUTON_LEGER} disabled={pending} onClick={() => { setForm(null); setMessage(null); }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {message && <div style={{ fontSize: 13, color: message.ok ? "var(--steel-deep)" : "#b91c1c" }}>{message.text}</div>}
    </div>
  );
}