import { buildOptimizations } from "./optimizations";
import { statistici, type Tranzactie } from "./statement";
import { EMPTY_SETTINGS, type OptimizationSettings, type OptimizationRecord } from "./optimization-state";

export type SavingsOffer = {
  id: string; title: string; provider: string; category: "card" | "tax";
  annualRon: number; minutes: number; description: string; conditions: string;
  steps: string[]; url: string; action: string; calculable: boolean; reason?: string | undefined;
};
/** Row shape of the bank_offers table (offers curated from official bank pages). */
export type BankOffer = {
  id: string; bank: string; product: string; title: string; summary: string; is_credit: boolean;
  rate_percent: number; merchant_pattern: string | null; merchant_rate_percent: number | null; categories: string[];
  monthly_cap_ron: number | null; annual_cap_ron: number | null; annual_fee_ron: number | null;
  valid_from: string | null; valid_until: string | null; effort_minutes: number; steps: string[];
  conditions: string; source_url: string; verified_on: string;
};

export function rankOffers(offers: SavingsOffer[]) {
  return [...offers].sort((a, b) => b.annualRon / Math.max(1, b.minutes) - a.annualRon / Math.max(1, a.minutes) || b.annualRon - a.annualRon || a.id.localeCompare(b.id));
}
const bucharestDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" }).format(d);

export function estimateBankOffer(o: BankOffer, transactions: Tranzactie[], settings: OptimizationSettings) {
  const months = statistici(transactions).nrLuni;
  const purchases = transactions.filter((t) => t.suma < 0 && o.categories.includes(t.categorie) && !/comision|ramburs|transfer|retragere|dob[aâ]nd/i.test(t.descriere));
  const re = o.merchant_pattern ? new RegExp(o.merchant_pattern, "i") : null;
  const merchant = re ? -purchases.filter((t) => re.test(t.descriere)).reduce((s, t) => s + t.suma, 0) / months : 0;
  const other = -purchases.filter((t) => !re || !re.test(t.descriere)).reduce((s, t) => s + t.suma, 0) / months;
  let monthly = merchant * Number(o.merchant_rate_percent ?? 0) / 100 + other * Number(o.rate_percent) / 100;
  if (o.monthly_cap_ron !== null) monthly = Math.min(monthly, Number(o.monthly_cap_ron));
  let annual = monthly * 12;
  if (o.annual_cap_ron !== null) annual = Math.min(annual, Number(o.annual_cap_ron));
  const fee = o.annual_fee_ron !== null ? Number(o.annual_fee_ron) : settings.directAnnualCostRon;
  const calculable = purchases.length > 0 && fee !== null && (!o.is_credit || settings.repayInFull);
  return { calculable, annualRon: calculable ? Math.max(0, Math.round(annual - (fee ?? 0))) : 0 };
}

export function buildSavingsOffers(transactions: Tranzactie[], settings: OptimizationSettings, today: Date, records: OptimizationRecord[] = [], bankOffers: BankOffer[] = []) {
  const year = Number(new Intl.DateTimeFormat("en", { timeZone: "Europe/Bucharest", year: "numeric" }).format(today));
  const day = bucharestDay(today);
  const offers: SavingsOffer[] = bankOffers.filter((o) => (!o.valid_until || o.valid_until >= day) && (!o.valid_from || o.valid_from <= day)).map((o) => {
    const est = estimateBankOffer(o, transactions, settings);
    return { id: o.id, title: o.title, provider: `${o.bank} · ${o.product}`, category: "card", annualRon: est.annualRon, minutes: o.effort_minutes, calculable: est.calculable,
      description: o.summary, steps: o.steps, url: o.source_url, action: `Deschide oferta ${o.bank.split(" (")[0]}`,
      conditions: `${o.conditions} ${est.calculable ? "Estimare pe 12 luni din ritmul cheltuielilor tale." : o.is_credit ? "Pentru calcul: confirmă rambursarea integrală și costul anual în Date & eligibilitate." : ""} Verificat pe sursa oficială la ${o.verified_on}${o.valid_until ? `, valabil până la ${o.valid_until}` : ""}.`.trim() };
  });
  for (const t of buildOptimizations(transactions, settings, today).filter((t) => !t.closed && t.impactKind === "estimate" && t.impactAmountRon > 0)) offers.push({ id: t.id, title: t.title, provider: "Beneficiu fiscal", category: "tax", annualRon: t.impactAmountRon, minutes: 10, description: t.contextExplanation, conditions: t.urgencyLabel, steps: ["Verifică eligibilitatea în sursa oficială.", "Confirmă documentele și suma cu salarizarea sau primăria.", "Aplică beneficiul și confirmă economia realizată."], url: t.sourceUrl, action: "Verifică beneficiul", calculable: true });
  return rankOffers(offers.filter((o) => !records.some((r) => r.id === o.id && r.year === year)));
}

/** Monthly spend per category (positive lei). The only personal data sent to the AI picker. */
export function spendByCategory(transactions: Tranzactie[]) {
  return Object.fromEntries(statistici(transactions).cheltuieli.map((c) => [c.categorie, c.value]));
}
/** Apply an AI-chosen order; unknown ids keep the deterministic order after the AI picks. */
export function applyAiOrder(offers: SavingsOffer[], order: string[], reasons: Record<string, string> = {}) {
  const pos = (id: string) => { const i = order.indexOf(id); return i === -1 ? order.length : i; };
  return [...offers].map((o, i) => ({ o: { ...o, reason: reasons[o.id] ?? o.reason }, i })).sort((a, b) => pos(a.o.id) - pos(b.o.id) || a.i - b.i).map((x) => x.o);
}

// Explicit illustrative scenario, never saved in Seif or shown as a personal result.
export const EXAMPLE_TRANSACTIONS: Tranzactie[] = ["2026-08", "2026-09"].flatMap((month) => [
  { data: `${month}-01`, descriere: "Adobe", suma: -400, categorie: "abonamente_tech" as const },
  { data: `${month}-02`, descriere: "Netflix", suma: -300, categorie: "abonamente_tech" as const },
  { data: `${month}-03`, descriere: "Carrefour", suma: -2000, categorie: "mancare" as const },
  { data: `${month}-04`, descriere: "Cumparaturi", suma: -1666.67, categorie: "shopping" as const },
  { data: `${month}-05`, descriere: "eMAG.ro", suma: -800, categorie: "shopping" as const },
  { data: `${month}-06`, descriere: "Amazon.de", suma: -400, categorie: "shopping" as const },
]);
export const EXAMPLE_SETTINGS: OptimizationSettings = { ...EMPTY_SETTINGS, directAnnualCostRon: 0, repayInFull: true };
