import type { OptimizationSettings } from "./optimization-state";

export const CARD_SOURCES = {
  bcr: "https://www.bcr.ro/ro/persoane-fizice/conturi-si-operatiuni/carduri-de-debit/cardul-george-platinum",
  exclusions: "https://www.bcr.ro/ro/persoane-fizice/digital-banking/cont-online-george",
  direct: "https://www.btdirect.ro/en/cardul-direct-de-la-carrefour/",
  flying: "https://intreb.bancatransilvania.ro/en/cum-primesc-mile-la-cumparaturi-cu-cardul-de-credit-bt-flying-blue/",
  pago: "https://www.pago.ro/plateste-factura/bt-direct",
};
export const CARD_CONTEXT = `Nu există în acest proiect dovezi arhivate care să confirme termenii actuali ai ofertelor bancare.
Procentele din cardurile demo (inclusiv Raiffeisen și BT 5%) sunt simulate. Nu le recomanda ca oferte reale.
Linkurile de referință ${Object.values(CARD_SOURCES).join(", ")} nu constituie singure verificare. Cere confirmarea produsului, procentelor, condițiilor, limitelor, comisioanelor și valabilității la bancă.
Nu afirma praguri de încasări, costuri, număr de intrări lounge, perioade de grație sau rate de mile fără dovezi specifice. Nu recomanda double-dipping sau rotirea fondurilor. Soldul și scadența declarate nu confirmă beneficii.`;

export interface CardPerkLoop {
  id: string;
  name: string;
  description: string;
  monthlyEstimatedYieldRon: number | null;
  activeCardsRequired: Array<{ bank: string; cardName: string; role: "liquidity_hub" | "cashback_spender" | "miles_settler" | "utility_payer"; requirementMet: boolean }>;
  executionSteps: Array<{ stepNumber: number; title: string; actionDetail: string; deepLinkUrl: string; isAutomatedOrAssisted: boolean }>;
}
export interface ChurningAlert {
  id: string; type: "volume_threshold" | "bill_settlement_double_dip" | "perk_expiry"; cardName: string;
  title: string; description: string; daysRemaining: number | null;
  actionButtonLabel: string; actionPayload: { targetUrl: string };
}
export function eligibleVolumeGap(volume: number) { return Math.max(0, 10000 - Math.max(0, volume)); }
export function cardAlerts(settings: OptimizationSettings, today: Date): ChurningAlert[] {
  const result: ChurningAlert[] = [];
  const dateParts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(today);
  const year = Number(dateParts.find((p) => p.type === "year")?.value);
  const month = Number(dateParts.find((p) => p.type === "month")?.value);
  const day = Number(dateParts.find((p) => p.type === "day")?.value);
  if ((settings.cards.includes("direct") || settings.cards.includes("flying")) && settings.creditDueRon > 0 && /^\d{4}-\d{2}-\d{2}$/.test(settings.creditDueDate)) {
    const days = Math.ceil((Date.parse(`${settings.creditDueDate}T00:00:00Z`) - Date.UTC(year, month - 1, day)) / 86400000);
    result.push({ id: `credit-${settings.creditDueDate}`, type: "perk_expiry", cardName: "Card de credit",
      title: days < 0 ? "Scadența introdusă a trecut" : `Rambursează integral până la ${settings.creditDueDate}`,
      description: `Sold declarat: ${settings.creditDueRon.toLocaleString("ro-RO")} RON. Verifică extrasul și evită dobânzile. Beneficiile și metodele de plată din catalog nu sunt confirmate.`,
      daysRemaining: days, actionButtonLabel: settings.cards.includes("direct") ? "Verifică referința de plată" : "Verifică referința BT", actionPayload: { targetUrl: settings.cards.includes("direct") ? CARD_SOURCES.pago : CARD_SOURCES.flying },
    });
  }
  return result;
}