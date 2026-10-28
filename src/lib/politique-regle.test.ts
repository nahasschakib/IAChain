import { describe, it, expect } from "vitest";
import {
  remiseAdmissible,
  verdictRemise,
  erreursPolitique,
  type PolitiqueTarifaire,
} from "./politique-regle";

const MOTIF = "Volume superieur a 1 M MAD";

const politique: PolitiqueTarifaire = {
  id: 1,
  version: 1,
  plafonds: { standard: 5, grands_comptes: 10, derogation: 15 },
  segments: { PME: "standard", "Grand compte": "grands_comptes" },
  motifs: [MOTIF],
};

describe("remiseAdmissible", () => {
  it("refuse de conclure sans politique", () => {
    const r = remiseAdmissible(null, "PME");
    expect(r.defini).toBe(false);
    if (!r.defini) expect(r.raison).toContain("non définie");
  });

  it("refuse un segment non rattaché à une grille", () => {
    const r = remiseAdmissible(politique, "Artisan");
    expect(r.defini).toBe(false);
    if (!r.defini) expect(r.raison).toContain("non rattaché");
  });

  it("signale un segment vide comme indéterminé", () => {
    const r = remiseAdmissible(politique, "");
    expect(r.defini).toBe(false);
    if (!r.defini) expect(r.raison).toContain("indéterminé");
  });

  it("renvoie la grille et les plafonds du segment", () => {
    expect(remiseAdmissible(politique, "PME")).toEqual({
      defini: true,
      grille: "standard",
      plafond: 5,
      plafondDerogation: 15,
    });
    expect(remiseAdmissible(politique, "Grand compte")).toMatchObject({
      grille: "grands_comptes",
      plafond: 10,
      plafondDerogation: 15,
    });
  });

  it("ne descend jamais le plafond de dérogation sous le plafond du segment", () => {
    const p: PolitiqueTarifaire = {
      ...politique,
      plafonds: { standard: 5, grands_comptes: 20, derogation: 15 },
    };
    expect(remiseAdmissible(p, "Grand compte")).toMatchObject({ plafond: 20, plafondDerogation: 20 });
  });
});

describe("verdictRemise", () => {
  it("renvoie « À contrôler manuellement » sans politique ou sans segment connu", () => {
    expect(verdictRemise(null, "PME", 3).verdict).toBe("À contrôler manuellement");
    expect(verdictRemise(politique, "Artisan", 3).verdict).toBe("À contrôler manuellement");
  });

  it("traite l'absence de politique avant la validité de la remise", () => {
    expect(verdictRemise(null, "PME", Number.NaN).verdict).toBe("À contrôler manuellement");
  });

  it("rejette une remise invalide", () => {
    for (const r of [Number.NaN, Infinity, -1, 101]) {
      const v = verdictRemise(politique, "PME", r);
      expect(v.verdict).toBe("Non conforme");
      expect(v.motif).toContain("invalide");
    }
  });

  it("accepte une remise dans le plafond, bornes comprises", () => {
    expect(verdictRemise(politique, "PME", 0).verdict).toBe("Conforme");
    expect(verdictRemise(politique, "PME", 5).verdict).toBe("Conforme");
    expect(verdictRemise(politique, "Grand compte", 10).verdict).toBe("Conforme");
    expect(verdictRemise(politique, "PME", 5).motif).toContain("dans le plafond");
  });

  it("formate les pourcentages avec une virgule", () => {
    expect(verdictRemise(politique, "PME", 2.5).motif).toContain("2,5");
  });

  it("rejette au-delà du plafond absolu, même avec un motif valide", () => {
    const v = verdictRemise(politique, "PME", 15.01, MOTIF);
    expect(v.verdict).toBe("Non conforme");
    expect(v.motif).toContain("plafond absolu");
  });

  it("exige un motif d'exception entre le plafond et le plafond absolu", () => {
    for (const m of [undefined, "", "   "]) {
      const v = verdictRemise(politique, "PME", 8, m);
      expect(v.verdict).toBe("Non conforme");
      expect(v.motif).toContain("motif d'exception est requis");
    }
  });

  it("rejette un motif absent de la politique", () => {
    const v = verdictRemise(politique, "PME", 8, "Motif inventé");
    expect(v.verdict).toBe("Non conforme");
    expect(v.motif).toContain("absent de la politique");
  });

  it("exige une dérogation avec un motif valide, borne absolue comprise", () => {
    for (const r of [8, 15]) {
      const v = verdictRemise(politique, "PME", r, MOTIF);
      expect(v.verdict).toBe("Dérogation requise");
      expect(v.motif).toContain("approbation de la direction requise");
    }
  });

  it("ignore les espaces autour du motif", () => {
    expect(verdictRemise(politique, "PME", 8, `  ${MOTIF} `).verdict).toBe("Dérogation requise");
  });
});

describe("erreursPolitique", () => {
  const { id: _id, version: _version, ...valide } = politique;

  it("accepte une politique valide", () => {
    expect(erreursPolitique(valide)).toEqual([]);
  });

  it("refuse un plafond hors de 0 à 100 ou non numérique", () => {
    for (const v of [-1, 101, Number.NaN]) {
      const e = erreursPolitique({ ...valide, plafonds: { ...valide.plafonds, standard: v } });
      expect(e.some((x) => x.includes("standard"))).toBe(true);
    }
  });

  it("refuse une dérogation inférieure aux autres plafonds", () => {
    const e = erreursPolitique({ ...valide, plafonds: { standard: 5, grands_comptes: 10, derogation: 8 } });
    expect(e.some((x) => x.includes("dérogation"))).toBe(true);
  });

  it("refuse l'absence de segment", () => {
    const e = erreursPolitique({ ...valide, segments: {} });
    expect(e.some((x) => x.includes("Aucun segment"))).toBe(true);
  });

  it("refuse un motif vide ou en double", () => {
    expect(erreursPolitique({ ...valide, motifs: [MOTIF, "  "] }).some((x) => x.includes("vide"))).toBe(true);
    expect(erreursPolitique({ ...valide, motifs: [MOTIF, ` ${MOTIF}`] }).some((x) => x.includes("double"))).toBe(true);
  });
});