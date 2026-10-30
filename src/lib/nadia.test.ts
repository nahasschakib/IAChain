import { describe, it, expect } from "vitest";
import { controlerFacture, lireControleDevis, type ControleDevis } from "./nadia";
import type { PolitiqueTarifaire } from "./politique-regle";

const MOTIF = "Volume superieur a 1 M MAD";

const politique: PolitiqueTarifaire = {
  id: 1,
  version: 3,
  plafonds: { standard: 5, grands_comptes: 10, derogation: 15 },
  segments: { PME: "standard", "Grand compte": "grands_comptes" },
  motifs: [MOTIF],
};

const devisConforme: ControleDevis = {
  verdict: "Conforme",
  remise_pct: 5,
  segment: "PME",
  motif_exception: "",
  politique_version: 2,
};

const devisDerogation: ControleDevis = {
  verdict: "Dérogation requise",
  remise_pct: 8,
  segment: "PME",
  motif_exception: MOTIF,
  politique_version: 2,
};

describe("lireControleDevis", () => {
  it("renvoie null pour un résultat illisible", () => {
    expect(lireControleDevis(null)).toBeNull();
    expect(lireControleDevis(undefined)).toBeNull();
    expect(lireControleDevis("texte")).toBeNull();
    expect(lireControleDevis({})).toBeNull();
  });

  it("renvoie null pour un verdict inconnu", () => {
    expect(lireControleDevis({ verdict: "Peut-être", remise_pct: 5 })).toBeNull();
    expect(lireControleDevis({ verdict: 3, remise_pct: 5 })).toBeNull();
  });

  it("renvoie null pour une remise absente ou hors de 0 à 100", () => {
    for (const remise_pct of [undefined, "abc", -1, 101]) {
      expect(lireControleDevis({ verdict: "Conforme", remise_pct })).toBeNull();
    }
  });

  it("accepte les verdicts connus et les bornes de remise", () => {
    for (const verdict of ["Conforme", "Dérogation requise", "Non conforme", "À contrôler manuellement"]) {
      expect(lireControleDevis({ verdict, remise_pct: 0 })?.verdict).toBe(verdict);
    }
    expect(lireControleDevis({ verdict: "Conforme", remise_pct: 100 })?.remise_pct).toBe(100);
  });

  it("relit tous les champs d'un résultat complet", () => {
    expect(
      lireControleDevis({
        verdict: "Dérogation requise",
        remise_pct: 8,
        segment: "PME",
        motif_exception: MOTIF,
        politique_version: 2,
      })
    ).toEqual({
      verdict: "Dérogation requise",
      remise_pct: 8,
      segment: "PME",
      motif_exception: MOTIF,
      politique_version: 2,
    });
  });

  it("met des valeurs par défaut sur les champs facultatifs", () => {
    expect(lireControleDevis({ verdict: "Conforme", remise_pct: 5 })).toEqual({
      verdict: "Conforme",
      remise_pct: 5,
      segment: "",
      motif_exception: "",
      politique_version: null,
    });
    expect(
      lireControleDevis({ verdict: "Conforme", remise_pct: 5, segment: 7, motif_exception: 7 })
    ).toMatchObject({ segment: "", motif_exception: "" });
  });

  it("lit la version de politique, y compris sous forme de texte, sinon null", () => {
    const lire = (v: unknown) => lireControleDevis({ verdict: "Conforme", remise_pct: 5, politique_version: v });
    expect(lire(4)?.politique_version).toBe(4);
    expect(lire("4")?.politique_version).toBe(4);
    expect(lire(null)?.politique_version).toBeNull();
    expect(lire(undefined)?.politique_version).toBeNull();
    expect(lire("abc")?.politique_version).toBeNull();
  });
});

describe("controlerFacture : devis non exploitable", () => {
  it("refuse un devis dont le contrôle n'est ni Conforme ni Dérogation requise", () => {
    for (const verdict of ["Non conforme", "À contrôler manuellement"]) {
      const r = controlerFacture(politique, { ...devisConforme, verdict }, 5, 42);
      expect(r.verdict).toBe("Non conforme");
      expect(r.motif).toContain(verdict);
      expect(r.action_corrective).toContain("Relancer le contrôle de remise");
      expect(r.plafond_pct).toBeNull();
    }
  });

  it("juge le verdict du devis avant de regarder la politique", () => {
    const r = controlerFacture(null, { ...devisConforme, verdict: "Non conforme" }, 5, 42);
    expect(r.verdict).toBe("Non conforme");
    expect(r.motif).toContain("contrôle de remise du devis");
  });
});

describe("controlerFacture : remise facturée", () => {
  it("refuse une remise différente de celle contrôlée", () => {
    const r = controlerFacture(politique, devisConforme, 6, 42);
    expect(r.verdict).toBe("Non conforme");
    expect(r.motif).toContain("diffère");
    expect(r.motif).toContain("6 %");
    expect(r.motif).toContain("5 %");
    expect(r.action_corrective).toContain("Salma");
  });

  it("compare au centième de point près", () => {
        expect(controlerFacture(politique, devisConforme, 4.996, 42).verdict).toBe("Conforme");
    expect(controlerFacture(politique, devisConforme, 5.01, 42).verdict).toBe("Non conforme");
  });

  it("formate les pourcentages avec une virgule", () => {
    const r = controlerFacture(politique, devisConforme, 5.5, 42);
    expect(r.motif).toContain("5,5 %");
  });
});

describe("controlerFacture : politique applicable", () => {
  it("renvoie « À contrôler manuellement » sans politique", () => {
    const r = controlerFacture(null, devisConforme, 5, 42);
    expect(r.verdict).toBe("À contrôler manuellement");
    expect(r.motif).toContain("non définie");
    expect(r.action_corrective).toContain("Définir la politique tarifaire");
    expect(r.politique_version).toBeNull();
    expect(r.plafond_pct).toBeNull();
  });

  it("renvoie « À contrôler manuellement » si le segment n'est plus rattaché à une grille", () => {
    const r = controlerFacture(politique, { ...devisConforme, segment: "Artisan" }, 5, 42);
    expect(r.verdict).toBe("À contrôler manuellement");
    expect(r.motif).toContain("non rattaché");
    expect(r.action_corrective).toContain("Rattacher ce segment");
    expect(r.politique_version).toBe(3);
  });
});

describe("controlerFacture : verdict final", () => {
  it("accepte une remise conforme et reporte les références du contrôle", () => {
    expect(controlerFacture(politique, devisConforme, 5, 42)).toEqual({
      verdict: "Conforme",
      motif: expect.stringContaining("dans le plafond"),
      action_corrective: null,
      remise_pct: 5,
      segment: "PME",
      plafond_pct: 5,
      derogation_couverte: false,
      politique_version: 3,
      politique_devis_version: 2,
      nadia_run_id: 42,
    });
  });

  it("applique le plafond de la grille du segment", () => {
    const devis = { ...devisConforme, segment: "Grand compte", remise_pct: 10 };
    const r = controlerFacture(politique, devis, 10, 7);
    expect(r.verdict).toBe("Conforme");
    expect(r.plafond_pct).toBe(10);
    expect(r.nadia_run_id).toBe(7);
  });

  it("accepte une dérogation déjà validée sur le devis", () => {
    const r = controlerFacture(politique, devisDerogation, 8, 42);
    expect(r.verdict).toBe("Conforme");
    expect(r.derogation_couverte).toBe(true);
    expect(r.action_corrective).toBeNull();
    expect(r.plafond_pct).toBe(5);
  });

   it("refuse une remise devenue dérogatoire alors que le devis a été validé sans dérogation", () => {
    // Devis « Conforme » à 8 % sous l'ancienne politique, avec un motif encore valide ; le plafond actuel est à 5 %.
    const devis = { ...devisConforme, remise_pct: 8, motif_exception: MOTIF };
    const r = controlerFacture(politique, devis, 8, 42);
    expect(r.verdict).toBe("Non conforme");
    expect(r.motif).toContain("validé sans dérogation");
    expect(r.action_corrective).toContain("La politique a changé");
    expect(r.derogation_couverte).toBe(false);
    expect(r.plafond_pct).toBe(5);
  });

  it("refuse une remise au-dessus du plafond sans motif d'exception", () => {
    const r = controlerFacture(politique, { ...devisConforme, remise_pct: 8 }, 8, 42);
    expect(r.verdict).toBe("Non conforme");
    expect(r.motif).toContain("motif d'exception est requis");
    expect(r.action_corrective).toContain("rechiffrer");
    expect(r.derogation_couverte).toBe(false);
    expect(r.plafond_pct).toBe(5);
  });

  it("refuse une dérogation dont le motif a disparu de la politique", () => {
    const devis = { ...devisDerogation, motif_exception: "Ancien motif" };
    const r = controlerFacture(politique, devis, 8, 42);
    expect(r.verdict).toBe("Non conforme");
    expect(r.motif).toContain("absent de la politique");
    expect(r.action_corrective).toContain("rechiffrer");
    expect(r.derogation_couverte).toBe(false);
    expect(r.plafond_pct).toBe(5);
  });

  it("refuse une remise au-delà du plafond absolu actuel", () => {
    const r = controlerFacture(politique, { ...devisDerogation, remise_pct: 20 }, 20, 42);
    expect(r.verdict).toBe("Non conforme");
    expect(r.motif).toContain("plafond absolu");
    expect(r.action_corrective).toContain("rechiffrer");
    expect(r.derogation_couverte).toBe(false);
    expect(r.plafond_pct).toBe(5);
  });

  it("ne renvoie jamais un verdict hors des trois valeurs prévues", () => {
    const cas = [
      controlerFacture(politique, devisConforme, 5, 1),
      controlerFacture(politique, devisDerogation, 8, 1),
      controlerFacture(null, devisConforme, 5, 1),
      controlerFacture(politique, { ...devisConforme, verdict: "Non conforme" }, 5, 1),
    ];
    for (const r of cas) {
      expect(["Conforme", "Non conforme", "À contrôler manuellement"]).toContain(r.verdict);
    }
  });
});