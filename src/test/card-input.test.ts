import { describe, expect, it } from "vitest";
import { cardInputSchema, cardMetadata, detectNetwork, formatExpiry, formatHolder, offerMatchesCards } from "@/lib/card-input";
import { fiveYearValue, useStore } from "@/store/useStore";

const schema = cardInputSchema(new Date(2026, 9, 28));
const input = { bank: "ING", bin: "424242", last4: "4242", holder: "MIHNEA CARP", expiry: "12/30", merchants: "", percent: 5 };
describe("PCI-DSS card form", () => {
  it("detects network from the 6-digit BIN", () => {
    expect(detectNetwork("424242")).toBe("Visa");
    expect(detectNetwork("555555")).toBe("Mastercard");
    expect(detectNetwork("378282")).toBe("Amex");
  });
  it("requires exactly 6 BIN digits and 4 last digits", () => {
    expect(schema.safeParse(input).success).toBe(true);
    expect(schema.safeParse({ ...input, bin: "42424" }).success).toBe(false);
    expect(schema.safeParse({ ...input, last4: "424" }).success).toBe(false);
  });
  it("rejects a CVV or full number field", () => {
    expect(schema.safeParse({ ...input, cvv: "123" }).success).toBe(false);
    expect(schema.safeParse({ ...input, number: "4242424242424242" }).success).toBe(false);
  });
  it("uppercases the holder", () => expect(formatHolder("Mihnea Șerban 12!")).toBe("MIHNEA ȘERBAN "));
  it("formats expiry and rejects past dates", () => {
    expect(formatExpiry("1230")).toBe("12/30");
    expect(schema.safeParse({ ...input, expiry: "09/26" }).success).toBe(false);
    expect(schema.safeParse({ ...input, expiry: "13/30" }).success).toBe(false);
  });
  it("persists only BIN, last 4, network and bank", () => {
    const saved = cardMetadata(input, "t");
    expect(saved).toMatchObject({ bin: "424242", last4: "4242", network: "Visa", bank: "ING" });
    for (const k of ["cvv", "number", "holder", "expiry"]) expect(Object.keys(saved)).not.toContain(k);
  });
});

describe("offers follow saved cards", () => {
  const offer = { category: "card" as const, bank: "Raiffeisen Bank", provider: "Raiffeisen Bank · Card", title: "5% Carrefour" };
  it("shows a bank offer only when a card from that bank is saved", () => {
    expect(offerMatchesCards(offer, [{ bank: "Raiffeisen" }])).toBe(true);
    expect(offerMatchesCards(offer, [{ bank: "ING" }])).toBe(false);
  });
  it("matches network-based offers by card network", () =>
    expect(offerMatchesCards({ category: "card", provider: "Campanie · Mastercard", title: "Marțea Mastercard" }, [{ bank: "BCR", network: "Mastercard" }])).toBe(true));
  it("keeps tax offers regardless of cards", () => expect(offerMatchesCards({ category: "tax", provider: "Fiscal", title: "x" }, [])).toBe(true));
});

describe("global store", () => {
  it("activating adds 5 years of the annual value, once", () => {
    useStore.setState({ activeOptimizations: [] });
    useStore.getState().activateOptimization("a", 1000);
    useStore.getState().activateOptimization("a", 1000);
    expect(fiveYearValue(useStore.getState().activeOptimizations)).toBe(5000);
  });
  it("adds and removes cards", () => {
    useStore.setState({ userCards: [] });
    useStore.getState().addCard({ id: "x", bank: "BT", name: "c", perks: [] });
    useStore.getState().removeCard("x");
    expect(useStore.getState().userCards).toHaveLength(0);
  });
});
