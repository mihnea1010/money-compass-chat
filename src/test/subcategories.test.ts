import { expect, it } from "vitest";
import { subcategorie, subStatistici } from "@/lib/subcategories";
it("splits food into supermarket and delivery", () => {
  const t = [
    { data: "2026-05-01", descriere: "MEGA IMAGE", suma: -100, categorie: "mancare" as const },
    { data: "2026-05-02", descriere: "GLOVO*FOOD", suma: -50, categorie: "mancare" as const },
  ];
  expect(subcategorie(t[1]!)).toBe("Livrări mâncare");
  expect(subStatistici(t, "mancare", 1)).toEqual([{ name: "Supermarket", value: 100 }, { name: "Livrări mâncare", value: 50 }]);
});
