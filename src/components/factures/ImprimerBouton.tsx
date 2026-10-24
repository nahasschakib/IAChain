"use client";

export default function ImprimerBouton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{ font: "inherit", fontSize: 13, fontWeight: 600, background: "var(--steel-deep)", color: "#f5f6f8", border: "none", borderRadius: 8, padding: "9px 16px", cursor: "pointer" }}
    >
      Imprimer / PDF
    </button>
  );
}