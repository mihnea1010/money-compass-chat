import valid from "card-validator";
import { z } from "zod";
import type { MyCard } from "@/lib/my-cards";

export type CardNetwork = "Visa" | "Mastercard" | "Amex";
export const digitsOnly = (value: string) => value.replace(/\D/g, "");
export function formatExpiry(value: string) {
  const digits = digitsOnly(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}
export const formatHolder = (value: string) => value.toUpperCase().replace(/[^\p{L} ]/gu, "").slice(0, 100);
export function detectNetwork(value: string): CardNetwork | undefined {
  const type = valid.number(digitsOnly(value)).card?.type;
  return type === "visa" ? "Visa" : type === "mastercard" ? "Mastercard" : type === "american-express" ? "Amex" : undefined;
}
/** PCI-DSS: the form collects only the 6-digit BIN and the last 4 digits — never a full number, never a CVV. */
export function cardInputSchema(now = new Date()) {
  return z.object({
    bank: z.string().trim().min(1, "Introdu banca.").max(100, "Maximum 100 de caractere."),
    bin: z.string().trim().regex(/^\d{6}$/, "Introdu cele 6 cifre ale codului BIN.").refine((value) => Boolean(detectNetwork(value)), "Nu recunoaștem această rețea de card."),
    last4: z.string().trim().regex(/^\d{4}$/, "Introdu ultimele 4 cifre ale cardului."),
    holder: z.string().trim().min(2, "Introdu numele titularului.").max(100).regex(/^[\p{L} ]+$/u, "Folosește numai litere și spații."),
    expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Folosește MM/YY, cu o lună între 01 și 12.").refine((value) => {
      const [month, year] = value.split("/").map(Number);
      if (month === undefined || year === undefined) return false;
      return new Date(2000 + year, month, 1).getTime() > now.getTime();
    }, "Cardul trebuie să aibă o dată de expirare în viitor."),
    merchants: z.string().trim().max(500, "Maximum 500 de caractere."),
    percent: z.coerce.number().min(0, "Minimum 0%.").max(100, "Maximum 100%."),
  });
}
export type CardInput = z.infer<ReturnType<typeof cardInputSchema>>;

/** Only non-sensitive wallet metadata leaves the ephemeral form. */
export function cardMetadata(input: CardInput, id: string): MyCard {
  const data = cardInputSchema().parse(input);
  const network = detectNetwork(data.bin);
  const bank = data.bank;
  const normalized = bank.toLowerCase();
  const style = normalized.includes("transilvania") || normalized === "bt" ? "bt" : normalized.includes("raiffeisen") ? "raiffeisen" : normalized.includes("ing") ? "ing" : normalized.includes("bcr") ? "bcr" : undefined;
  return { id, bank, name: `Card ${network ?? ""}`.trim(), ...(network ? { network } : {}), ...(style ? { style } : {}), last4: data.last4, perks: data.merchants.split(",").map((m) => m.trim()).filter(Boolean).map((merchant) => ({ merchant, percent: data.percent })) };
}
