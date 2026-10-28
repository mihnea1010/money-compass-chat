import { describe, expect, it } from "vitest";
import { demoCardDetails } from "@/lib/card-demo";

describe("fictitious card details", () => {
  it("masks number and CVV before unlocking", () => { expect(demoCardDetails("Visa", "")).toEqual({ number: "•••• •••• •••• ••••", cvv: "•••" }); });
  it("any password reveals only the Visa test number", () => { expect(demoCardDetails("Visa", "x")).toEqual({ number: "4242 4242 4242 4242", cvv: "123" }); });
  it("any password reveals only the Mastercard test number", () => { expect(demoCardDetails("Mastercard", "anything")).toEqual({ number: "5555 5555 5555 4444", cvv: "123" }); });
  it("clearing unlock state masks both values again", () => {
    expect(demoCardDetails("Mastercard", "abc").cvv).toBe("123");
    expect(demoCardDetails("Mastercard", "").cvv).toBe("•••");
    expect(demoCardDetails("Mastercard", "").number).toBe("•••• •••• •••• ••••");
  });
});