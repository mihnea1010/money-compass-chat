import type { OptimizationSettings } from "./optimization-state";

export const CARD_SOURCES = {
  bcr: "https://www.bcr.ro/ro/persoane-fizice/conturi-si-operatiuni/carduri-de-debit/cardul-george-platinum",
  exclusions: "https://www.bcr.ro/ro/persoane-fizice/digital-banking/cont-online-george",
  direct: "https://www.btdirect.ro/en/cardul-direct-de-la-carrefour/",
  flying: "https://intreb.bancatransilvania.ro/en/cum-primesc-mile-la-cumparaturi-cu-cardul-de-credit-bt-flying-blue/",
  pago: "https://www.pago.ro/plateste-factura/bt-direct",
};
export const VERIFIED_CARD_CONTEXT = `Surse oficiale consultate la 28.10.2026:
BCR George 3.0 Platinum: minimum 10.000 RON încasări eligibile/lună pentru scutirea comisionului de administrare de 50 RON/lună. Nu este rulaj de cumpărături. Transferurile între conturile proprii BCR sunt excluse. Nu presupune eligibilitatea fondurilor reciclate. Priority Pass: 10 intrări/an împărțite cu invitații, NU nelimitat. Lounge Visa intern: 6 intrări/an și 7.500 RON cumpărături în ultimele 30 zile, separat de condiția de încasări. Sursa ${CARD_SOURCES.bcr} și ${CARD_SOURCES.exclusions}.
BT Direct de la Carrefour: 5% cashback la Carrefour, 2% la alți comercianți, doar cumpărături eligibile plătite integral; până la 55 zile grație dacă rambursezi integral. Nu extrapola la orice card BT Direct. Sursa ${CARD_SOURCES.direct}.
Flying Blue: la cumpărături eligibile în România, Classic 1 milă/5 RON, Premium 1,3 mile/5 RON; nu confunda variantele. Sursa ${CARD_SOURCES.flying}.
Pago permite plata BT Direct prin scanarea codului de bare (${CARD_SOURCES.pago}), dar acordarea milelor Flying Blue pentru rambursarea acestei datorii NU este verificată. Nu recomanda double-dipping sau stiva ca profit garantat. Nu afirma 220 RON, 540/650 mile sau lounge activ fără dovadă. Rambursare integrală la scadența extrasului; dobânzile și comisioanele pot depăși recompensele.`;

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
  if (settings.cards.includes("bcr") && eligibleVolumeGap(settings.bcrEligibleVolume) > 0) result.push({
    id: `bcr-${year}-${month}`, type: "volume_threshold", cardName: "BCR George Platinum",
    title: `Îți lipsesc ${eligibleVolumeGap(settings.bcrEligibleVolume).toLocaleString("ro-RO")} RON încasări eligibile`,
    description: "Pragul de 10.000 RON/lună poate evita comisionul de 50 RON. Transferurile între conturile proprii BCR nu contează; confirmă celelalte încasări în George.",
    daysRemaining: new Date(Date.UTC(year, month, 0)).getUTCDate() - day, actionButtonLabel: "Verifică în George", actionPayload: { targetUrl: "https://george.bcr.ro/" },
  });
  if ((settings.cards.includes("direct") || settings.cards.includes("flying")) && settings.creditDueRon > 0 && /^\d{4}-\d{2}-\d{2}$/.test(settings.creditDueDate)) {
    const days = Math.ceil((Date.parse(`${settings.creditDueDate}T00:00:00Z`) - Date.UTC(year, month - 1, day)) / 86400000);
    result.push({ id: `credit-${settings.creditDueDate}`, type: "perk_expiry", cardName: "Card de credit",
      title: days < 0 ? "Scadența introdusă a trecut" : `Rambursează integral până la ${settings.creditDueDate}`,
      description: `Sold declarat: ${settings.creditDueRon.toLocaleString("ro-RO")} RON. Verifică extrasul și evită dobânzile; plata prin Pago nu garantează mile Flying Blue.`,
      daysRemaining: days, actionButtonLabel: settings.cards.includes("direct") ? "Vezi plata BT Direct în Pago" : "Vezi condițiile BT", actionPayload: { targetUrl: settings.cards.includes("direct") ? CARD_SOURCES.pago : CARD_SOURCES.flying },
    });
  }
  return result;
}