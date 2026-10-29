import { describe, expect, it } from "vitest";
import { availableOffers, bestOfferForLocation, notificationText } from "@/lib/offer-notifications";
import type { MyCard } from "@/lib/my-cards";

const cards: MyCard[] = [
  { id: "bt-debit", bank: "Banca Transilvania", name: "Card de debit", perks: [{ merchant: "Carrefour", percent: 5, status: "demo" }, { merchant: "Parteneri Star", percent: 2, status: "demo" }] },
  { id: "raiffeisen-cashback", bank: "Raiffeisen", name: "Card cashback", perks: [{ merchant: "Carrefour", percent: 7, status: "demo" }, { merchant: "Auchan", percent: 5, status: "demo" }] },
];

describe("offer-notifications (matching logic)", () => {
  it("lists every card perk as an available offer, sorted by percent", () => {
    const offers = availableOffers(cards);
    expect(offers).toHaveLength(4);
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
