import { describe, expect, it } from "vitest";
import { detecteazaAbonamente } from "@/lib/subscriptions";
import type { Tranzactie } from "@/lib/statement";

const t = (data: string, descriere: string, suma: number): Tranzactie => ({ data, descriere, suma, categorie: "abonamente_tech" });

describe("detecteazaAbonamente", () => {
  it("detects a known merchant paid in 2+ months with monthly cost", () => {
    const r = detecteazaAbonamente([t("2026-05-12", "NETFLIX.COM", -59.99), t("2026-06-12", "NETFLIX.COM", -59.99)]);
    expect(r).toHaveLength(1);
    expect(r[0]!.costLunar).toBe(59.99);
    expect(r[0]!.cancel).toContain("netflix.com");
  });
  it("ignores a one-off payment", () => {
    expect(detecteazaAbonamente([t("2026-05-12", "SPOTIFY P1", -26.99)])).toHaveLength(0);
  });
});
