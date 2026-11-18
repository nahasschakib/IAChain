import Link from "next/link";
import type { CSSProperties } from "react";
import { listPrestations } from "@/lib/catalogue-prestations";
import { getPolitiqueActive } from "@/lib/politique-tarifaire";

const CARD: CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderLeft: "4px solid var(--amber)",
  marginTop: 20,
  borderRadius: 14,
  padding: 20,
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
};

type Etape = { titre: string; consequence: string };

// Carte « Mise en route » : signale à l'administrateur les réglages sans lesquels les agents
// du devis ne peuvent pas travailler. Disparaît quand tout est saisi.
export default async function MiseEnRouteCard({ orgId }: { orgId: string }) {
  const [prestations, politique] = await Promise.all([
    listPrestations(orgId, true),
    getPolitiqueActive(orgId),
  ]);

  const etapes: Etape[] = [];
  if (prestations.length === 0) {
    etapes.push({
      titre: "Catalogue de prestations",
      consequence: "Aucune prestation active : Salma ne peut pas chiffrer un devis.",
    });
  }
  if (!politique) {
    etapes.push({
      titre: "Politique tarifaire",
      consequence:
        "Aucune politique active : aucune remise admissible n'est proposée et les dossiers repartent en contrôle manuel.",
    });
  }
  if (etapes.length === 0) return null;

  return (
    <div style={CARD}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Mise en route de votre organisation</div>
      <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--graphite)", margin: "0 0 14px" }}>
        {etapes.length === 1 ? "Un réglage est" : "Deux réglages sont"} nécessaire{etapes.length === 1 ? "" : "s"} pour que les agents puissent traiter vos devis.
      </p>
      <div style={{ display: "grid", gap: 12 }}>
        {etapes.map((e) => (
          <div key={e.titre} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{e.titre}</div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--graphite)" }}>{e.consequence}</div>
            </div>
            <Link href="/settings" style={{ fontSize: 12, fontWeight: 600, color: "var(--steel)", whiteSpace: "nowrap" }}>
              Compléter dans Paramètres →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}