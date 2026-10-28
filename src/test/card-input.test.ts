import { describe, expect, it } from "vitest";
import { cardInputSchema, cardMetadata, detectNetwork, formatExpiry, formatHolder } from "@/lib/card-input";

const schema = cardInputSchema(new Date(2026, 9, 28));
const input = { bank: "ING", bin: "424242", last4: "4242", holder: "MIHNEA CARP", expiry: "12/30", merchants: "", percent: 5 };
describe("new card validation", () => {
  it("detects Visa, Mastercard and Amex from the BIN", () => {
    expect(detectNetwork("424242")).toBe("Visa");
    expect(detectNetwork("555555")).toBe("Mastercard");
    expect(detectNetwork("378282")).toBe("Amex");
  });
  it("rejects a BIN that is not six digits of a known network", () => {
    expect(schema.safeParse({ ...input, bin: "42424" }).success).toBe(false);
    expect(schema.safeParse({ ...input, bin: "4242424" }).success).toBe(false);
    expect(schema.safeParse({ ...input, bin: "999999" }).success).toBe(false);
  });
  it("rejects a last-four block that is not four digits", () => {
    expect(schema.safeParse({ ...input, last4: "424" }).success).toBe(false);
    expect(schema.safeParse({ ...input, last4: "42424" }).success).toBe(false);
  });
  it("keeps only letters and spaces and uppercases the holder", () => {
    expect(formatHolder("Mihnea Șerban 12!" )).toBe("MIHNEA ȘERBAN ");
    expect(schema.safeParse({ ...input, holder: "MIHNEA12" }).success).toBe(false);
  });
  it("formats expiry as MM/YY", () => expect(formatExpiry("1230")).toBe("12/30"));
  it("rejects months outside 01–12", () => {
    expect(schema.safeParse({ ...input, expiry: "00/30" }).success).toBe(false);
    expect(schema.safeParse({ ...input, expiry: "13/30" }).success).toBe(false);
  });
  it("rejects expired dates and accepts cards valid through this month", () => {
    expect(schema.safeParse({ ...input, expiry: "09/26" }).success).toBe(false);
    expect(schema.safeParse({ ...input, expiry: "10/26" }).success).toBe(true);
  });
  it("collects no CVV and no full card number", () => {
    expect(Object.keys(schema.shape)).not.toContain("cvv");
    expect(Object.keys(schema.shape)).not.toContain("number");
    expect(schema.safeParse(input).success).toBe(true);
  });
  it("persists metadata without payment credentials", () => {
    const saved = cardMetadata(input, "test");
    expect(saved.last4).toBe("4242");
    expect(saved.network).toBe("Visa");
    expect(Object.keys(saved)).not.toContain("cvv");
    expect(Object.keys(saved)).not.toContain("number");
    expect(Object.keys(saved)).not.toContain("bin");
    expect(Object.keys(saved)).not.toContain("holder");
    expect(Object.keys(saved)).not.toContain("expiry");
  });
});
