import { detecteazaAbonamente } from "./subscriptions";
import { statistici, type Tranzactie } from "./statement";

/** Subscriptions look excessive above 300 lei/month or above 10% of average monthly spending. */
export function subscriptionAlert(transactions: Tranzactie[], stopped: string[] = []) {
  const subs = detecteazaAbonamente(transactions).filter((a) => !stopped.includes(a.id));
  const monthly = subs.reduce((s, a) => s + a.costLunar, 0);
  const spend = statistici(transactions).cheltuieli.reduce((s, c) => s + c.value, 0);
  return { monthly, count: subs.length, excessive: subs.length > 0 && (monthly > 300 || (spend > 0 && monthly / spend > 0.1)) };
}
