import { describe, expect, it } from "vitest";
import { explanationInput, popupPosition } from "../lib/explanation";

describe("selection explanation boundaries", () => {
  it("accepts selected text and rejects empty or oversized input", () => {
    expect(explanationInput.parse({ text: " economisire " }).text).toBe("economisire");
    expect(explanationInput.safeParse({ text: " " }).success).toBe(false);
    expect(explanationInput.safeParse({ text: "a".repeat(1201) }).success).toBe(false);
  });
  it("keeps the popup inside narrow screens", () => {
    const position = popupPosition({ left: 350, top: 620, bottom: 640 }, 390, 700, true);
    expect(position.left + position.width).toBeLessThanOrEqual(378);
    expect(position.top).toBeGreaterThanOrEqual(12);
    expect(position.top + 260).toBeLessThanOrEqual(688);
  });
});