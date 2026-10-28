import { describe, expect, it } from "vitest";
import { cardInputSchema, cardMetadata, detectNetwork, formatCardNumber, formatExpiry, formatHolder } from "@/lib/card-input";

const schema = cardInputSchema(new Date(2026, 9, 28));
const input = { bank: "ING", number: "4242 4242 4242 4242", holder: "MIHNEA CARP", expiry: "12/30", cvv: "123", merchants: "", percent: 5 };
describe("new card validation", () => {
  it("groups the number in four-digit blocks", () => expect(formatCardNumber("4242424242424242")).toBe("4242 4242 4242 4242"));
  it("detects Visa, Mastercard and Amex", () => {
    expect(detectNetwork(input.number)).toBe("Visa");
    expect(detectNetwork("5555555555554444")).toBe("Mastercard");
    expect(detectNetwork("378282246310005")).toBe("Amex");
  });
  it("rejects a failed Luhn checksum", () => expect(schema.safeParse({ ...input, number: "4242 4242 4242 4241" }).success).toBe(false));
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
  it("requires three CVV digits for Visa and Mastercard", () => {
    expect(schema.safeParse(input).success).toBe(true);
    expect(schema.safeParse({ ...input, cvv: "1234" }).success).toBe(false);
    expect(schema.safeParse({ ...input, number: "5555555555554444", cvv: "12" }).success).toBe(false);
  });
  it("requires four CVV digits for Amex", () => {
    expect(schema.safeParse({ ...input, number: "378282246310005", cvv: "1234" }).success).toBe(true);
    expect(schema.safeParse({ ...input, number: "378282246310005", cvv: "123" }).success).toBe(false);
  });
  it("persists metadata without payment credentials", () => {
    const saved = cardMetadata(input, "test");
    expect(saved.last4).toBe("4242");
    expect(saved.network).toBe("Visa");
    expect(Object.keys(saved)).not.toContain("cvv");
    expect(Object.keys(saved)).not.toContain("number");
    expect(Object.keys(saved)).not.toContain("holder");
    expect(Object.keys(saved)).not.toContain("expiry");
  });
});