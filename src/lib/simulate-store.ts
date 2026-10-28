/** Simulare (meniu secret): notificare „ești la Carrefour” după 7 secunde. */
import { toast } from "sonner";
export const HIGHLIGHT_KEY = "bestsaves.highlightCard";
export const SIM_DELAY_MS = 7000;
export const SIM_TITLE = "💰 Ești la Carrefour?";
export const SIM_BODY = "Nu uita să folosești cardul BT pentru 5% cashback 💸";

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
