import { create } from "zustand";
import { persist } from "zustand/middleware";
import { loadCards, type MyCard } from "@/lib/my-cards";

/** Starea globală a portofelului: cardurile utilizatorului, persistate în localStorage. */
type StoreState = {
  userCards: MyCard[];
  addCard: (card: MyCard) => void;
  removeCard: (id: string) => void;
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      userCards: [],
      addCard: (card) => set((state) => ({ userCards: [...state.userCards, card] })),
      removeCard: (id) => set((state) => ({ userCards: state.userCards.filter((c) => c.id !== id) })),
    }),
    { name: "bestsaves.userCards.v1", partialize: (s) => ({ userCards: s.userCards }) },
  ),
);

let bootstrapped = false;

/** Migrare unică din cheia veche de localStorage în starea globală (rulată o dată, din useEffect). */
export function bootstrapCards() {
  if (bootstrapped || typeof window === "undefined") return;
  bootstrapped = true;
  const legacy = loadCards();
  if (legacy.length && useStore.getState().userCards.length === 0) {
    useStore.setState({ userCards: legacy });
  }
}
