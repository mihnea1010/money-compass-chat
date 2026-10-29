/** Simulare (meniu secret): notificare „ești la Carrefour” după 7 secunde. */
import { toast } from "sonner";
import type { LocationOffer } from "./offer-notifications";
import { notificationText } from "./offer-notifications";
export const HIGHLIGHT_KEY = "bestsaves.highlightCard";
export const SIM_DELAY_MS = 7000;
export const SIM_TITLE = "💰 DEMO · Ești la Carrefour?";
export const SIM_BODY = "Simulare: cardul BT cu 5% cashback fictiv, nu o ofertă reală 💸";

/**
 * DEMO: trimite imediat notificarea concretă pentru o ofertă aleasă manual
 * (din panoul dev din Seiful meu) și evidențiază cardul afiliat. Logica de
 * potrivire este reală; doar declanșarea este manuală, nu din GPS.
 */
export async function sendOfferNotification(offer: LocationOffer, open?: () => void) {
  const { title, body } = notificationText(offer);
  const go = () => {
    sessionStorage.setItem(HIGHLIGHT_KEY, offer.cardId);
    window.dispatchEvent(new Event("bestsaves:highlight"));
    open?.();
  };
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.requestPermissions();
      LocalNotifications.addListener("localNotificationActionPerformed", go);
      await LocalNotifications.schedule({ notifications: [{ id: Date.now() % 100000, title, body }] });
      go();
      return;
    }
  } catch { /* continuăm în browser */ }
  if ("Notification" in window && Notification.permission === "default") {
    try { await Notification.requestPermission(); } catch { /* ignore */ }
  }
  if ("Notification" in window && Notification.permission === "granted") {
    const n = new Notification(title, { body });
    n.onclick = () => { window.focus(); go(); n.close(); };
  }
  toast(title, { description: body, duration: 15000, action: { label: "Deschide cardul", onClick: go } });
  go();
}

export function simulateCarrefour(open: () => void) {
  if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  const go = () => { sessionStorage.setItem(HIGHLIGHT_KEY, "bt-debit"); window.dispatchEvent(new Event("bestsaves:highlight")); open(); };
  setTimeout(async () => {
    try {
      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor.isNativePlatform()) {
        const { LocalNotifications } = await import("@capacitor/local-notifications");
        await LocalNotifications.requestPermissions();
        LocalNotifications.addListener("localNotificationActionPerformed", go);
        await LocalNotifications.schedule({ notifications: [{ id: 7007, title: SIM_TITLE, body: SIM_BODY }] });
        return;
      }
    } catch { /* continuăm în browser */ }
    if ("Notification" in window && Notification.permission === "granted") {
      const n = new Notification(SIM_TITLE, { body: SIM_BODY });
      n.onclick = () => { window.focus(); go(); n.close(); };
    }
    toast(SIM_TITLE, { description: SIM_BODY, duration: 15000, action: { label: "Deschide Seiful", onClick: go } });
  }, SIM_DELAY_MS);
}
