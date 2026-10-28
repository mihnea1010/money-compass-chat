import { describe, expect, it } from "vitest";
import { calculeazaKpi } from "@/lib/kpi";
import type { Tranzactie } from "@/lib/statement";

const t: Tranzactie[] = [
  { data: "2026-01-05", descriere: "Salariu", suma: 10000, categorie: "salariu" },
  { data: "2026-01-06", descriere: "Chirie", suma: -3000, categorie: "chirie_utilitati" },
  { data: "2026-01-07", descriere: "Rata credit", suma: -1000, categorie: "altele" },
  { data: "2026-01-08", descriere: "Haine", suma: -1000, categorie: "shopping" },
];
const conturi = [{ banca: "ING", tip: "curent" as const, sold: 6000 }, { banca: "ING", tip: "economii" as const, sold: 9000 }];

describe("KPI", () => {
  const k = calculeazaKpi(t, conturi, 30);
  it("savings rate = economii / venit * 100", () => expect(k.savingsRate).toBe(50));
  it("emergency runway = lichidități / cheltuieli esențiale", () => expect(k.emergencyRunwayLuni).toBe(5));
  it("DTI = rate datorii / venit * 100", () => expect(k.dti).toBe(10));
  it("FI/RE = portofoliu / (25 × cheltuieli anuale) * 100", () => expect(k.fireProgress).toBe(0.6));
  it("requisite variety = discreționare / fixe", () => expect(k.requisiteVariety).toBe(0.5));
});
