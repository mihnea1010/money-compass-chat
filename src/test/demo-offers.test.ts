import { describe, expect, it } from "vitest";
import { DEMO_CASHBACK_OFFERS, mergeDemoOffers } from "@/lib/demo-offers";
import type { BankOffer } from "@/lib/savings-offers";

describe("Demo cashback fallback catalog", () => {
  it("adds the demo offers when the database returns none", () => {
    expect(mergeDemoOffers([])).toHaveLength(DEMO_CASHBACK_OFFERS.length);
  });
  it("lets the database row win on a matching id (no duplicate)", () => {
    const dbRow = { ...DEMO_CASHBACK_OFFERS[0]!, summary: "din baza de date" } as BankOffer;
    const merged = mergeDemoOffers([dbRow]);
    expect(merged.filter((o) => o.id === dbRow.id)).toHaveLength(1);
    expect(merged.find((o) => o.id === dbRow.id)?.summary).toBe("din baza de date");
  });
  it("keeps every demo row explicitly simulated (fail-closed status)", () => {
    expect(DEMO_CASHBACK_OFFERS.every((o) => o.offer_status === "demo" && o.source_url === "" && o.id.startsWith("demo-"))).toBe(true);
  });
  it("preserves unrelated database offers alongside the demo catalog", () => {
    const other = { ...DEMO_CASHBACK_OFFERS[0]!, id: "verified-x", offer_status: "verified" } as BankOffer;
    const merged = mergeDemoOffers([other]);
    expect(merged.some((o) => o.id === "verified-x")).toBe(true);
    expect(merged).toHaveLength(DEMO_CASHBACK_OFFERS.length + 1);
  });
});
