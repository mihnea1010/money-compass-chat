import { describe, it, expect } from "vitest";
import { cardAlerts, eligibleVolumeGap } from "@/lib/card-loops";
import { EMPTY_SETTINGS } from "@/lib/optimization-state";
describe("declared card data and unverified terms", () => {
  it("10000 RON threshold minus 8500 eligible incoming is 1500, not merchant spend", () => expect(eligibleVolumeGap(8500)).toBe(1500));
  it("never infers ownership from demo bank balances", () => expect(cardAlerts(EMPTY_SETTINGS, new Date("2026-10-28T14:20:00Z"))).toEqual([]));
  it("a reached threshold has no fee-gap alert", () => expect(cardAlerts({ ...EMPTY_SETTINGS, cards: ["bcr"], bcrEligibleVolume: 10000 }, new Date("2026-10-28T14:20:00Z"))).toEqual([]));
  it("does not assert an unsupported BCR threshold or fee", () => expect(cardAlerts({ ...EMPTY_SETTINGS, cards: ["bcr"], bcrEligibleVolume: 8500 }, new Date("2026-10-28T14:20:00Z"))).toEqual([]));
  it("does not invent credit due dates", () => expect(cardAlerts({ ...EMPTY_SETTINGS, cards: ["direct"], creditDueRon: 3250 }, new Date("2026-10-28T14:20:00Z"))).toEqual([]));
  it("declared November1 deadline has four days remaining", () => expect(cardAlerts({ ...EMPTY_SETTINGS, cards: ["direct"], creditDueRon: 3250, creditDueDate: "2026-11-01" }, new Date("2026-10-28T14:20:00Z"))[0]?.daysRemaining).toBe(4));
});