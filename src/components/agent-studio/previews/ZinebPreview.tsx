"use client";
import { useState } from "react";

type FieldValue = string | boolean | string[];

const VARIANTS = [
  { id: "ecru", label: "Écru · losange brun", sku: "TBO-200300-EC", price: "4 900 MAD", stock: "6 pièces", swatch: "#ece6da", low: false },
  { id: "charbon", label: "Charbon · losange écru", sku: "TBO-200300-CH", price: "5 200 MAD", stock: "2 pièces", swatch: "#3a3a3c", low: true },
  { id: "ocre", label: "Ocre · motif Azilal", sku: "TBO-200300-OC", price: "5 400 MAD", stock: "4 pièces", swatch: "#b89366", low: false },
  { id: "petit", label: "Écru · 160 × 230 cm", sku: "TBO-160230-EC", price: "3 400 MAD", stock: "Sur commande", swatch: "#ece6da", low: true },
];

const THUMBS = ["Détail", "Texture", "En situation", "Dos"];

const VIDEO_FORMATS = [
  { id: "reel", label: "9:16 Reel", short: "9:16", ratio: "9 / 16", width: "150px", duration: "15 s" },
  { id: "square", label: "1:1", short: "1:1", ratio: "1 / 1", width: "200px", duration: "15 s" },
  { id: "wide", label: "16:9", short: "16:9", ratio: "16 / 9", width: "100%", duration: "30 s" },
];

const FAQ = [
  { lang: "FR", q: "La laine perd-elle des poils ?", a: "Un léger peluchage est normal les premières semaines ; il disparaît après quelques passages d'aspirateur sans brosse rotative." },
  { lang: "FR", q: "Livrez-vous à Marrakech ?", a: "Oui, sous 3 à 5 jours ouvrés, paiement à la livraison possible." },
  { lang: "AR", q: "واش كاين مقاسات أخرى؟", a: "نعم، متوفر حتى 160 × 230 و 250 × 350 حسب الطلب." },
];

const CART_FR = "Bonjour Samira, votre tapis Beni Ouarain vous attend toujours dans votre panier. Il reste 6 pièces — la livraison est offerte jusqu'à dimanche.";
const CART_AR = "سلام سميرة، الزربية بني وارين ديالك مازال كتسناك فالسلة. بقاو 6 قطع — التوصيل مجاني حتى نهار الأحد.";

function storyboard(formatId: string, variantLabel: string) {
  if (formatId === "wide") {
    return [
      { t: "0–5 s", title: "Pièce entière au sol", desc: "Plan large, lumière naturelle, motif lisible." },
      { t: "5–12 s", title: "Tissage à la main", desc: "Gros plan sur les nœuds et l'épaisseur de laine." },
      { t: "12–22 s", title: "Variantes", desc: "Écru, charbon, ocre en fondu enchaîné, prix en surimpression." },
      { t: "22–30 s", title: "Livraison & appel à l'action", desc: "48 h Casablanca · paiement à la livraison." },
    ];
  }
  return [
    { t: "0–3 s", title: "Accroche texture", desc: "Main qui passe dans les poils, sans texte." },
    { t: "3–8 s", title: "Révélation en situation", desc: "Salon, cadrage vertical, variante " + variantLabel.toLowerCase() + "." },
    { t: "8–12 s", title: "Variantes", desc: "Trois coloris en balayage, prix affiché." },
    { t: "12–15 s", title: "Appel à l'action", desc: "« Commander sur WhatsApp » · stock restant." },
  ];
}

const monoLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono, monospace)",
  fontSize: "10px",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--muted-foreground)",
};

function MediaSlot({
  kind,
  placeholder,
  hint,
  aspectRatio,
  width,
}: {
  kind: "image" | "video";
  placeholder: string;
  hint?: string;
  aspectRatio: string;
  width?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (url) URL.revokeObjectURL(url);
    setUrl(URL.createObjectURL(file));
  };

  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        border: "1px dashed var(--border)",
        background: "var(--steel-tint)",
        aspectRatio,
        width: width ?? "100%",
        maxWidth: "100%",
      }}
    >
      <input
        type="file"
        accept={kind === "image" ? "image/*" : "video/*"}
        onChange={onFile}
        style={{ display: "none" }}
      />
      {url ? (
        kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={placeholder} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <video src={url} controls muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )
      ) : (
        <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "8px", textAlign: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{placeholder}</span>
          {hint && <span style={{ ...monoLabel, fontSize: "9px" }}>{hint}</span>}
        </span>
      )}
    </label>
  );
}

export default function ZinebPreview({ values }: { values: Record<string, FieldValue> }) {
  const [variantId, setVariantId] = useState("ecru");
  const [videoFormat, setVideoFormat] = useState("reel");

  const variant = VARIANTS.find((v) => v.id === variantId) ?? VARIANTS[0];
  const format = VIDEO_FORMATS.find((f) => f.id === videoFormat) ?? VIDEO_FORMATS[0];

  const produit = typeof values.produit === "string" ? values.produit : "";
  const canaux = Array.isArray(values.canaux_vente) ? values.canaux_vente : [];
  const langue = typeof values.langue_reponses === "string" && values.langue_reponses ? values.langue_reponses : "FR + AR";

  const title = produit.split(",")[0].trim() || "Produit";
  const showFr = langue !== "AR";
  const showAr = langue !== "FR";
  const hasWhatsapp = canaux.includes("WhatsApp Business");
  const faq = FAQ.filter((q) => (q.lang === "FR" ? showFr : showAr));
  const steps = storyboard(videoFormat, variant.label);

  const channelsText =
    canaux.length === 0
      ? "Aucun canal sélectionné"
      : `Fiche destinée à ${canaux.length} canal${canaux.length > 1 ? "aux" : ""}`;

  const attrs = [
    { k: "Prix", v: variant.price },
    { k: "Stock", v: variant.stock },
    { k: "Livraison", v: "48 h Casablanca, 3–5 j Maroc" },
    { k: "Retour", v: "14 jours" },
  ];

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "4px",
        background: "var(--surface, #fff)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
      }}
    >
      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={monoLabel}>Fiche produit &amp; réponses clients</div>
          <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.01em", marginTop: "4px" }}>{title}</div>
          <div style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "2px" }}>
            {channelsText} · langue {langue}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ ...monoLabel, color: "var(--steel-strong, #2f4a63)" }}>RÉF · ECO-0342-DRAFT</div>
          <div style={monoLabel}>SKU · TBO-200300</div>
        </div>
      </div>

      {/* Visuels + description */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={monoLabel}>Visuels · {variant.label}</span>
            <span style={monoLabel}>cliquer pour déposer</span>
          </div>
          <MediaSlot key={`${variant.id}-main`} kind="image" placeholder="Photo principale" aspectRatio="4 / 3" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
            {THUMBS.map((t) => (
              <MediaSlot key={`${variant.id}-${t}`} kind="image" placeholder={t} aspectRatio="1 / 1" />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <span style={monoLabel}>Description</span>
          <p style={{ fontSize: "13px", lineHeight: 1.6, margin: 0 }}>
            Tissé à la main dans le Moyen Atlas, en laine de mouton non teinte. Motif losange brun sur fond écru, poils épais de 3 cm pour un rendu dense et chaud. Chaque pièce est unique : de légères irrégularités signent le travail artisanal.
          </p>
          <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--border)" }}>
            {attrs.map((a) => (
              <div
                key={a.k}
                style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: "13px" }}
              >
                <span style={{ color: "var(--muted-foreground)" }}>{a.k}</span>
                <span style={{ fontWeight: 600, textAlign: "right" }}>{a.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Variantes */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <span style={monoLabel}>Variantes</span>
          <span style={monoLabel}>Chaque variante a ses visuels, son prix et son stock</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--border)" }}>
          {VARIANTS.map((v, i) => {
            const on = v.id === variantId;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "14px minmax(0, 1fr) auto auto",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  textAlign: "left",
                  cursor: "pointer",
                  border: "none",
                  borderTop: i === 0 ? "none" : "1px solid var(--border)",
                  borderLeft: `3px solid ${on ? "var(--steel-strong, #2f4a63)" : "transparent"}`,
                  background: on ? "var(--steel-tint)" : "transparent",
                  color: "inherit",
                }}
              >
                <span style={{ width: "14px", height: "14px", background: v.swatch, border: "1px solid var(--border)" }} />
                <span style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>{v.label}</span>
                  <span style={{ ...monoLabel, textTransform: "none" }}>{v.sku}</span>
                </span>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{v.price}</span>
                <span style={{ fontSize: "12px", color: v.low ? "var(--amber, #b45309)" : "var(--muted-foreground)" }}>{v.stock}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Vidéo */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={monoLabel}>Présentation vidéo</span>
          <div style={{ display: "flex", border: "1px solid var(--border)" }}>
            {VIDEO_FORMATS.map((f) => {
              const on = f.id === videoFormat;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setVideoFormat(f.id)}
                  style={{
                    padding: "5px 10px",
                    fontSize: "11.5px",
                    cursor: "pointer",
                    border: "none",
                    borderRight: "1px solid var(--border)",
                    background: on ? "var(--steel-strong, #2f4a63)" : "transparent",
                    color: on ? "#fff" : "var(--muted-foreground)",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: `0 0 ${format.width}`, maxWidth: "100%" }}>
            <MediaSlot
              key={videoFormat}
              kind="video"
              placeholder="Déposer une vidéo"
              hint={`MP4 · MOV · ${format.short}`}
              aspectRatio={format.ratio}
            />
          </div>
          <div style={{ flex: "1 1 220px", minWidth: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600 }}>Découpage proposé par Zineb · {format.duration}</span>
            {steps.map((s) => (
              <div
                key={s.t}
                style={{ display: "grid", gridTemplateColumns: "56px minmax(0, 1fr)", gap: "10px", border: "1px solid var(--border)", padding: "8px 10px" }}
              >
                <span style={{ ...monoLabel, textTransform: "none", color: "var(--steel-strong, #2f4a63)" }}>{s.t}</span>
                <span style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: 600 }}>{s.title}</span>
                  <span style={{ fontSize: "12px", color: "var(--muted-foreground)", lineHeight: 1.45 }}>{s.desc}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <span style={monoLabel}>Réponses prêtes · questions fréquentes</span>
        {faq.map((item) => (
          <div
            key={item.q}
            dir={item.lang === "AR" ? "rtl" : "ltr"}
            style={{ display: "flex", flexDirection: "column", gap: "3px", border: "1px solid var(--border)", padding: "10px 12px" }}
          >
            <span style={{ fontSize: "13px", fontWeight: 600 }}>{item.q}</span>
            <span style={{ fontSize: "12.5px", color: "var(--muted-foreground)", lineHeight: 1.5 }}>{item.a}</span>
          </div>
        ))}
        {faq.length === 0 && (
          <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>Aucune réponse pour cette langue.</span>
        )}
      </div>

      {/* Relance WhatsApp */}
      {hasWhatsapp && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={monoLabel}>Relance panier abandonné · WhatsApp Business</span>
          {showFr && (
            <div style={{ border: "1px solid var(--border)", background: "var(--steel-tint)", padding: "10px 12px", fontSize: "13px", lineHeight: 1.55 }}>
              {CART_FR}
            </div>
          )}
          {showAr && (
            <div
              dir="rtl"
              style={{ border: "1px solid var(--border)", background: "var(--steel-tint)", padding: "10px 12px", fontSize: "13px", lineHeight: 1.55 }}
            >
              {CART_AR}
            </div>
          )}
        </div>
      )}

      {/* Lignée */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "3px" }}>
        <span style={monoLabel}>Lignée</span>
        <span style={{ fontSize: "12px", color: "var(--muted-foreground)", lineHeight: 1.5 }}>
          Prix, stock et délais lus dans le catalogue synchronisé. La relance ne part qu&apos;aux clients ayant ouvert la conversation, conformément aux règles WhatsApp Business.
        </span>
      </div>
    </div>
  );
}