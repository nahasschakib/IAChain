import { describe, it, expect } from "vitest";
import { validerImap } from "./messagerie-regle";

const valide = {
  identifiant: "contact@socytay.ma",
  motDePasse: "secret",
  imapHote: "imap.nindomail.com",
  imapPort: "993",
  smtpHote: "smtp.nindomail.com",
  smtpPort: "465",
};

function erreurs(brut: Record<string, unknown>, existe = false) {
  const r = validerImap(brut, existe);
  return r.ok ? null : r.erreurs;
}

describe("validerImap", () => {
  it("accepte une saisie complète et normalise l'identifiant et les hôtes", () => {
    const r = validerImap(
      { ...valide, identifiant: "  Contact@Socytay.MA ", imapHote: "IMAP.Nindomail.com" },
      false
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.valeurs.identifiant).toBe("contact@socytay.ma");
      expect(r.valeurs.imapHote).toBe("imap.nindomail.com");
      expect(r.valeurs.imapPort).toBe(993);
      expect(r.valeurs.smtpPort).toBe(465);
      expect(r.valeurs.motDePasse).toBe("secret");
    }
  });

  it("accepte le port SMTP 587", () => {
    expect(validerImap({ ...valide, smtpPort: "587" }, false).ok).toBe(true);
  });

  it("refuse une adresse e-mail invalide", () => {
    for (const identifiant of ["", "contact", "a@b", "a b@c.ma"]) {
      expect(erreurs({ ...valide, identifiant })?.identifiant).toBeDefined();
    }
  });

  it("refuse les adresses IP, localhost et les noms sans extension", () => {
    for (const h of ["127.0.0.1", "10.0.0.5", "localhost", "imap", "169.254.169.254", ""]) {
      expect(erreurs({ ...valide, imapHote: h })?.imapHote).toBeDefined();
      expect(erreurs({ ...valide, smtpHote: h })?.smtpHote).toBeDefined();
    }
  });

  it("refuse un port hors liste", () => {
    expect(erreurs({ ...valide, imapPort: "143" })?.imapPort).toBeDefined();
    expect(erreurs({ ...valide, imapPort: "abc" })?.imapPort).toBeDefined();
    expect(erreurs({ ...valide, smtpPort: "25" })?.smtpPort).toBeDefined();
  });

  it("exige un mot de passe à la première saisie", () => {
    expect(erreurs({ ...valide, motDePasse: "" }, false)?.motDePasse).toBeDefined();
  });

  it("conserve le mot de passe enregistré quand le champ est vide", () => {
    const r = validerImap({ ...valide, motDePasse: "" }, true);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valeurs.motDePasse).toBeNull();
  });

  it("ne rogne pas le mot de passe et refuse un mot de passe trop long", () => {
    const r = validerImap({ ...valide, motDePasse: " a b " }, false);
    expect(r.ok && r.valeurs.motDePasse).toBe(" a b ");
    expect(erreurs({ ...valide, motDePasse: "x".repeat(201) })?.motDePasse).toBeDefined();
  });
});