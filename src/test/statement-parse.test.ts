import { describe, expect, it } from "vitest";
import { parseCSV } from "@/lib/statement";
import { parseStatementText } from "@/lib/pdfStatement";
import { normalizeDate, parseAmount, extractMerchant, categorizeLocal } from "@/lib/statement-parse";

describe("normalizeDate", () => {
  it("passes through ISO", () => expect(normalizeDate("2026-05-03")).toBe("2026-05-03"));
  it("converts DD.MM.YYYY (RO)", () => expect(normalizeDate("21.10.2026")).toBe("2026-10-21"));
  it("converts DD/MM/YYYY", () => expect(normalizeDate("03/05/2026")).toBe("2026-05-03"));
  it("uses MM/DD when first group > 12", () => expect(normalizeDate("10/15/2026")).toBe("2026-10-15"));
  it("returns empty on junk", () => expect(normalizeDate("not a date")).toBe(""));
});

describe("parseAmount", () => {
  it("handles US thousands + decimal", () => expect(parseAmount("4,000.00")).toBe(4000));
  it("handles RO thousands + decimal", () => expect(parseAmount("1.234,56")).toBe(1234.56));
  it("handles plain", () => expect(parseAmount("7.65")).toBe(7.65));
  it("handles negatives and currency suffix", () => expect(parseAmount("-200 RON")).toBe(-200));
  it("returns NaN when empty", () => expect(Number.isNaN(parseAmount(""))).toBe(true));
});

describe("extractMerchant", () => {
  it("pulls merchant from a BCR Locatie blob", () => {
    expect(extractMerchant("Tranz ... Locatie: 21601750 RO CARREFOUR MK DOROBANTI 11BUCURESTI. Data_Ora: 20-10-2026 17:34:38"))
      .toBe("CARREFOUR MK DOROBANTI 11BUCURESTI");
  });
  it("keeps salary details", () => {
    expect(extractMerchant("Plata Instant ... -Detalii: salariu 09.2026")).toContain("salariu");
  });
});

describe("categorizeLocal (AI fallback)", () => {
  it("income salary", () => expect(categorizeLocal("salariu 09.2026", 1679)).toBe("salariu"));
  it("supermarket", () => expect(categorizeLocal("CARREFOUR MK DOROBANTI", -7.65)).toBe("mancare"));
  it("subscriptions", () => expect(categorizeLocal("NETFLIX.COM", -59.99)).toBe("abonamente_tech"));
  it("fuel/transport", () => expect(categorizeLocal("OMV PETROM", -173.94)).toBe("transport"));
  it("shopping", () => expect(categorizeLocal("EMAG.RO", -392.57)).toBe("shopping"));
});

describe("parseCSV multi-format", () => {
  it("parses a single Suma column (ING style)", () => {
    const csv = "Data,Descriere,Suma,Moneda\n2026-05-01,CARREFOUR HIPER,-200.14,RON\n2026-05-02,Salariu ACME,5000,RON";
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ data: "2026-05-01", suma: -200.14 });
    expect(rows[1]?.suma).toBe(5000);
  });
  it("parses BCR debit/credit split columns and extracts merchants", () => {
    const head = "Issuing date of the statement,Transaction completion date,Transaction's details,Debit (amount),Credit (amount),Total debit (amount)";
    const r1 = `29.10.2026,21.10.2026,"Tranz Ref 1, Suma platita 7.65 RON. Locatie: 21601750 RO CARREFOUR MK DOROBANTI 11BUCURESTI. Data_Ora: 20-10-2026",7.65,0,7.65`;
    const r2 = `29.10.2026,12.10.2026,"Plata Instant -Detalii: salariu 09.2026",0,"1,679.00",0`;
    const rows = parseCSV(`${head}\n${r1}\n${r2}`);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ data: "2026-10-21", suma: -7.65 });
    expect(rows[0]?.descriere).toContain("CARREFOUR");
    expect(rows[1]?.suma).toBe(1679);
  });
  it("throws a helpful error when required columns are absent", () => {
    expect(() => parseCSV("Foo,Bar\n1,2")).toThrow(/Coloane lipsă/);
  });
});

describe("parseStatementText BCR PDF", () => {
  it("reconstructs transactions from Suma platita / Data_Ora blocks", () => {
    const text = [
      "ACCOUNT STATEMENT #1 of: 10/29/2026",
      "10/18/2026 18:06 Tranzactie comerciant Ref 904278131446, Suma platita 7.34 RON. Comision: 0 RON. Locatie: 61716935 RO LIDL RO-191 BUCURESTI. Data_Ora: 17-10-2026 13:12:30",
    ].join("\n");
    const rows = parseStatementText(text);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ data: "2026-10-17", suma: -7.34 });
    expect(rows[0]?.descriere).toContain("LIDL");
  });
});
