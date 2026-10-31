import { describe, it, expect } from "vitest";
import {
  QUOTA_JOURNALIER_DEFAUT,
  QUOTA_JOURNALIER_FOURNISSEUR,
  verifierQuotaEnvoi,
  cleJourUtc,
  extraireAdresse,
  objetReponse,
  choisirDestinataire,
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

  it("accepte un plafond jusqu'à la limite propre à un autre fournisseur", () => {
    expect(verifierQuotaEnvoi(0, 400, 500)).toEqual({ autorise: true, restant: 400 });
    expect(verifierQuotaEnvoi(0, 501, 500).autorise).toBe(false);
  });

  it("refuse une limite de fournisseur invalide", () => {
    for (const l of [0, -1, 2.5, Number.NaN])
      expect(verifierQuotaEnvoi(0, 100, l).autorise).toBe(false);
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

describe("extraireAdresse", () => {
  it("lit l'adresse d'un expéditeur « Nom <adresse> »", () => {
    expect(extraireAdresse("Chakib Nahass <cnahass@gmail.com>")).toBe("cnahass@gmail.com");
  });

  it("accepte une adresse seule et la met en minuscules", () => {
    expect(extraireAdresse("Contact@Exemple.MA")).toBe("contact@exemple.ma");
  });

  it("accepte un nom avec virgule entre guillemets", () => {
    expect(extraireAdresse('"Nahass, Chakib" <cnahass@gmail.com>')).toBe("cnahass@gmail.com");
  });

  it("refuse plusieurs destinataires", () => {
    expect(extraireAdresse("A <a@b.ma>, B <c@d.ma>")).toBeNull();
    expect(extraireAdresse("a@b.ma, c@d.ma")).toBeNull();
  });

  it("refuse une adresse illisible ou piégée par un retour à la ligne", () => {
    for (const v of ["x\r\nBcc: y@z.ma <a@b.ma>", "pas une adresse", "Nom <a b@c.ma>", "", null, undefined])
      expect(extraireAdresse(v)).toBeNull();
  });
});

describe("objetReponse", () => {
  it("ajoute Re: une seule fois", () => {
    expect(objetReponse("Note d'informations")).toBe("Re: Note d'informations");
    expect(objetReponse("Re: Test de confirmation")).toBe("Re: Test de confirmation");
    expect(objetReponse("RE : Test")).toBe("RE : Test");
  });

  it("remplace un objet vide et retire les retours à la ligne", () => {
    expect(objetReponse("")).toBe("Re: votre message");
    expect(objetReponse(null)).toBe("Re: votre message");
    expect(objetReponse("Ligne 1\r\nBcc: x@y.ma")).toBe("Re: Ligne 1 Bcc: x@y.ma");
  });
});

describe("choisirDestinataire", () => {
  it("accepte un expéditeur normal", () => {
    expect(choisirDestinataire("Chakib <cnahass@gmail.com>", "contact@socytay.ma")).toEqual({
      ok: true,
      adresse: "cnahass@gmail.com",
    });
  });

  it("refuse la boîte d'envoi elle-même, sans tenir compte des majuscules", () => {
    expect(choisirDestinataire("Contact@Socytay.ma", "contact@socytay.ma").ok).toBe(false);
  });

  it("refuse les adresses automatiques", () => {
    for (const a of ["noreply@exemple.com", "no-reply@exemple.com", "mailer-daemon@exemple.com"])
      expect(choisirDestinataire(a, "contact@socytay.ma").ok).toBe(false);
  });

  it("refuse une adresse illisible", () => {
    expect(choisirDestinataire("???", "contact@socytay.ma").ok).toBe(false);
  });
});