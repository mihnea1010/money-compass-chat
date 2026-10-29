/**
 * Ajutoare browser-safe pentru citirea extraselor bancare în formate variate
 * (ING, Revolut, BCR/George etc.). Nimic nu părăsește browserul.
 */

/** Normalizează o dată în `YYYY-MM-DD`. Acceptă `YYYY-MM-DD`, `DD.MM.YYYY`,
 *  `DD/MM/YYYY`, `MM/DD/YYYY` (euristic) și `DD-MM-YYYY`. Întoarce "" dacă nu poate. */
export function normalizeDate(raw: string): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  // deja ISO
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // DD.MM.YYYY / DD-MM-YYYY / DD/MM/YYYY (sau MM/DD/YYYY)
  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (m) {
    let a = Number(m[1]), b = Number(m[2]);
    const y = m[3];
    // Dacă primul grup nu poate fi zi (>12), presupunem MM/DD; altfel DD/MM (uzual în RO).
    let day = a, mon = b;
    if (a > 12 && b <= 12) { day = a; mon = b; }
    else if (b > 12 && a <= 12) { day = b; mon = a; }
    else { day = a; mon = b; } // ambigue → DD/MM (convenție RO)
    const dd = String(day).padStart(2, "0");
    const mm = String(mon).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  }
  // YYYY/MM/DD
  m = s.match(/^(\d{4})[./](\d{1,2})[./](\d{1,2})/);
  if (m) return `${m[1]}-${String(Number(m[2])).padStart(2, "0")}-${String(Number(m[3])).padStart(2, "0")}`;
  return "";
}

/** Convertește un text numeric de extras în număr. Gestionează separatorii de mii
 *  și ambele convenții zecimale ("4,000.00" și "1.234,56"). Întoarce NaN dacă e gol. */
export function parseAmount(raw: string): number {
  let s = (raw ?? "").trim().replace(/\s/g, "");
  if (!s) return NaN;
  const neg = /^-/.test(s) || /^\(.*\)$/.test(s);
  s = s.replace(/[()]/g, "").replace(/^[+-]/, "").replace(/(ron|lei|eur|usd)$/i, "");
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) {
    // zecimala e virgula: 1.234,56 → 1234.56
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    // zecimala e punctul (sau fără zecimale): 4,000.00 → 4000.00
    s = s.replace(/,/g, "");
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return NaN;
  return neg ? -Math.abs(n) : n;
}

/**
 * Scoate numele comerciantului dintr-un text de detalii stil BCR/George, de ex.:
 * "... Locatie: 21601750 RO CARREFOUR MK DOROBANTI 11BUCURESTI ..."
 * Întoarce un nume scurt și relevant ("CARREFOUR MK DOROBANTI") pentru potrivire,
 * sau textul original tăiat dacă nu găsește un tipar cunoscut.
 */
export function extractMerchant(details: string): string {
  const d = (details ?? "").trim();
  if (!d) return "";
  // Tipar BCR: "Locatie: <cod> RO <MERCHANT ...> <ORAS>"
  const loc = d.match(/Locatie:\s*\S+\s+[A-Z]{2}\s+(.+?)(?:\.\s*Data_Ora|$)/i);
  if (loc && loc[1]) {
    // taie orașul final lipit (ex. "11BUCURESTI") și spațiile multiple
    return loc[1].replace(/\s+/g, " ").trim().slice(0, 60);
  }
  // Transferuri / salarii: păstrează partea relevantă a detaliilor
  const salariu = d.match(/Detalii:\s*(.+?)(?:\s{2,}|$)/i);
  if (salariu && salariu[1]) return salariu[1].replace(/\s+/g, " ").trim().slice(0, 60);
  return d.replace(/\s+/g, " ").trim().slice(0, 80);
}

import type { Categorie } from "./statement";

/**
 * Clasificare locală de rezervă (fără AI) pe bază de cuvinte-cheie din descriere.
 * Folosită când serverul AI nu răspunde, ca extrasul să se încarce oricum.
 */
export function categorizeLocal(descriere: string, suma: number): Categorie {
  const d = descriere.toLowerCase();
  if (suma > 0) {
    if (/salari|salary|payroll/.test(d)) return "salariu";
    if (/upwork|fiverr|freelanc|client|factura|invoice|escrow/.test(d)) return "freelancing";
    if (/dividend|xtb|broker|etf/.test(d)) return "dividende";
    return "alte_venituri";
  }
  if (/chirie|rent|enel|digi|rcs|rds|gaz|apa|electrica|factura|utilit/.test(d)) return "chirie_utilitati";
  if (/mega image|kaufland|carrefour|lidl|auchan|penny|profi|glovo|tazz|bolt.*food|food|restaurant|pizza|cafe|caffe|taco|mcdonald|kfc/.test(d)) return "mancare";
  if (/netflix|spotify|adobe|openai|chatgpt|google one|youtube|hbo|disney|abonament/.test(d)) return "abonamente_tech";
  if (/omv|petrom|rompetrol|mol|lukoil|benzin|carburant|uber|bolt|taxi|stb|metrorex|cfr|tren|parcare|rca|revolut/.test(d)) return "transport";
  if (/emag|amazon|h&m|zara|decathlon|altex|flanco|fashion|cumparatur|shopping|magazin|store/.test(d)) return "shopping";
  return "altele";
}
