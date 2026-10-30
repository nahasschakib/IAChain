import { describe, it, expect } from "vitest";
import {
  QUOTA_JOURNALIER_DEFAUT,
  QUOTA_JOURNALIER_FOURNISSEUR,
  verifierQuotaEnvoi,
  cleJourUtc,
} from "./envoi-regle";

describe("verifierQuotaEnvoi", () => {
  it("autorise un envoi sous le plafond et indique ce qui reste", () => {
    expect(verifierQuotaEnvoi(10, 100)).toEqual({ autorise: true, restant: 90 });
  });

  it("autorise le dernier envoi du plafond", () => {
    expect(verifierQuotaEnvoi(99, 100)).toEqual({ autorise: true, restant: 1 });
  });

  it("refuse quand le plafond est atteint", () => {
    const r = verifierQuotaEnvoi(100, 100);
    expect(r.autorise).toBe(false);
    if (!r.autorise) expect(r.raison).toContain("100 envois par jour");
  });

  it("refuse au-dessus du plafond", () => {
    expect(verifierQuotaEnvoi(180, 100).autorise).toBe(false);
  });

  it("utilise 100 envois par jour par défaut", () => {
    expect(QUOTA_JOURNALIER_DEFAUT).toBe(100);
    expect(verifierQuotaEnvoi(99)).toEqual({ autorise: true, restant: 1 });
    expect(verifierQuotaEnvoi(100).autorise).toBe(false);
  });

  it("refuse un plafond supérieur à la limite du fournisseur", () => {
    expect(QUOTA_JOURNALIER_FOURNISSEUR).toBe(250);
    expect(verifierQuotaEnvoi(0, 251).autorise).toBe(false);
    expect(verifierQuotaEnvoi(0, 250).autorise).toBe(true);
  });

  it("refuse un plafond invalide", () => {
    for (const p of [0, -5, 1.5, Number.NaN, Number.POSITIVE_INFINITY])
      expect(verifierQuotaEnvoi(0, p).autorise).toBe(false);
  });

  it("refuse par précaution un nombre d'envois illisible", () => {
    for (const n of [-1, 2.5, Number.NaN, Number.POSITIVE_INFINITY])
      expect(verifierQuotaEnvoi(n, 100).autorise).toBe(false);
  });
});

describe("cleJourUtc", () => {
  it("renvoie la date au format AAAA-MM-JJ", () => {
    expect(cleJourUtc(new Date("2026-10-30T16:17:00Z"))).toBe("2026-10-30");
  });

  it("change de jour exactement à minuit UTC", () => {
    expect(cleJourUtc(new Date("2026-10-30T23:59:59Z"))).toBe("2026-10-30");
    expect(cleJourUtc(new Date("2026-10-31T00:00:00Z"))).toBe("2026-10-31");
  });
});