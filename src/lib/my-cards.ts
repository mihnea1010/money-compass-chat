/** Cardurile utilizatorului, stocate doar în browser. */
export type CardPerk = { merchant: string; percent: number };
export type MyCard = { id: string; bank: string; name: string; perks: CardPerk[]; style?: string; last4?: string };

const KEY = "bestsaves.myCards.v2";

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

/** Cardurile băncilor din Seif (ING, BCR, Banca Transilvania). Ofertele de cashback le adaugi tu. */
export const DEFAULT_CARDS: MyCard[] = [
  { id: "ing-debit", bank: "ING", name: "Card de debit", perks: [], style: "ing", last4: "4821" },
  { id: "ing-credit", bank: "ING", name: "Card de credit", perks: [], style: "ing-alt", last4: "7310" },
  { id: "bcr-debit", bank: "BCR", name: "Card de debit", perks: [], style: "bcr", last4: "1934" },
  { id: "bcr-credit", bank: "BCR", name: "Card de credit", perks: [], style: "bcr-alt", last4: "6602" },
  { id: "bt-debit", bank: "Banca Transilvania", name: "Card de debit", perks: [], style: "bt", last4: "2257" },
  { id: "raiffeisen-cashback", bank: "Raiffeisen", name: "Card cashback", perks: [{ merchant: "Carrefour", percent: 5 }, { merchant: "Auchan", percent: 5 }], style: "raiffeisen", last4: "5083" },
  { id: "bt-credit", bank: "Banca Transilvania", name: "Card de credit", perks: [], style: "bt-alt", last4: "9148" },
];

export function loadCards(): MyCard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CARDS;
    const saved = JSON.parse(raw) as MyCard[];
    return saved.some((c) => c.bank === "Raiffeisen") ? saved : [...saved, DEFAULT_CARDS.find((c) => c.bank === "Raiffeisen")!];
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
