import { describe, it, expect } from "vitest";
import {
  calculerFacture,
  ecartsAvecDevis,
  lireDevisFacturable,
  type DevisFacturable,
  type LigneDevis,
} from "./karima-facture";

const ligne = (p: Partial<LigneDevis> = {}): LigneDevis => ({
  libelle: "Prestation",
  description: null,
  unite: "unité",
  quantite: 1,
  prix_unitaire_ht: 100,
  total_ht: 100,
  prestation_id: null,
  ...p,
});

const devis = (p: Partial<DevisFacturable> = {}): DevisFacturable => ({
  client: "Client SA",
  version: null,
  lignes: [ligne()],
  remise_pct: 0,
  tva_pct: 20,
  total_brut_ht: 100,
  remise_montant: 0,
  total_net_ht: 100,
  tva_montant: 20,
  total_ttc: 120,
  ...p,
});

describe("calculerFacture", () => {
  it("calcule une ligne simple avec TVA 20 %", () => {
    const c = calculerFacture(devis());
    expect(c.total_brut_ht).toBe(100);
    expect(c.remise_montant).toBe(0);
    expect(c.total_net_ht).toBe(100);
    expect(c.tva_montant).toBe(20);
    expect(c.total_ttc).toBe(120);
  });

  it("applique la remise avant la TVA", () => {
    const c = calculerFacture(
      devis({ lignes: [ligne({ quantite: 2, prix_unitaire_ht: 1500.5 })], remise_pct: 10 })
    );
    expect(c.lignes[0].total_ht).toBe(3001);
    expect(c.total_brut_ht).toBe(3001);
    expect(c.remise_montant).toBe(300.1);
    expect(c.total_net_ht).toBe(2700.9);
    expect(c.tva_montant).toBe(540.18);
    expect(c.total_ttc).toBe(3241.08);
    expect(c.tva_detail).toEqual([{ taux: 20, base: 2700.9, montant: 540.18 }]);
  });

  it("recalcule les lignes sans reprendre le total du devis", () => {
    const c = calculerFacture(devis({ lignes: [ligne({ quantite: 3, prix_unitaire_ht: 33.33, total_ht: 1 })] }));
    expect(c.lignes[0].total_ht).toBe(99.99);
    expect(c.total_brut_ht).toBe(99.99);
  });

  it("arrondit la TVA au centime", () => {
    // 99,99 x 20 % = 19,998 → 20,00
    const c = calculerFacture(devis({ lignes: [ligne({ quantite: 3, prix_unitaire_ht: 33.33 })] }));
    expect(c.tva_montant).toBe(20);
    expect(c.total_ttc).toBe(119.99);
  });

  it("additionne plusieurs lignes", () => {
    const c = calculerFacture(
      devis({
        lignes: [ligne({ prix_unitaire_ht: 10.1 }), ligne({ quantite: 4, prix_unitaire_ht: 2.55 })],
        tva_pct: 0,
      })
    );
    expect(c.total_brut_ht).toBe(20.3);
    expect(c.tva_montant).toBe(0);
    expect(c.total_ttc).toBe(20.3);
  });

  it("garde TTC = net + TVA exactement", () => {
    const c = calculerFacture(
      devis({ lignes: [ligne({ quantite: 7, prix_unitaire_ht: 13.37 })], remise_pct: 12.5, tva_pct: 14 })
    );
    expect(Math.round(c.total_ttc * 100)).toBe(Math.round(c.total_net_ht * 100) + Math.round(c.tva_montant * 100));
  });
});

describe("ecartsAvecDevis", () => {
  it("ne signale rien quand le devis est exact", () => {
    const d = devis();
    expect(ecartsAvecDevis(d, calculerFacture(d))).toEqual([]);
  });

  it("signale un écart d'un seul centime", () => {
    const d = devis({ total_ttc: 120.01 });
    const e = ecartsAvecDevis(d, calculerFacture(d));
    expect(e).toHaveLength(1);
    expect(e[0]).toContain("Total TTC");
  });

  it("signale une ligne dont le total ne correspond pas à quantité x prix", () => {
    const d = devis({ lignes: [ligne({ quantite: 2, prix_unitaire_ht: 50, total_ht: 99 })], total_brut_ht: 99 });
    const e = ecartsAvecDevis(d, calculerFacture(d));
    expect(e.some((x) => x.startsWith("Ligne 1"))).toBe(true);
  });
});

const proposition = (p: Record<string, unknown> = {}) => ({
  statut: "Proposition prête",
  client: "Client SA",
  version: "v1",
  lignes: [{ libelle: "Audit", quantite: 1, prix_unitaire_ht: 100, total_ht: 100 }],
  remise_pct: 0,
  tva_pct: 20,
  total_ht: 100,
  total_net_ht: 100,
  tva_montant: 20,
  total_ttc: 120,
  ...p,
});

describe("lireDevisFacturable", () => {
  it("lit une proposition valide, remise absente = 0", () => {
    const r = lireDevisFacturable(proposition());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.devis.client).toBe("Client SA");
      expect(r.devis.remise_montant).toBe(0);
      expect(r.devis.lignes[0].unite).toBe("unité");
      expect(r.devis.lignes[0].prestation_id).toBeNull();
    }
  });

  it.each([
    ["statut différent", { statut: "Brouillon" }],
    ["client vide", { client: "  " }],
    ["aucune ligne", { lignes: [] }],
    ["quantité nulle", { lignes: [{ libelle: "A", quantite: 0, prix_unitaire_ht: 1, total_ht: 0 }] }],
    ["prix négatif", { lignes: [{ libelle: "A", quantite: 1, prix_unitaire_ht: -1, total_ht: 0 }] }],
    ["libellé manquant", { lignes: [{ quantite: 1, prix_unitaire_ht: 1, total_ht: 1 }] }],
    ["remise supérieure à 100", { remise_pct: 101 }],
    ["TVA négative", { tva_pct: -1 }],
    ["total TTC absent", { total_ttc: undefined }],
    ["remise sans montant de remise", { remise_pct: 10 }],
  ])("refuse : %s", (_nom, surcharge) => {
    expect(lireDevisFacturable(proposition(surcharge)).ok).toBe(false);
  });

  it("refuse plus de 100 lignes", () => {
    const lignes = Array.from({ length: 101 }, () => ({ libelle: "A", quantite: 1, prix_unitaire_ht: 1, total_ht: 1 }));
    expect(lireDevisFacturable(proposition({ lignes })).ok).toBe(false);
  });

  it("refuse une entrée nulle", () => {
    expect(lireDevisFacturable(null).ok).toBe(false);
  });
});