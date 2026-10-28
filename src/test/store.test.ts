import { beforeEach, describe, expect, it } from "vitest";
import { bootstrapCards, useStore } from "@/store/useStore";
import type { MyCard } from "@/lib/my-cards";

const card = (id: string): MyCard => ({ id, bank: "Banca Transilvania", name: "Card", perks: [] });

describe("useStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.setState({ userCards: [] });
  });

  it("addCard appends and removeCard deletes by id", () => {
    useStore.getState().addCard(card("a"));
    useStore.getState().addCard(card("b"));
    expect(useStore.getState().userCards.map((c) => c.id)).toEqual(["a", "b"]);
    useStore.getState().removeCard("a");
    expect(useStore.getState().userCards.map((c) => c.id)).toEqual(["b"]);
  });

  it("persists userCards to localStorage", () => {
    useStore.getState().addCard(card("persist"));
    const raw = localStorage.getItem("bestsaves.userCards.v1");
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).state.userCards.map((c: MyCard) => c.id)).toContain("persist");
  });

  it("migrates legacy cards exactly once through bootstrapCards", () => {
    localStorage.setItem("bestsaves.myCards.v3", JSON.stringify([card("legacy")]));
    bootstrapCards();
    const ids = useStore.getState().userCards.map((c) => c.id);
    expect(ids).toContain("legacy");
    expect(ids).toContain("raiffeisen-cashback"); // loadCards adaugă presetul Raiffeisen
    useStore.setState({ userCards: [] });
    bootstrapCards();
    expect(useStore.getState().userCards).toEqual([]);
  });
});
