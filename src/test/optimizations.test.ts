import { describe, it, expect } from "vitest";
import { deadlinePassed, localTaxSaving, pensionTaxSaving, recordOptimization, realizedTotal } from "@/lib/optimization-state";

describe("verified optimization calculations", () => {
  it("caps local discount at 10%: 1100 RON yields 110, not 132", () => expect(localTaxSaving(1100, 12)).toBe(110));
  it("pension deduction caps contribution at 400 EUR, saving 10% not 400 EUR", () => expect(pensionTaxSaving(600, 5)).toBe(200));
  it("keeps March31 inclusive in Romania", () => expect(deadlinePassed(new Date("2026-03-31T20:00:00Z"), 3, 31)).toBe(false));
  it("expires March31 benefits on April1", () => expect(deadlinePassed(new Date("2026-04-01T00:00:00Z"), 3, 31)).toBe(true));
  it("expires May25 actions in October", () => expect(deadlinePassed(new Date("2026-10-28T14:20:00Z"), 5, 25)).toBe(true));
  it("counts confirmed savings only for their year and never dismissed opportunities", () => {
    expect(realizedTotal([{ id: "a", year: 2026, status: "completed", realizedRon: 110 }, { id: "b", year: 2026, status: "dismissed", realizedRon: 200 }, { id: "c", year: 2025, status: "completed", realizedRon: 50 }], 2026)).toBe(110);
  });
  it("repeated completion cannot double-count savings", () => {
    const r = { id: "a", year: 2026, status: "completed" as const, realizedRon: 110 };
    expect(realizedTotal(recordOptimization([r], r), 2026)).toBe(110);
  });
});