/** Detectare „faci cumpărături”: stai cel puțin 5 minute lângă același magazin. */
export const DWELL_MS = 5 * 60 * 1000;
export const STORE_RADIUS_M = 120;

export type Store = { id: string; name: string; lat: number; lon: number };
export type Presence = { storeId: string | null; since: number; notified: boolean };

export function distanceM(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function nearestStore(pos: { lat: number; lon: number }, stores: Store[]) {
  let best: Store | null = null, bestD = Infinity;
  for (const s of stores) { const d = distanceM(pos, s); if (d < bestD) { best = s; bestD = d; } }
  return best && bestD <= STORE_RADIUS_M ? best : null;
}

/** Actualizează prezența; `notify` devine true o singură dată după 5 minute în același magazin. */
export function stepPresence(prev: Presence, store: Store | null, now: number): { next: Presence; notify: boolean } {
  const id = store?.id ?? null;
  if (id !== prev.storeId) return { next: { storeId: id, since: now, notified: false }, notify: false };
  if (id && !prev.notified && now - prev.since >= DWELL_MS) return { next: { ...prev, notified: true }, notify: true };
  return { next: prev, notify: false };
}

/** Caută în OpenStreetMap magazinele din oferte aflate în apropiere. */
export async function fetchNearbyStores(lat: number, lon: number, merchants: string[]): Promise<Store[]> {
  if (!merchants.length) return [];
  const re = merchants.map((m) => m.replace(/[^\p{L}\p{N} ]/gu, "")).join("|");
  const q = `[out:json][timeout:15];(nwr["shop"]["name"~"${re}",i](around:1500,${lat},${lon});nwr["shop"]["brand"~"${re}",i](around:1500,${lat},${lon}););out center 60;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: "data=" + encodeURIComponent(q) });
  if (!res.ok) return [];
  const json = (await res.json()) as { elements: { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[] };
  return json.elements.flatMap((e) => {
    const la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon;
    const name = e.tags?.["brand"] ?? e.tags?.["name"];
    return la != null && lo != null && name ? [{ id: `${e.type}/${e.id}`, name, lat: la, lon: lo }] : [];
  });
}
