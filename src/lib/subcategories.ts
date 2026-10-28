import type { Categorie, Tranzactie } from "./statement";

type Regula = { sub: string; match: RegExp };

/** Reguli locale (fără AI) pentru împărțirea unei categorii în subcategorii. */
export const SUBCATEGORII: Partial<Record<Categorie, Regula[]>> = {
  mancare: [
    { sub: "Supermarket", match: /mega image|lidl|carrefour|kaufland|auchan|profi|penny|selgros/i },
    { sub: "Livrări mâncare", match: /glovo|tazz|bolt food|wolt|foodpanda/i },
    { sub: "Restaurante & cafenele", match: /restaurant|bistro|cafe|starbucks|mcdonald|kfc|pizza/i },
    { sub: "Snacks & magazine mici", match: /mic\.ro|inmedio|relay|non.?stop|chiosc/i },
  ],
  shopping: [
    { sub: "Haine", match: /h&m|zara|reserved|bershka|pull|answear|about you|c&a/i },
    { sub: "Sport", match: /decathlon|intersport|sportisimo/i },
    { sub: "Electronice & online", match: /emag|altex|flanco|amazon|temu/i },
    { sub: "Distracție & concerte", match: /iabilet|eventim|cinema|bilet|concert|steam|playstation/i },
  ],
  transport: [
    { sub: "Combustibil", match: /omv|petrom|mol|rompetrol|lukoil|socar/i },
    { sub: "Ride-sharing", match: /bolt|uber|taxi/i },
    { sub: "Transport public", match: /stb|metrorex|cfr|ratb/i },
  ],
  chirie_utilitati: [
    { sub: "Chirie", match: /chirie/i },
    { sub: "Energie & gaz", match: /enel|engie|electrica|e\.on|hidroelectrica/i },
    { sub: "Internet & telefon", match: /digi|rcs|orange|vodafone|telekom/i },
  ],
  abonamente_tech: [
    { sub: "Streaming", match: /netflix|spotify|youtube|disney|hbo|max\.com|prime/i },
    { sub: "Software & AI", match: /openai|chatgpt|adobe|github|notion|figma|microsoft|google/i },
  ],
};

export const subcategorie = (t: Tranzactie) =>
  SUBCATEGORII[t.categorie]?.find((r) => r.match.test(t.descriere))?.sub ?? "Altele";

/** Subcategoriile unei categorii, ca medie lunară, descrescător. */
export function subStatistici(t: Tranzactie[], cat: Categorie, nrLuni: number) {
  const m = new Map<string, number>();
  for (const x of t) if (x.categorie === cat && x.suma < 0) m.set(subcategorie(x), (m.get(subcategorie(x)) ?? 0) - x.suma);
  return [...m].map(([name, total]) => ({ name, value: Math.round(total / Math.max(1, nrLuni)) }))
    .filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
}
