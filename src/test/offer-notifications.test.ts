import { describe, expect, it } from "vitest";
import { availableOffers, bestOfferForLocation, isPhysicalLocation, notificationText } from "@/lib/offer-notifications";
import type { MyCard } from "@/lib/my-cards";

const cards: MyCard[] = [
  { id: "bt-debit", bank: "Banca Transilvania", name: "Card de debit", perks: [{ merchant: "Carrefour", percent: 5, status: "demo" }, { merchant: "Parteneri Star", percent: 2, status: "demo" }] },
  { id: "raiffeisen-cashback", bank: "Raiffeisen", name: "Card cashback", perks: [{ merchant: "Carrefour", percent: 7, status: "demo" }, { merchant: "Auchan", percent: 5, status: "demo" }] },
];

describe("isPhysicalLocation", () => {
  it("keeps real physical stores", () => {
    for (const m of ["Carrefour", "Auchan", "OMV", "Petrom", "Lidl", "Mega Image", "Kaufland"]) expect(isPhysicalLocation(m)).toBe(true);
  });
  it("filters out online merchants and abstract programs", () => {
    for (const m of ["Amazon.de electronice", "Cumpărături online marți (Mastercard)", "Click to Pay marți (Mastercard)", "Parteneri Star", "Parteneri Star (puncte)", "Moneyback George", "Direct Booking", "Supermarketuri ING Bazar", "Agenții de turism Star"]) expect(isPhysicalLocation(m)).toBe(false);
  });
});

describe("offer-notifications (matching logic)", () => {
  it("lists only physical-location perks as available offers, sorted by percent", () => {
    const offers = availableOffers(cards);
    expect(offers).toHaveLength(3); // Carrefour x2, Auchan — "Parteneri Star" is filtered out
    expect(offers.every((o) => isPhysicalLocation(o.merchant))).toBe(true);
    expect(offers[0]?.percent).toBe(7);
    expect(offers[0]?.cardBank).toBe("Raiffeisen");
  });
  it("picks the highest-percent card for a matching location", () => {
    const best = bestOfferForLocation(cards, "Carrefour Hiper Dorobanti");
    expect(best?.percent).toBe(7);
    expect(best?.cardBank).toBe("Raiffeisen");
  });
  it("returns null when no card matches the location", () => {
    expect(bestOfferForLocation(cards, "Kaufland")).toBeNull();
  });
  it("builds a concrete notification naming the store, card and percent", () => {
    const best = bestOfferForLocation(cards, "Carrefour")!;
    const { title, body } = notificationText(best);
    expect(title).toContain("Carrefour");
    expect(body).toContain("Raiffeisen");
    expect(body).toContain("7%");
    expect(body).toContain("DEMO");
  });
});
