/** Cardurile utilizatorului, stocate doar în browser. */
export type CardPerk = { merchant: string; percent: number };
export type MyCard = { id: string; bank: string; name: string; perks: CardPerk[] };

const KEY = "bestsaves.myCards";

/** Card preconfigurat la cererea utilizatorului: Raiffeisen 5% cashback la Carrefour și Auchan. */
export const RAIFFEISEN_PRESET: MyCard = {
  id: "raiffeisen-cashback",
  bank: "Raiffeisen",
  name: "Card cashback",
  perks: [
    { merchant: "Carrefour", percent: 5 },
    { merchant: "Auchan", percent: 5 },
  ],
};

export function loadCards(): MyCard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MyCard[]) : [RAIFFEISEN_PRESET];
  } catch {
    return [];
  }
}

export function saveCards(cards: MyCard[]) {
  localStorage.setItem(KEY, JSON.stringify(cards));
}

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function merchantMatches(merchant: string, storeName: string) {
  const m = norm(merchant), s = norm(storeName);
  return !!m && (s.includes(m) || m.includes(s));
}

/** Toate magazinele pentru care utilizatorul are o ofertă pe card. */
export function knownMerchants(cards: MyCard[]) {
  return [...new Set(cards.flatMap((c) => c.perks.map((p) => p.merchant)))];
}

/** Cardul cu cel mai mare procent pentru magazin, sau null. */
export function bestCardForStore(cards: MyCard[], storeName: string): { card: MyCard; perk: CardPerk } | null {
  let best: { card: MyCard; perk: CardPerk } | null = null;
  for (const card of cards) for (const perk of card.perks)
    if (merchantMatches(perk.merchant, storeName) && (!best || perk.percent > best.perk.percent)) best = { card, perk };
  return best;
}

/** Text scurt: "Cashback Auchan, Carrefour și încă 4". */
export function perkSummary(card: MyCard) {
  const names = [...card.perks].sort((a, b) => b.percent - a.percent).map((p) => p.merchant);
  if (!names.length) return "Nicio ofertă adăugată";
  const shown = names.slice(0, 2).join(", ");
  return names.length > 2 ? `Cashback ${shown} și încă ${names.length - 2}` : `Cashback ${shown}`;
}
