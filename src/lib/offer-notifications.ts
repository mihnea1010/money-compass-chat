/**
 * Logica REALĂ de potrivire ofertă ↔ locație pentru notificarea „ești în magazin”.
 *
 * Nu este cablată la GPS/background încă — locația este aleasă manual în panoul
 * demo din Seiful meu. Aceeași logică poate fi reutilizată de un serviciu de
 * geofencing când feature-ul devine real.
 *
 * Sursa ofertelor este `Cardurile mele` (perk-urile din my-cards): fiecare perk
 * leagă un comerciant de un procent și de cardul afiliat.
 */
import { displayPerkStatus, merchantMatches, type CardPerk, type MyCard } from "./my-cards";

/** O ofertă activă, legată de un card și de o locație/comerciant. */
export type LocationOffer = {
  merchant: string;
  percent: number;
  cardId: string;
  cardBank: string;
  cardName: string;
  status: "demo" | "unverified";
};

/**
 * Doar locații FIZICE, în care poți „fi” (pentru simularea notificării în magazin).
 * Excludem comercianți exclusiv online și programe/categorii abstracte
 * (ex. Amazon.de, Cumpărături online, Click to Pay, Parteneri Star, Moneyback George,
 * Direct Booking, agenții/parteneri/categorii „ING Bazar”), care nu sunt un loc fizic.
 */
export function isPhysicalLocation(merchant: string): boolean {
  const m = merchant.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const online = [
    "amazon", "online", "click to pay", "e-mag", "emag", "ing bazar", "bazar",
    "moneyback", "george", "direct booking", "booking", "parteneri", "partener",
    "agentii", "agentie", "turism", "puncte", "star", "mastercard", "visa",
  ];
  return !online.some((kw) => m.includes(kw));
}

/** Toate ofertele FIZICE disponibile din cardurile utilizatorului, ordonate descrescător după procent. */
export function availableOffers(cards: MyCard[]): LocationOffer[] {
  const offers: LocationOffer[] = [];
  for (const card of cards) {
    for (const perk of card.perks) {
      if (!isPhysicalLocation(perk.merchant)) continue;
      offers.push({
        merchant: perk.merchant,
        percent: perk.percent,
        cardId: card.id,
        cardBank: card.bank,
        cardName: card.name,
        status: displayPerkStatus(card, perk),
      });
    }
  }
  return offers.sort((a, b) => b.percent - a.percent || a.merchant.localeCompare(b.merchant));
}

/**
 * Pentru un comerciant/locație dat, întoarce cea mai bună ofertă (procent maxim)
 * dintre toate cardurile utilizatorului, sau null dacă nicio ofertă nu se potrivește.
 */
export function bestOfferForLocation(cards: MyCard[], location: string): LocationOffer | null {
  let best: LocationOffer | null = null;
  for (const card of cards) {
    for (const perk of card.perks) {
      if (merchantMatches(perk.merchant, location) && (!best || perk.percent > best.percent)) {
        best = { merchant: perk.merchant, percent: perk.percent, cardId: card.id, cardBank: card.bank, cardName: card.name, status: displayPerkStatus(card, perk) };
      }
    }
  }
  return best;
}

/** Textul concret al notificării pentru o ofertă (cu etichetă demo/simulare, conform integrității). */
export function notificationText(offer: LocationOffer): { title: string; body: string } {
  const label = offer.status === "demo" ? "DEMO · simulare" : "neconfirmat";
  return {
    title: `💳 Ești la ${offer.merchant}?`,
    body: `Plătește cu ${offer.cardBank} ${offer.cardName} pentru ${offer.percent}% cashback (${label}).`,
  };
}

/** Variantă pentru un perk ales direct (aceeași formă ca `LocationOffer`). */
export function offerFromPerk(card: MyCard, perk: CardPerk): LocationOffer {
  return { merchant: perk.merchant, percent: perk.percent, cardId: card.id, cardBank: card.bank, cardName: card.name, status: displayPerkStatus(card, perk) };
}
