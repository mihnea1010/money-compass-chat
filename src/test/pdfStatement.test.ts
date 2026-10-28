import { describe, expect, it } from "vitest";
import { parseStatementText } from "@/lib/pdfStatement";

describe("parseStatementText", () => {
  it("reads Romanian-format ING lines", () => {
    expect(parseStatementText("03.05.2026 TAZZ BY EMAG -1.113,04")).toEqual([{ data: "2026-05-03", descriere: "TAZZ BY EMAG", suma: -1113.04 }]);
  });
  it("reads Revolut-format lines", () => {
    expect(parseStatementText("12/06/2026 Client Payment +2,500.00")[0]?.suma).toBe(2500);
  });
});
