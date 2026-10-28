import { describe, it, expect } from "vitest";
import { buildOptimizations } from "@/lib/optimizations";
import { EMPTY_SETTINGS } from "@/lib/optimization-state";
describe("proactive engine", () => {
  const settings = { ...EMPTY_SETTINGS, localTaxRon: 1100, localDiscountPercent: 10, employee: true, pensionContributionEur: 400, eurRon: 5 };
  it("October does not count expired March or May offers as active", () => {
    const items = buildOptimizations([], settings, new Date("2026-10-28T14:20:00Z"));
    expect(items.filter((t) => !t.closed).map((t) => t.id)).toEqual(["pension-payroll"]);
  });
  it("never rolls 2026 campaigns into 2027", () => expect(buildOptimizations([], settings, new Date("2027-01-01T12:00:00Z")).find((t) => t.id === "local-tax-2026")?.closed).toBe(true));
  it("March uses user-confirmed local percentage without invented Mastercard cashback", () => expect(buildOptimizations([], settings, new Date("2026-03-01T12:00:00Z")).find((t) => t.id === "local-tax-2026")?.impactAmountRon).toBe(110));
  it("salary status required for pension estimate", () => expect(buildOptimizations([], { ...settings, employee: false }, new Date("2026-10-28T12:00:00Z")).find((t) => t.id === "pension-payroll")?.impactAmountRon).toBe(0));
  it("redirection never counts as personal savings", () => expect(buildOptimizations([], settings, new Date("2026-03-01T12:00:00Z")).find((t) => t.id === "form230-2025")?.impactAmountRon).toBe(0));
  it("FX descriptions never imply a 1.9% spread or 576 RON saving", () => {
    const item = buildOptimizations([{ data: "2026-10-01", descriere: "Chirie 450 EUR", suma: -2250, categorie: "chirie_utilitati" }], settings, new Date("2026-10-28T12:00:00Z"))[0];
    expect(item?.category).toBe("fx_optimization"); expect(item?.impactAmountRon).toBe(0);
  });
});