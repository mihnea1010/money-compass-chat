import { describe, expect, it } from "vitest";
import { bestCardForStore, perkSummary, RAIFFEISEN_PRESET, type MyCard } from "@/lib/my-cards";
import { DWELL_MS, stepPresence } from "@/lib/store-presence";

const store = { id: "s1", name: "Carrefour Market", lat: 0, lon: 0 };

describe("store presence", () => {
  it("notifies only after 5 minutes in the same store", () => {
    let p = stepPresence({ storeId: null, since: 0, notified: false }, store, 0).next;
    expect(stepPresence(p, store, DWELL_MS - 1000).notify).toBe(false);
    const r = stepPresence(p, store, 5 * 60 * 1000);
    expect(r.notify).toBe(true);
    p = r.next;
    expect(stepPresence(p, store, 10 * 60 * 1000).notify).toBe(false);
  });
});

describe("cards", () => {
  it("picks simulated Raiffeisen 5% only in explicit demo mode", () => {
    const other: MyCard = { id: "x", bank: "ING", name: "c", perks: [{ merchant: "Carrefour", percent: 2 }] };
    const best = bestCardForStore([other, RAIFFEISEN_PRESET], "Carrefour Market", { demo: true });
    expect(best?.card.bank).toBe("Raiffeisen");
    expect(best?.perk.percent).toBe(5);
  });
  it("never recommends demo or user-entered perks as real cashback", () => {
    expect(bestCardForStore([RAIFFEISEN_PRESET], "Carrefour")).toBeNull();
    expect(bestCardForStore([{ id: "x", bank: "ING", name: "c", perks: [{ merchant: "Carrefour", percent: 99 }] }], "Carrefour")).toBeNull();
  });
  it("summarizes extra merchants", () => {
    const c: MyCard = { id: "r", bank: "R", name: "c", perks: ["Auchan", "Carrefour", "A", "B", "C", "D"].map((merchant) => ({ merchant, percent: 5 })) };
    expect(perkSummary(c)).toBe("Beneficii neconfirmate · Auchan, Carrefour și încă 4");
  });
});
