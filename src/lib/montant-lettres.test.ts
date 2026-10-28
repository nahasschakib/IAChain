import { describe, it, expect } from "vitest";
import { nombreEnLettres, montantEnLettres } from "./montant-lettres";

describe("nombreEnLettres", () => {
  it.each([
    [0, "zéro"],
    [1, "un"],
    [16, "seize"],
    [21, "vingt et un"],
    [22, "vingt-deux"],
    [71, "soixante et onze"],
    [77, "soixante-dix-sept"],
    [80, "quatre-vingts"],
    [81, "quatre-vingt-un"],
    [91, "quatre-vingt-onze"],
    [99, "quatre-vingt-dix-neuf"],
    [100, "cent"],
    [101, "cent un"],
    [200, "deux cents"],
    [201, "deux cent un"],
    [280, "deux cent quatre-vingts"],
    [1000, "mille"],
    [1001, "mille un"],
    [2000, "deux mille"],
    [80000, "quatre-vingt mille"],
    [200000, "deux cent mille"],
    [1000000, "un million"],
    [2000000, "deux millions"],
    [1000000000, "un milliard"],
  ])("%i → %s", (n, attendu) => {
    expect(nombreEnLettres(n)).toBe(attendu);
  });

  it("refuse un nombre négatif, décimal ou trop grand", () => {
    expect(() => nombreEnLettres(-1)).toThrow();
    expect(() => nombreEnLettres(1.5)).toThrow();
    expect(() => nombreEnLettres(1e12)).toThrow();
  });
});

describe("montantEnLettres", () => {
  it("écrit les dirhams au singulier et au pluriel", () => {
    expect(montantEnLettres(1)).toBe("un dirham");
    expect(montantEnLettres(2)).toBe("deux dirhams");
    expect(montantEnLettres(0)).toBe("zéro dirham");
  });

  it("écrit un total TTC courant", () => {
    expect(montantEnLettres(33060)).toBe("trente-trois mille soixante dirhams");
  });

  it("ajoute les centimes quand il y en a", () => {
    expect(montantEnLettres(12.5)).toBe("douze dirhams et cinquante centimes");
    expect(montantEnLettres(1.01)).toBe("un dirham et un centime");
  });

  it("met « de » après un nombre rond de millions", () => {
    expect(montantEnLettres(2000000)).toBe("deux millions de dirhams");
  });

  it("refuse un montant négatif ou non fini", () => {
    expect(() => montantEnLettres(-1)).toThrow();
    expect(() => montantEnLettres(NaN)).toThrow();
  });
});