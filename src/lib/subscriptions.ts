import type { Tranzactie } from "./statement";

type Cunoscut = { match: RegExp; nume: string; firma: string; cancel: string };

export const ABONAMENTE_CUNOSCUTE: Cunoscut[] = [
  { match: /netflix/i, nume: "Netflix", firma: "Netflix, Inc.", cancel: "https://www.netflix.com/cancelplan" },
  { match: /spotify/i, nume: "Spotify Premium", firma: "Spotify AB", cancel: "https://www.spotify.com/account/subscription/" },
  { match: /openai|chatgpt/i, nume: "ChatGPT Plus", firma: "OpenAI", cancel: "https://chatgpt.com/#settings/Subscription" },
  { match: /adobe/i, nume: "Adobe Creative Cloud", firma: "Adobe Inc.", cancel: "https://account.adobe.com/plans" },
  { match: /digi|rcs.?rds/i, nume: "Digi Internet", firma: "Digi România", cancel: "https://www.digi.ro/contul-meu" },
  { match: /youtube/i, nume: "YouTube Premium", firma: "Google", cancel: "https://www.youtube.com/paid_memberships" },
  { match: /disney/i, nume: "Disney+", firma: "Disney", cancel: "https://www.disneyplus.com/account/subscription" },
  { match: /hbo|max\.com/i, nume: "Max", firma: "Warner Bros. Discovery", cancel: "https://auth.max.com/subscription" },
  { match: /apple\.com|icloud/i, nume: "Apple", firma: "Apple Inc.", cancel: "https://support.apple.com/ro-ro/118428" },
  { match: /amazon prime|prime video/i, nume: "Amazon Prime", firma: "Amazon", cancel: "https://www.amazon.com/mc" },
  { match: /world ?class|7card|esx/i, nume: "Abonament sală", firma: "Sală de sport", cancel: "https://www.google.com/search?q=anulare+abonament+sala" },
];

export type Abonament = {
  id: string; nume: string; firma: string; cancel: string;
  costLunar: number; luni: number; ultimaPlata: string;
};

/** Detectează abonamente: comerciant cunoscut, plătit în cel puțin 2 luni diferite. */
export function detecteazaAbonamente(t: Tranzactie[]): Abonament[] {
  const grup = new Map<string, { c: Cunoscut; plati: Tranzactie[] }>();
  for (const x of t) {
    if (x.suma >= 0) continue;
    const c = ABONAMENTE_CUNOSCUTE.find((k) => k.match.test(x.descriere));
    if (!c) continue;
    const g = grup.get(c.nume) ?? { c, plati: [] };
    g.plati.push(x); grup.set(c.nume, g);
  }
  return [...grup.values()]
    .map(({ c, plati }) => {
      const luni = new Set(plati.map((p) => p.data.slice(0, 7))).size;
      const total = -plati.reduce((s, p) => s + p.suma, 0);
      return {
        id: c.nume, nume: c.nume, firma: c.firma, cancel: c.cancel, luni,
        costLunar: Math.round((total / luni) * 100) / 100,
        ultimaPlata: plati.map((p) => p.data).sort().at(-1)!,
      };
    })
    .filter((a) => a.luni >= 2)
    .sort((a, b) => b.costLunar - a.costLunar);
}

const KEY = "clarai.abonamente.oprite";
export const loadOprite = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } };
export const saveOprite = (ids: string[]) => localStorage.setItem(KEY, JSON.stringify(ids));
