import { describe, it, expect } from "vitest";
import { signatureOrganisation } from "./signature-regle";

describe("signatureOrganisation", () => {
  it("utilise le nom commercial en priorité", () => {
    expect(signatureOrganisation({ nom_commercial: "IAChain", raison_sociale: "SOCYTAY SARL" })).toBe("L'équipe IAChain");
  });
  it("se replie sur la raison sociale", () => {
    expect(signatureOrganisation({ nom_commercial: "  ", raison_sociale: "SOCYTAY SARL" })).toBe("L'équipe SOCYTAY SARL");
    expect(signatureOrganisation({ nom_commercial: null, raison_sociale: "Acme" })).toBe("L'équipe Acme");
  });
  it("se replie sur « Le support » sans brand kit ou sans nom", () => {
    expect(signatureOrganisation(null)).toBe("Le support");
    expect(signatureOrganisation({ nom_commercial: "", raison_sociale: "" })).toBe("Le support");
  });
});