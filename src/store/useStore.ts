import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { loadCards, type MyCard } from "@/lib/my-cards";

/** O optimizare activată de utilizator, cu valoarea anuală estimată în momentul activării. */
export type ActiveOptimization = { id: string; annualRon: number };
export const ROI_YEARS = 5;

export interface AppState {
  /** Doar metadate: BIN (primele 6), ultimele 4, rețea, bancă — niciodată PAN complet sau CVV. */
  userCards: MyCard[];
  activeOptimizations: ActiveOptimization[];
  addCard: (card: MyCard) => void;
  removeCard: (id: string) => void;
  activateOptimization: (id: string, annualRon?: number) => void;
}

const KEY = "bestsaves.store.v1";

export const useStore = create<AppState>()(persist((set) => ({
  userCards: [],
  activeOptimizations: [],
  addCard: (card) => set((s) => ({ userCards: [...s.userCards, card] })),
  removeCard: (id) => set((s) => ({ userCards: s.userCards.filter((c) => c.id !== id) })),
  activateOptimization: (id, annualRon = 0) => set((s) => s.activeOptimizations.some((o) => o.id === id) ? s
    : { activeOptimizations: [...s.activeOptimizations, { id, annualRon: Math.max(0, annualRon) }] }),
}), { name: KEY, storage: createJSONStorage(() => localStorage), skipHydration: true }));

/** Valoarea pe ROI_YEARS ani a optimizărilor active. */
export const fiveYearValue = (active: ActiveOptimization[]) => active.reduce((s, o) => s + o.annualRon, 0) * ROI_YEARS;

let hydrated = false;
/** Rulează după montare (evită nepotrivirea SSR); migrează cardurile vechi la prima rulare. */
export function hydrateStore() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const fresh = !localStorage.getItem(KEY);
  void Promise.resolve(useStore.persist.rehydrate()).then(() => { if (fresh) useStore.setState({ userCards: loadCards() }); });
}
