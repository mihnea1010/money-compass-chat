import type { Tranzactie } from "./statement";

export type Cont = { banca: string; tip: "curent" | "economii"; sold: number };

/** Solduri demo până conectăm API-urile băncilor. */
export const CONTURI_DEMO: Cont[] = [
  { banca: "ING", tip: "curent", sold: 8420.35 },
  { banca: "BCR", tip: "curent", sold: 2310.8 },
  { banca: "Banca Transilvania", tip: "curent", sold: 1145.2 },
  { banca: "Raiffeisen", tip: "curent", sold: 3275.4 },
  { banca: "ING", tip: "economii", sold: 15200 },
  { banca: "BCR", tip: "economii", sold: 4800 },
  { banca: "Banca Transilvania", tip: "economii", sold: 9350 },
];

export const totalTip = (c: Cont[], tip: Cont["tip"]) => c.filter((x) => x.tip === tip).reduce((s, x) => s + x.sold, 0);

/** Ultima lună din extras (YYYY-MM). */
export const lunaCurenta = (t: Tranzactie[]) => t.map((x) => x.data.slice(0, 7)).sort().at(-1) ?? "";

export function fluxLuna(t: Tranzactie[], luna: string) {
  const din = t.filter((x) => x.data.startsWith(luna));
  return {
    intrat: din.filter((x) => x.suma > 0).reduce((s, x) => s + x.suma, 0),
    cheltuit: -din.filter((x) => x.suma < 0).reduce((s, x) => s + x.suma, 0),
  };
}
