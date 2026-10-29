import type { Tranzactie } from "./statement";
import { deadlinePassed, localTaxSaving, pensionTaxSaving, type OptimizationSettings } from "./optimization-state";

export const FISCAL_SOURCES = {
  code: "https://static.anaf.ro/static/10/Anaf/legislatie/Cod_fiscal_norme_2023.htm",
  form: "https://www.anaf.ro/declaratii/d230/",
  deadline: "https://static.anaf.ro/static/3/Ploiesti/20260522134205_comunicat_termen_declaratia_230%20an%202026.pdf",
  tax: "https://www.ghiseul.ro/ghiseul/public/",
};
export const VERIFIED_FISCAL_CONTEXT = `Reguli fiscale de reconfirmat, fără dată de verificare documentată (${FISCAL_SOURCES.code}): bonificație de până la 10% stabilită de consiliul competent pentru plata anticipată integrală a impozitului anual pe clădiri/teren până la 31 martie. Nu garanta 10% și nu aplica o campanie Mastercard de 2% inventată. Termenul 2026 este închis în octombrie; 2027 necesită confirmare.
Art.78: contribuțiile proprii eligibile la pensie facultativă, la funcția de bază, se deduc din baza salarială în limita echivalentului a 400 EUR/an. Reducerea impozitului de 10% ar fi cel mult echivalentul a 40 EUR, nu rambursare400 EUR; depinde de contribuții deja deduse, bază și salarizare. Nu promite bani automat.
Form230 redirecționează până la 3,5% din impozitul pe venituri salariale eligibile către beneficiar, nu este economie personală. Termen pentru veniturile2025: 25.05.2026 inclusiv, închis (${FISCAL_SOURCES.deadline}). Generarea formularului (${FISCAL_SOURCES.form}) nu este depunere. Nu inventa suma380RON fără impozit eligibil cunoscut.`;

export type OptimizationTrigger = {
  id: string; title: string; impactAmountRon: number;
  impactKind: "estimate" | "review" | "donation";
  urgencyLabel: string; urgencyLevel: "high" | "medium" | "low";
  category: "tax_bonification" | "cashback_arbitrage" | "fx_optimization" | "salary_deduction" | "fee_reduction";
  contextExplanation: string; sourceUrl: string; closed: boolean;
  primaryAction: { label: string; actionType: "external_link_with_copy" | "generate_pdf" | "one_click_toggle"; payload?: { url?: string } };
  isDismissed?: boolean; isCompleted?: boolean;
};
export function buildOptimizations(transactions: Tranzactie[], settings: OptimizationSettings, today: Date): OptimizationTrigger[] {
  const year = Number(new Intl.DateTimeFormat("en", { timeZone: "Europe/Bucharest", year: "numeric" }).format(today));
  // Do not roll 2026 campaigns into an unverified future year.
  const closedTax = year !== 2026 || deadlinePassed(today, 3, 31);
  const closedForm = year !== 2026 || deadlinePassed(today, 5, 25);
  const triggers: OptimizationTrigger[] = [
    { id: "local-tax-2026", title: "Bonificație la impozitul pe clădiri / teren", impactAmountRon: closedTax ? 0 : localTaxSaving(settings.localTaxRon, settings.localDiscountPercent), impactKind: "estimate",
      urgencyLabel: closedTax ? "31 martie 2026 · termen încheiat" : "Termen: 31 martie 2026", urgencyLevel: "low", category: "tax_bonification", closed: closedTax,
      contextExplanation: "Până la 10% pentru plata integrală anticipată; procentul depinde de hotărârea primăriei, nu include cashback Mastercard garantat.", sourceUrl: FISCAL_SOURCES.code,
      primaryAction: { label: "Verifică pe Ghișeul.ro", actionType: "external_link_with_copy", payload: { url: FISCAL_SOURCES.tax } } },
    { id: "pension-payroll", title: "Verifică deducerea contribuției Pilon III", impactAmountRon: settings.employee ? pensionTaxSaving(settings.pensionContributionEur, settings.eurRon) : 0, impactKind: "estimate",
      urgencyLabel: "Eligibilitate de confirmat cu salarizarea", urgencyLevel: "low", category: "salary_deduction", closed: false,
      contextExplanation: "Contribuția proprie eligibilă se deduce din baza salarială, până la 400 EUR/an; economia de impozit este cel mult echivalentul a 40 EUR, dacă nu ai folosit deja deducerea.", sourceUrl: FISCAL_SOURCES.code,
      primaryAction: { label: "Descarcă cerere pentru salarizare", actionType: "generate_pdf" } },
    { id: "form230-2025", title: "Redirecționare 3,5% către o cauză", impactAmountRon: 0, impactKind: "donation",
      urgencyLabel: closedForm ? "Venituri 2025 · termen 25 mai 2026 încheiat" : "Venituri 2025 · termen 25 mai 2026", urgencyLevel: "low", category: "tax_bonification", closed: closedForm,
      contextExplanation: "Redirecționezi o parte din impozitul salarial eligibil, nu primești bani înapoi; formularul generat trebuie depus printr-o cale oficială.", sourceUrl: FISCAL_SOURCES.deadline,
      primaryAction: { label: "Vezi formularul oficial", actionType: "external_link_with_copy", payload: { url: FISCAL_SOURCES.form } } },
  ];
  const fees = transactions.filter((t) => t.suma < 0 && /comision|commission|taxa administrare|taxă administrare/i.test(t.descriere));
  const fx = transactions.filter((t) => t.suma < 0 && /\b(eur|usd|schimb valutar|conversie)\b/i.test(t.descriere));
  if (fees.length || fx.length) triggers.unshift({ id: "bank-cost-review", title: fees.length ? "Verifică plățile cu comisioane" : "Compară costul conversiilor valutare", impactAmountRon: 0, impactKind: "review", urgencyLabel: `${fees.length || fx.length} tranzacții detectate în extras`, urgencyLevel: "medium", category: fees.length ? "fee_reduction" : "fx_optimization", closed: false,
    contextExplanation: fees.length ? `Plăți etichetate cu comision: ${(-fees.reduce((s, t) => s + t.suma, 0)).toLocaleString("ro-RO")} RON pe perioada extrasului; suma poate include alte costuri, nu reprezintă economie garantată.` : "Extrasul sugerează plăți valutare; fără cursul aplicat și oferta alternativă nu putem confirma o pierdere sau economie.", sourceUrl: "https://ing.ro/persoane-fizice/carduri-si-conturi/conturi-si-carduri",
    primaryAction: { label: "Vezi tranzacțiile detectate", actionType: "one_click_toggle" } });
  return triggers;
}
export function payrollRequest(settings: OptimizationSettings, year: number) {
  return `Către departamentul de salarizare\n\nSubiect: Verificarea deducerii contribuțiilor proprii la pensie facultativă, anul ${year}\n\nVă rog să verificați eligibilitatea și aplicarea deducerii la funcția de bază, conform art. 78 din Codul fiscal, în limita echivalentului a 400 EUR/an.\nContribuție anuală declarată: ${settings.pensionContributionEur} EUR.\nVă rog să confirmați contribuțiile deja deduse, documentele justificative necesare, cursul aplicabil și baza impozabilă disponibilă.\n\nNume: __________________\nData: __________________\nSemnătură: __________________\n\nModel de solicitare; nu este formular fiscal, dovadă de plată sau confirmare de eligibilitate.`;
}