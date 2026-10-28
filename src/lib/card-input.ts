import valid from "card-validator";
import { z } from "zod";
import type { MyCard } from "@/lib/my-cards";
import type { SavingsOffer } from "@/lib/savings-offers";

export type CardNetwork = "Visa" | "Mastercard" | "Amex";
export const digitsOnly = (value: string) => value.replace(/\D/g, "");
export function formatExpiry(value: string) {
  const digits = digitsOnly(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}
export const formatHolder = (value: string) => value.toUpperCase().replace(/[^\p{L} ]/gu, "").slice(0, 100);

/** Rețeaua din BIN (primele cifre) — nu e nevoie de numărul complet. */
export function detectNetwork(bin: string): CardNetwork | undefined {
  const type = valid.number(digitsOnly(bin)).card?.type;
  return type === "visa" ? "Visa" : type === "mastercard" ? "Mastercard" : type === "american-express" ? "Amex" : undefined;
}

/** Prefixe BIN orientative pentru băncile din aplicație; utilizatorul poate corecta banca. */
const BIN_BANKS: [string, string][] = [
  ["404786", "Banca Transilvania"], ["428940", "Banca Transilvania"], ["522449", "Banca Transilvania"],
  ["410566", "ING"], ["535470", "ING"],
  ["421389", "BCR"], ["520094", "BCR"],
  ["406062", "Raiffeisen"], ["517997", "Raiffeisen"],
];
export function detectBank(bin: string): string | undefined {
  const d = digitsOnly(bin);
  return d.length === 6 ? BIN_BANKS.find(([p]) => p === d)?.[1] : undefined;
}

export function cardInputSchema(now = new Date()) {
  return z.object({
    bank: z.string().trim().min(1, "Introdu banca.").max(100, "Maximum 100 de caractere."),
    bin: z.string().regex(/^\d{6}$/, "Introdu exact primele 6 cifre.").refine((v) => Boolean(detectNetwork(v)), "BIN-ul nu corespunde unui card Visa, Mastercard sau Amex."),
    last4: z.string().regex(/^\d{4}$/, "Introdu exact ultimele 4 cifre."),
    holder: z.string().trim().min(2, "Introdu numele titularului.").max(100).regex(/^[\p{L} ]+$/u, "Folosește numai litere și spații."),
    expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Folosește MM/YY, cu o lună între 01 și 12.").refine((value) => {
      const [month, year] = value.split("/").map(Number);
      if (month === undefined || year === undefined) return false;
      return new Date(2000 + year, month, 1).getTime() > now.getTime();
    }, "Cardul trebuie să aibă o dată de expirare în viitor."),
    merchants: z.string().trim().max(500, "Maximum 500 de caractere."),
    percent: z.coerce.number().min(0, "Minimum 0%.").max(100, "Maximum 100%."),
  }).strict();
}
export type CardInput = z.infer<ReturnType<typeof cardInputSchema>>;

const styleFor = (bank: string) => {
  const n = bank.toLowerCase();
  return n.includes("transilvania") || n === "bt" ? "bt" : n.includes("raiffeisen") ? "raiffeisen" : n.includes("ing") ? "ing" : n.includes("bcr") ? "bcr" : undefined;
};

/** Doar metadate non-sensibile (BIN, ultimele 4, rețea, bancă) ies din formular. */
export function cardMetadata(input: CardInput, id: string): MyCard {
  const data = cardInputSchema().parse(input);
  const network = detectNetwork(data.bin);
  const style = styleFor(data.bank);
  return { id, bank: data.bank, name: `Card ${network ?? ""}`.trim(), ...(network ? { network } : {}), ...(style ? { style } : {}), bin: data.bin, last4: data.last4,
    perks: data.merchants.split(",").map((m) => m.trim()).filter(Boolean).map((merchant) => ({ merchant, percent: data.percent })) };
}

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const bankKey = (s: string) => { const n = norm(s); return n.includes("transilvania") || /\bbt\b/.test(n) ? "bt" : n.includes("raiffeisen") ? "raiffeisen" : /\bing\b/.test(n) ? "ing" : n.includes("bcr") ? "bcr" : n.split(/[ (·]/)[0] ?? n; };

/** Oferta de card apare doar dacă banca sau rețeaua ei corespunde unui card salvat. Beneficiile fiscale nu depind de card. */
export function offerMatchesCards(offer: Pick<SavingsOffer, "category" | "bank" | "provider" | "title">, cards: Pick<MyCard, "bank" | "network" | "bin">[]) {
  if (offer.category !== "card") return true;
  const banks = new Set(cards.map((c) => bankKey(c.bank)));
  if (banks.has(bankKey(offer.bank ?? offer.provider))) return true;
  const text = norm(`${offer.provider} ${offer.title}`);
  return cards.some((c) => { const net = c.network ?? (c.bin ? detectNetwork(c.bin) : undefined); return !!net && text.includes(norm(net)); });
}
