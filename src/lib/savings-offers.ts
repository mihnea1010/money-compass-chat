import { buildOptimizations } from "./optimizations";
import { statistici, type Tranzactie } from "./statement";
import { EMPTY_SETTINGS, type OptimizationSettings, type OptimizationRecord } from "./optimization-state";
import { bankOfferStatus, validDay, type OfferStatus } from "./offer-integrity";

export type SavingsOffer = {
  id: string; title: string; provider: string; category: "card" | "tax";
  annualRon: number; minutes: number; description: string; conditions: string;
  steps: string[]; url: string; action: string; calculable: boolean; reason?: string | undefined;
  status: OfferStatus; statusExplanation: string;
};
/** Catalog rows are unverified by default; legacy dates and URLs are not evidence. */
export type BankOffer = {
  id: string; bank: string; product: string; title: string; summary: string; is_credit: boolean;
  rate_percent: number; merchant_pattern: string | null; merchant_rate_percent: number | null; categories: string[];
  monthly_cap_ron: number | null; annual_cap_ron: number | null; annual_fee_ron: number | null;
  valid_from: string | null; valid_until: string | null; effort_minutes: number; steps: string[];
  conditions: string; source_url: string; verified_on: string;
  offer_status?: string; verification_evidence?: unknown;
};

export function rankOffers(offers: SavingsOffer[]) {
  return [...offers].sort((a, b) => b.annualRon / Math.max(1, b.minutes) - a.annualRon / Math.max(1, a.minutes) || b.annualRon - a.annualRon || a.id.localeCompare(b.id));
}
const bucharestDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" }).format(d);

export function estimateBankOffer(o: BankOffer, transactions: Tranzactie[], settings: OptimizationSettings) {
  const rates = [o.rate_percent, o.merchant_rate_percent ?? 0];
  const limits = [o.monthly_cap_ron, o.annual_cap_ron, o.annual_fee_ron];
  if (rates.some((n) => !Number.isFinite(Number(n)) || Number(n) < 0 || Number(n) > 100) || limits.some((n) => n !== null && (!Number.isFinite(Number(n)) || Number(n) < 0))) return { calculable: false, annualRon: 0 };
  const months = statistici(transactions).nrLuni;
  const purchases = transactions.filter((t) => t.suma < 0 && o.categories.includes(t.categorie) && !/comision|ramburs|transfer|retragere|dob[aâ]nd/i.test(t.descriere));
  let re: RegExp | null = null;
  try { re = o.merchant_pattern ? new RegExp(o.merchant_pattern, "i") : null; } catch { return { calculable: false, annualRon: 0 }; }
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

export function buildSavingsOffers(transactions: Tranzactie[], settings: OptimizationSettings, today: Date, records: OptimizationRecord[] = [], bankOffers: BankOffer[] = [], options: { demoScenario?: boolean } = {}) {
  const year = Number(new Intl.DateTimeFormat("en", { timeZone: "Europe/Bucharest", year: "numeric" }).format(today));
  const day = bucharestDay(today);
  const offers: SavingsOffer[] = bankOffers.map((o) => {
    const integrity = bankOfferStatus(o, day);
    const validPeriod = (!o.valid_from || (validDay(o.valid_from) && o.valid_from <= day)) && (!o.valid_until || (validDay(o.valid_until) && o.valid_until >= day)) && (!o.valid_from || !o.valid_until || o.valid_from <= o.valid_until);
    const est = validPeriod && (integrity.status === "verified" || (integrity.status === "demo" && options.demoScenario)) ? estimateBankOffer(o, transactions, settings) : { calculable: false, annualRon: 0 };
    return { id: o.id, title: o.title, provider: `${o.bank} · ${o.product}`, category: "card", annualRon: est.annualRon, minutes: o.effort_minutes, calculable: est.calculable,
      status: integrity.status, statusExplanation: integrity.explanation,
      description: o.summary, steps: integrity.status === "verified" ? o.steps : [integrity.explanation, "Nicio activare sau economie reală nu este confirmată."], url: integrity.status === "verified" ? o.source_url : "", action: `Vezi termenii ${o.bank.split(" (")[0]}`,
      conditions: `${integrity.explanation} ${integrity.status === "verified" ? Object.entries(o.verification_evidence as Record<string, { url: string; excerpt: string }>).map(([term, evidence]) => `${term}: ${evidence.excerpt} (${evidence.url})`).join(" ") : ""} ${o.conditions} ${est.calculable ? integrity.status === "demo" ? "Calcul ipotetic pe date simulate; nu reprezintă economie personală." : "Estimare pe 12 luni, nu economie garantată." : "Nu includem această ofertă în economiile personale fără dovezi și eligibilitate confirmată."}`.trim() };
  });
  for (const t of buildOptimizations(transactions, settings, today).filter((t) => !t.closed && t.impactKind === "estimate" && t.impactAmountRon > 0)) offers.push({ id: t.id, title: t.title, provider: "Beneficiu fiscal", category: "tax", annualRon: t.impactAmountRon, minutes: 10, description: t.contextExplanation, conditions: t.urgencyLabel, steps: ["Verifică eligibilitatea în sursa oficială.", "Confirmă documentele și suma cu salarizarea sau primăria.", "Aplică beneficiul și confirmă economia realizată."], url: t.sourceUrl, action: "Verifică beneficiul", calculable: true, status: "unverified", statusExplanation: "Calcul orientativ din valori declarate; eligibilitatea fiscală nu este verificată." });
  return rankOffers(offers.filter((o) => !records.some((r) => r.id === o.id && r.year === year)));
}

/** Monthly spend per category (positive lei). The only personal data sent to the AI picker. */
export function spendByCategory(transactions: Tranzactie[]) {
  return Object.fromEntries(statistici(transactions).cheltuieli.map((c) => [c.categorie, c.value]));
}
/** Apply an AI-chosen order; unknown ids keep the deterministic order after the AI picks. */
export function applyAiOrder(offers: SavingsOffer[], order: string[], reasons: Record<string, string> = {}) {
  const pos = (id: string) => { const i = order.indexOf(id); return i === -1 ? order.length : i; };
  return [...offers].map((o, i) => ({ o: { ...o, reason: o.status === "verified" ? reasons[o.id] ?? o.reason : undefined }, i })).sort((a, b) => pos(a.o.id) - pos(b.o.id) || a.i - b.i).map((x) => x.o);
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
