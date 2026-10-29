/** Cardurile utilizatorului, stocate doar în browser. */
export type CardPerk = { merchant: string; percent: number; status?: "demo" | "unverified" };
export const perkStatus = (perk: CardPerk) => perk.status === "demo" ? "demo" : "unverified";
export type MyCard = { id: string; bank: string; name: string; perks: CardPerk[]; style?: string; last4?: string; network?: "Visa" | "Mastercard" | "Amex" };

const KEY = "bestsaves.myCards.v3";

/** Card preconfigurat la cererea utilizatorului: Raiffeisen 5% cashback SIMULAT la Carrefour și Auchan. */
export const RAIFFEISEN_PRESET: MyCard = {
  id: "raiffeisen-cashback",
  bank: "Raiffeisen",
  name: "Card cashback",
  perks: [
    { status: "demo", merchant: "Carrefour", percent: 5 },
    { status: "demo", merchant: "Auchan", percent: 5 },
  ],
};

/** Cardurile băncilor din Seif (ING, BCR, Banca Transilvania). Beneficiile sunt scenarii simulate, nu oferte reale. */
export const DEFAULT_CARDS: MyCard[] = [
  { id: "bt-debit", bank: "Banca Transilvania", name: "Card de debit", perks: [{ status: "demo", merchant: "Carrefour", percent: 5 }, { status: "demo", merchant: "Cumpărături online marți (Mastercard)", percent: 10 }, { status: "demo", merchant: "Parteneri Star", percent: 2 }], style: "bt", last4: "2257" },
  { id: "bt-credit", bank: "Banca Transilvania", name: "Card de credit Star", perks: [{ status: "demo", merchant: "Parteneri Star (puncte)", percent: 10 }, { status: "demo", merchant: "Agenții de turism Star", percent: 2 }, { status: "demo", merchant: "Direct Booking", percent: 1 }], style: "bt-alt", last4: "9148" },
  { id: "ing-debit", bank: "ING", name: "Card de debit", perks: [{ status: "demo", merchant: "Amazon.de fashion (ING Bazar)", percent: 8 }, { status: "demo", merchant: "Amazon.de beauty & casă", percent: 5 }, { status: "demo", merchant: "Amazon.de electronice", percent: 3 }], style: "ing", last4: "4821" },
  { id: "ing-credit", bank: "ING", name: "Card de credit", perks: [{ status: "demo", merchant: "Amazon.de cărți & sport", percent: 4 }, { status: "demo", merchant: "Farmacii ING Bazar", percent: 3 }, { status: "demo", merchant: "Supermarketuri ING Bazar", percent: 2 }], style: "ing-alt", last4: "7310" },
  { id: "bcr-debit", bank: "BCR", name: "Card de debit", perks: [{ status: "demo", merchant: "Click to Pay marți (Mastercard)", percent: 10 }, { status: "demo", merchant: "OMV", percent: 3 }, { status: "demo", merchant: "Petrom", percent: 3 }], style: "bcr", last4: "1934" },
  { id: "bcr-credit", bank: "BCR", name: "Card de credit", perks: [{ status: "demo", merchant: "Moneyback George", percent: 3 }, { status: "demo", merchant: "Restaurante parteneri", percent: 2 }], style: "bcr-alt", last4: "6602" },
  { id: "raiffeisen-cashback", bank: "Raiffeisen", name: "Card cashback", perks: [{ status: "demo", merchant: "Carrefour", percent: 5 }, { status: "demo", merchant: "Auchan", percent: 5 }], style: "raiffeisen", last4: "5083" },
];

export function loadCards(): MyCard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CARDS;
    const saved = JSON.parse(raw) as MyCard[];
    const preset = DEFAULT_CARDS.find((c) => c.bank === "Raiffeisen");
    return saved.some((c) => c.bank === "Raiffeisen") || !preset ? saved : [...saved, preset];
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
export function bestCardForStore(cards: MyCard[], storeName: string, options: { demo?: boolean } = {}): { card: MyCard; perk: CardPerk } | null {
  let best: { card: MyCard; perk: CardPerk } | null = null;
  for (const card of cards) for (const perk of card.perks)
    if (options.demo && perkStatus(perk) === "demo" && merchantMatches(perk.merchant, storeName) && (!best || perk.percent > best.perk.percent)) best = { card, perk };
  return best;
}

/** Text scurt: "Cashback Auchan, Carrefour și încă 4". */
export function perkSummary(card: MyCard) {
  const names = [...card.perks].sort((a, b) => b.percent - a.percent).map((p) => p.merchant);
  if (!names.length) return "Nicio ofertă adăugată";
  const shown = names.slice(0, 2).join(", ");
  return names.length > 2 ? `Beneficii neconfirmate · ${shown} și încă ${names.length - 2}` : `Beneficii neconfirmate · ${shown}`;
}

/** Legacy/demo preset percentages remain simulated after local persistence. */
export function displayPerkStatus(card: MyCard, perk: CardPerk) {
  const preset = DEFAULT_CARDS.find((c) => c.id === card.id);
  return perk.status === "demo" || preset?.perks.some((p) => p.merchant === perk.merchant && p.percent === perk.percent) ? "demo" : "unverified";
}
