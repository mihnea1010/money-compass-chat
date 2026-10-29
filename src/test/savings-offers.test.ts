import { describe, expect, it } from "vitest";
import { applyAiOrder, buildSavingsOffers, rankOffers, EXAMPLE_SETTINGS, EXAMPLE_TRANSACTIONS, type BankOffer, type SavingsOffer } from "@/lib/savings-offers";
import { EMPTY_SETTINGS } from "@/lib/optimization-state";
import { subscriptionAlert } from "@/lib/spending-alert";
const date = new Date("2026-10-28T14:47:00Z");
const base = { merchant_pattern: null, merchant_rate_percent: null, monthly_cap_ron: null, annual_cap_ron: null, annual_fee_ron: null, valid_from: null, valid_until: null, effort_minutes: 20, steps: [], conditions: "", source_url: "https://x.ro", verified_on: "2026-10-28", offer_status: "demo", summary: "", product: "p", bank: "b", title: "t" };
const BT: BankOffer = { ...base, id: "bt", is_credit: true, rate_percent: 2, merchant_pattern: "carrefour", merchant_rate_percent: 5, categories: ["mancare", "shopping", "transport"], monthly_cap_ron: 600 };
const MC: BankOffer = { ...base, id: "mc", is_credit: false, rate_percent: 10, categories: ["shopping"], annual_cap_ron: 50, annual_fee_ron: 0, valid_from: "2026-10-06", valid_until: "2026-12-29" };
describe("Savings offer rules", () => {
  it("orders opportunities by money saved / implementation time", () => {
    const offers = [{ id: "slow", annualRon: 1000, minutes: 100 }, { id: "fast", annualRon: 500, minutes: 5 }] as SavingsOffer[];
    expect(rankOffers(offers).map((o) => o.id)).toEqual(["fast", "slow"]);
  });
  it("computes 5% Carrefour + 2% elsewhere (2000*5% + 2866.67*2%) * 12 from the database offer", () => {
    expect(buildSavingsOffers(EXAMPLE_TRANSACTIONS, EXAMPLE_SETTINGS, date, [], [BT], { demoScenario: true }).find((o) => o.id === "bt")?.annualRon).toBe(1888);
  });
  it("caps campaign cashback at its annual cap", () => {
    expect(buildSavingsOffers(EXAMPLE_TRANSACTIONS, EXAMPLE_SETTINGS, date, [], [MC], { demoScenario: true }).find((o) => o.id === "mc")?.annualRon).toBe(50);
  });
  it("keeps expired demo inspectable but gives no estimate", () => {
    expect(buildSavingsOffers(EXAMPLE_TRANSACTIONS, EXAMPLE_SETTINGS, new Date("2026-12-30T12:00:00Z"), [], [MC], { demoScenario: true }).find((o) => o.id === "mc")?.annualRon).toBe(0);
  });
  it("never promises credit-card cashback without confirmed costs and full repayment", () => {
    expect(buildSavingsOffers(EXAMPLE_TRANSACTIONS, EMPTY_SETTINGS, date, [], [BT], { demoScenario: true }).find((o) => o.id === "bt")?.annualRon).toBe(0);
  });
  it("deducts annual card costs from rewards", () => {
    expect(buildSavingsOffers(EXAMPLE_TRANSACTIONS, { ...EXAMPLE_SETTINGS, directAnnualCostRon: 200 }, date, [], [BT], { demoScenario: true }).find((o) => o.id === "bt")?.annualRon).toBe(1688);
  });
  it("does not put subscriptions in the savings offers", () => {
    expect(buildSavingsOffers(EXAMPLE_TRANSACTIONS, EXAMPLE_SETTINGS, date, [], [BT], { demoScenario: true }).some((o) => o.id.startsWith("subscription"))).toBe(false);
  });
  it("removes reviewed opportunities", () => {
    expect(buildSavingsOffers(EXAMPLE_TRANSACTIONS, EXAMPLE_SETTINGS, date, [{ id: "bt", year: 2026, status: "completed", realizedRon: 100 }], [BT]).some((o) => o.id === "bt")).toBe(false);
  });
  it("AI order wins, unknown ids keep their place after", () => {
    const offers = [{ id: "a" }, { id: "b" }, { id: "c" }] as SavingsOffer[];
    expect(applyAiOrder(offers, ["c"]).map((o) => o.id)).toEqual(["c", "a", "b"]);
  });
  it("flags subscriptions above 300 lei/month as excessive", () => {
    expect(subscriptionAlert(EXAMPLE_TRANSACTIONS).excessive).toBe(true);
  });
});
