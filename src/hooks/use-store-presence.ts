import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { bestCardForStore, knownMerchants, type MyCard } from "@/lib/my-cards";
import { distanceM, fetchNearbyStores, nearestStore, stepPresence, type Presence, type Store } from "@/lib/store-presence";

type Pos = { lat: number; lon: number };

async function notify(title: string, body: string) {
  if (Capacitor.isNativePlatform()) {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.schedule({ notifications: [{ id: Date.now() % 100000, title, body }] });
  } else if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

/** Urmărește locația și întoarce magazinul în care ești acum (după potrivire cu ofertele cardurilor tale). */
export function useStorePresence(cards: MyCard[], enabled: boolean) {
  const [store, setStore] = useState<Store | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cardsRef = useRef(cards); cardsRef.current = cards;
  const merchantsKey = knownMerchants(cards).join("|");

  useEffect(() => {
    if (!enabled || !merchantsKey) return;
    let stores: Store[] = [], fetchedAt: Pos | null = null, pos: Pos | null = null;
    let presence: Presence = { storeId: null, since: Date.now(), notified: false };
    let cancelled = false, stopWatch: () => void = () => {};

    const evaluate = () => {
      if (!pos) return;
      const s = nearestStore(pos, stores);
      setStore(s);
      const { next, notify: fire } = stepPresence(presence, s, Date.now());
      presence = next;
      if (fire && s) {
        const best = bestCardForStore(cardsRef.current, s.name);
        notify(`Faci cumpărături la ${s.name}?`, best ? `Nu uita să folosești ${best.card.bank} pentru cashback-ul de ${best.perk.percent}%.` : "Verifică ce card îți aduce cel mai mult aici.");
      }
    };
    const onPos = async (p: Pos) => {
      pos = p;
      if (!fetchedAt || distanceM(fetchedAt, p) > 800) {
        fetchedAt = p;
        try { stores = await fetchNearbyStores(p.lat, p.lon, merchantsKey.split("|")); } catch { /* rămân magazinele vechi */ }
      }
      if (!cancelled) evaluate();
    };

    (async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const { Geolocation } = await import("@capacitor/geolocation");
          const { LocalNotifications } = await import("@capacitor/local-notifications");
          await Geolocation.requestPermissions(); await LocalNotifications.requestPermissions();
          const id = await Geolocation.watchPosition({ enableHighAccuracy: true }, (p) => p && onPos({ lat: p.coords.latitude, lon: p.coords.longitude }));
          stopWatch = () => { Geolocation.clearWatch({ id }); };
        } else {
          if ("Notification" in window && Notification.permission === "default") await Notification.requestPermission();
          const id = navigator.geolocation.watchPosition((p) => onPos({ lat: p.coords.latitude, lon: p.coords.longitude }), (e) => setError(e.message), { enableHighAccuracy: true });
          stopWatch = () => navigator.geolocation.clearWatch(id);
        }
      } catch (e) { setError(e instanceof Error ? e.message : "Locația nu e disponibilă"); }
    })();
    const tick = setInterval(evaluate, 30000);
    return () => { cancelled = true; clearInterval(tick); stopWatch(); };
  }, [enabled, merchantsKey]);

  return { store, error };
}
