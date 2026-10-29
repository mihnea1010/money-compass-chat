import type { BankOffer } from "./savings-offers";

/**
 * Catalog demo (fallback în browser) care oglindește exact migrarea SQL
 * `drizzle/migrations/0002_seed_demo_cashback_offers.sql`.
 *
 * Scop: ofertele demo de cashback să apară în Economisește chiar dacă tabela
 * `bank_offers` din Supabase nu a fost încă migrată. Când baza de date servește
 * aceste rânduri (același `id`), ele au prioritate — vezi `mergeDemoOffers`.
 *
 * Toate rândurile sunt explicit SIMULATE: `offer_status: "demo"`, fără URL sursă
 * și fără dovezi. `offer-integrity.ts` le închide fail-closed la statutul "demo",
 * deci nu pot deveni niciodată economii personale confirmate.
 */
const demo = (
  id: string,
  bank: string,
  product: string,
  title: string,
  summary: string,
  merchant_pattern: string | null,
  merchant_rate_percent: number | null,
  rate_percent: number,
  categories: string[],
  monthly_cap_ron: number | null,
  annual_cap_ron: number | null,
  steps: string[],
): BankOffer => ({
  id, bank, product, title, summary,
  is_credit: false, rate_percent, merchant_pattern, merchant_rate_percent, categories,
  monthly_cap_ron, annual_cap_ron, annual_fee_ron: 0,
  valid_from: "2026-01-01", valid_until: "2026-12-31", effort_minutes: 5, steps,
  conditions: "Ofertă demo inventată.", source_url: "", verified_on: "",
  offer_status: "demo", verification_evidence: {},
});

export const DEMO_CASHBACK_OFFERS: BankOffer[] = [
  demo("demo-ing-supermarket", "ING Bank", "Card de debit", "5% cashback la supermarket (Mega Image, Kaufland, Carrefour)", "Primești 5% înapoi la cumpărăturile din supermarketurile partenere plătite cu cardul ING.", "mega image|kaufland|carrefour|auchan", 5, 0, ["mancare"], 60, null, ["Activează programul în aplicația ING.", "Plătește la supermarketurile partenere cu cardul."]),
  demo("demo-lidl-plus", "Banca Transilvania", "Card de debit", "4% cashback la Lidl", "Cashback simulat pentru cumpărăturile de la Lidl plătite cu cardul BT.", "lidl", 4, 0, ["mancare"], 40, null, ["Leagă cardul BT de aplicația de loialitate.", "Plătește la Lidl cu el."]),
  demo("demo-bcr-food-delivery", "BCR", "Card de debit", "6% la livrări de mâncare (Glovo, Tazz, Bolt Food)", "Cashback simulat la comenzile de mâncare plătite cu cardul de debit BCR.", "glovo|tazz|bolt", 6, 0, ["mancare", "transport"], 30, null, ["Adaugă cardul BCR în aplicațiile de livrare.", "Plătește comenzile cu el."]),
  demo("demo-ing-emag-plus", "ING Bank", "Card de debit", "4% înapoi la eMAG", "Cashback simulat la comenzile de pe eMAG plătite cu cardul ING.", "emag", 4, 0, ["shopping"], 50, null, ["Adaugă cardul ING în contul eMAG.", "Plătește comenzile cu el."]),
  demo("demo-raiffeisen-amazon", "Raiffeisen Bank", "Card de debit", "5% la Amazon.de", "Cashback simulat la cumpărăturile de pe Amazon.de plătite cu cardul Raiffeisen.", "amazon", 5, 0, ["shopping"], 40, null, ["Activează programul Raiffeisen.", "Plătește pe Amazon.de cu cardul."]),
  demo("demo-bt-fashion", "Banca Transilvania", "Card Star", "7% la fashion (H&M, Zara, Decathlon)", "Puncte Star simulate la magazinele de fashion partenere.", "h&m|zara|decathlon", 7, 0, ["shopping"], 50, null, ["Mută plata la magazinele de fashion pe cardul BT."]),
  demo("demo-bt-subscriptions", "Banca Transilvania", "Card Star", "10% la abonamente digitale (Netflix, Spotify, Adobe, OpenAI)", "Cashback simulat generos la abonamentele digitale plătite cu cardul BT.", "netflix|spotify|adobe|openai", 10, 0, ["abonamente_tech"], 40, null, ["Mută plata abonamentelor pe cardul BT."]),
  demo("demo-bcr-fuel", "BCR", "Card de debit", "5% la carburant (OMV, Petrom)", "Cashback simulat la alimentările plătite cu cardul de debit BCR.", "omv|petrom", 5, 0, ["transport"], 40, null, ["Activează cashback-ul la carburant în aplicația George.", "Plătește alimentările cu cardul."]),
  demo("demo-ing-rides", "ING Bank", "Card de debit", "8% la Bolt", "Cashback simulat la cursele Bolt plătite cu cardul ING.", "bolt", 8, 0, ["transport"], 20, null, ["Adaugă cardul ING în aplicația Bolt.", "Plătește cursele cu el."]),
  demo("demo-bt-utilities", "Banca Transilvania", "Card de debit", "3% la facturi de utilități (Enel, Digi)", "Cashback simulat la plata facturilor recurente cu cardul BT.", "enel|digi", 3, 0, ["chirie_utilitati"], 30, null, ["Setează facturile pe debit direct de pe cardul BT."]),
  demo("demo-raiffeisen-everything", "Raiffeisen Bank", "Card de debit", "2% cashback la tot", "Cashback simulat general la toate plățile cu cardul de debit Raiffeisen.", null, null, 2, ["mancare", "shopping", "abonamente_tech", "transport", "chirie_utilitati"], null, 1200, ["Activează programul Smart în aplicația Raiffeisen.", "Plătește orice cu cardul."]),
];

/**
 * Combină ofertele din baza de date cu catalogul demo de rezervă.
 * Rândurile din baza de date au prioritate când există același `id`,
 * deci baza de date rămâne sursa autoritară; demo-urile doar completează.
 */
export function mergeDemoOffers(dbOffers: BankOffer[]): BankOffer[] {
  const seen = new Set(dbOffers.map((o) => o.id));
  return [...dbOffers, ...DEMO_CASHBACK_OFFERS.filter((o) => !seen.has(o.id))];
}
