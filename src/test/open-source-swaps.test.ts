import { describe, expect, it } from "vitest";
import { detecteazaSwaps, SWAPS } from "@/lib/open-source-swaps";
import type { Tranzactie } from "@/lib/statement";

const t = (data: string, descriere: string, suma: number): Tranzactie => ({ data, descriere, suma, categorie: "abonamente_tech" });

describe("detecteazaSwaps", () => {
  it("suggests an open-source swap for Adobe paid in 2+ months, with annual savings", () => {
    const r = detecteazaSwaps([t("2026-05-01", "ADOBE CREATIVE CLOUD", -120), t("2026-06-01", "ADOBE CREATIVE CLOUD", -120)]);
    expect(r).toHaveLength(1);
    expect(r[0]!.alt.name).toBe("GIMP + Krita");
    expect(r[0]!.annualSaved).toBe(1440);
  });
  it("never suggests swaps for streaming services", () => {
    const r = detecteazaSwaps([
      t("2026-05-01", "NETFLIX.COM", -60), t("2026-06-01", "NETFLIX.COM", -60),
      t("2026-05-02", "SPOTIFY", -27), t("2026-06-02", "SPOTIFY", -27),
      t("2026-05-03", "HBO MAX", -35), t("2026-06-03", "HBO MAX", -35),
      t("2026-05-04", "DISNEY PLUS", -40), t("2026-06-04", "DISNEY PLUS", -40),
    ]);
    expect(r).toHaveLength(0);
  });
  it("ignores a one-off payment", () => {
    expect(detecteazaSwaps([t("2026-05-01", "NOTION LABS", -50)])).toHaveLength(0);
  });
  it("catalog contains no streaming matchers", () => {
    for (const s of SWAPS) {
      expect(s.match.test("NETFLIX.COM")).toBe(false);
      expect(s.match.test("SPOTIFY P1")).toBe(false);
    }
  });
});
