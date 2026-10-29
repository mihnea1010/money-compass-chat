import { describe, expect, it } from "vitest";
import { bankOfferStatus, EVIDENCE_TERMS } from "@/lib/offer-integrity";
import { buildSavingsOffers, EXAMPLE_SETTINGS, EXAMPLE_TRANSACTIONS, type BankOffer } from "@/lib/savings-offers";

// Synthetic verification records exercise the gate; they are not published bank offers.
const fixture: BankOffer = {
  id: "synthetic-test", bank: "BCR", product: "Synthetic test product", title: "Test", summary: "Test only",
  is_credit: false, rate_percent: 1, merchant_pattern: null, merchant_rate_percent: null, categories: ["shopping"],
  monthly_cap_ron: null, annual_cap_ron: null, annual_fee_ron: 0, valid_from: "2026-10-01", valid_until: "2026-10-31",
  effort_minutes: 5, steps: [], conditions: "Synthetic eligibility conditions", source_url: "https://www.bcr.ro/test-only-terms",
  verified_on: "2026-10-01", offer_status: "verified",
};
function evidenced(): BankOffer {
  return { ...fixture, verification_evidence: Object.fromEntries(EVIDENCE_TERMS.map((term) => [term, { url: fixture.source_url, excerpt: "Synthetic supporting excerpt, test only", value: fixture[term] }])) };
}
const day = "2026-10-29";
const today = new Date(`${day}T12:00:00Z`);
const result = (offer: BankOffer, demoScenario = false) => buildSavingsOffers(EXAMPLE_TRANSACTIONS, EXAMPLE_SETTINGS, today, [], [offer], { demoScenario }).find((o) => o.id === offer.id);
describe("bank offer provenance", () => {
  it("demo wins over explicit verified flag, homepage and legacy verification date", () => {
    const offer = { ...evidenced(), id: "demo-test" };
    expect(bankOfferStatus(offer, day).status).toBe("demo");
    expect(result(offer)?.annualRon).toBe(0);
    expect(result(offer)?.url).toBe("");
    expect(result(offer)?.calculable).toBe(false);
  });
  it("calculates demo amounts only in an explicit illustrative scenario", () => {
    expect(result({ ...fixture, offer_status: "demo" }, true)?.annualRon).toBe(344);
  });
  it("missing source is never verified and contributes no personal savings", () => {
    const offer = { ...evidenced(), source_url: "" };
    expect(bankOfferStatus(offer, day).status).toBe("unverified");
    expect(result(offer)?.annualRon).toBe(0);
  });
  it("official homepage and verification date do not establish verification", () => {
    expect(bankOfferStatus({ ...evidenced(), source_url: "https://www.bcr.ro/" }, day).status).toBe("unverified");
  });
  it("a product page without evidence is unverified", () => {
    expect(bankOfferStatus(fixture, day).status).toBe("unverified");
  });
  it.each(EVIDENCE_TERMS)("missing evidence for %s prevents verification", (term) => {
    const offer = evidenced();
    const evidence = { ...(offer.verification_evidence as Record<string, unknown>) };
    delete evidence[term];
    expect(bankOfferStatus({ ...offer, verification_evidence: evidence }, day).status).toBe("unverified");
  });
  it("explicit complete evidence permits verification for current terms", () => {
    expect(bankOfferStatus(evidenced(), day).status).toBe("verified");
    expect(result(evidenced())?.annualRon).toBe(344);
  });
  it("changed percentages invalidate evidence instead of inheriting verification", () => {
    expect(bankOfferStatus({ ...evidenced(), rate_percent: 5 }, day).status).toBe("unverified");
  });
  it.each(["", "2026-02-30", "2026-10-30"])("invalid or future verification date %s is rejected", (verified_on) => {
    expect(bankOfferStatus({ ...evidenced(), verified_on }, day).status).toBe("unverified");
  });
  it("expired data stays inspectable without an actionable estimate", () => {
    const offer = { ...evidenced(), valid_until: "2026-10-28" };
    expect(bankOfferStatus(offer, day).status).toBe("unverified");
    expect(result(offer)?.annualRon).toBe(0);
    expect(result(offer)?.url).toBe("");
  });
  it.each(["valid_from", "valid_until", "annual_fee_ron"] as const)("incomplete %s prevents real estimates", (field) => {
    const offer = { ...evidenced(), [field]: null };
    expect(bankOfferStatus(offer, day).status).toBe("unverified");
    expect(result(offer)?.calculable).toBe(false);
  });
  it("invalid demo merchant patterns never crash calculations", () => {
    expect(result({ ...fixture, offer_status: "demo", merchant_pattern: "[" }, true)?.annualRon).toBe(0);
  });
  it("expired demo periods never produce even hypothetical savings", () => {
    expect(result({ ...fixture, offer_status: "demo", valid_until: "2026-10-28" }, true)?.annualRon).toBe(0);
  });
});