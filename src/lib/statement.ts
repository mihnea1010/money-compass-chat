import { extractMerchant, normalizeDate, parseAmount } from "./statement-parse";

export const CATEGORII = [
  "salariu", "freelancing", "dividende", "alte_venituri",
  "chirie_utilitati", "mancare", "abonamente_tech", "transport", "shopping", "altele",
] as const;
export type Categorie = (typeof CATEGORII)[number];

export const ETICHETE: Record<Categorie, string> = {
  salariu: "Salariu", freelancing: "Freelancing", dividende: "Dividende", alte_venituri: "Alte venituri",
  chirie_utilitati: "Chirie & utilități", mancare: "Mâncare & supermarket", abonamente_tech: "Abonamente & tech",
  transport: "Transport", shopping: "Shopping", altele: "Altele",
};

export type Tranzactie = { data: string; descriere: string; suma: number; categorie: Categorie };

const KEY = "clarai.statement";
export const loadStatement = (): Tranzactie[] | null => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { return null; }
};
export const saveStatement = (t: Tranzactie[]) => localStorage.setItem(KEY, JSON.stringify(t));
export const clearStatement = () => localStorage.removeItem(KEY);

/**
 * Parse CSV local, tolerant la formate de la mai multe bănci (ING, Revolut, BCR...).
 * Recunoaște coloana de sumă unică (Suma/Amount) SAU coloane separate Debit/Credit.
 * Alte coloane (IBAN etc.) sunt ignorate și nu părăsesc browserul.
 */
export function parseCSV(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const split = (l: string) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"'));
  const head = split(lines[0] ?? "").map((h) => h.toLowerCase().trim());

  // Data: preferă data tranzacției/decontării în locul datei de emitere a extrasului.
  const dateCols = head.map((h, i) => ({ h, i })).filter(({ h }) => /\bdata\b|date|dată/.test(h));
  const prefDate = dateCols.find(({ h }) => /(tranzac|complet|operation|value|valut|decont)/.test(h) && !/issu|emit/.test(h));
  const iD = (prefDate ?? dateCols.find(({ h }) => !/issu|emit/.test(h)) ?? dateCols[0])?.i ?? -1;

  // Descriere / detalii tranzacție.
  const iT = head.findIndex((h) => /descr|detali|detail|explica|tranz.*detali|detalii.*tranz/.test(h));

  // Debit/Credit separate (bani ieșiți / intrați). Exclude coloanele de total.
  const iDebit = head.findIndex((h) => /debit/.test(h) && !/total/.test(h) && !/linii|limit/.test(h));
  const iCredit = head.findIndex((h) => /credit/.test(h) && !/total/.test(h) && !/linii|limit/.test(h));
  // Sumă unică: o coloană de valoare care NU este debit/credit/total.
  const iS = head.findIndex((h, i) => i !== iDebit && i !== iCredit
    && (/^sum[ăa]$|\bsum[ăa]\b|amount|valoare|value\b|sum[ăa] plătit/.test(h)) && !/total|debit|credit/.test(h));

  // Dacă avem coloane debit+credit, le preferăm; altfel folosim coloana unică.
  const hasSplit = iDebit >= 0 && iCredit >= 0;
  const hasSingle = !hasSplit && iS >= 0;
  if (iD < 0 || iT < 0 || (!hasSingle && !hasSplit)) {
    throw new Error("Coloane lipsă: am nevoie de o coloană de dată, una de descriere și o sumă (Suma/Amount sau Debit+Credit).");
  }

  return lines.slice(1).filter(Boolean).map((l) => {
    const c = split(l);
    const data = normalizeDate(c[iD] ?? "");
    const descriere = extractMerchant(c[iT] ?? "");
    let suma: number;
    if (hasSingle) {
      suma = parseAmount(c[iS] ?? "");
    } else {
      const debit = parseAmount(c[iDebit] ?? "") || 0;
      const credit = parseAmount(c[iCredit] ?? "") || 0;
      // Debit = bani ieșiți (negativ), Credit = bani intrați (pozitiv).
      suma = credit - Math.abs(debit);
    }
    return { data, descriere, suma };
  }).filter((r) => r.data && Number.isFinite(r.suma) && r.suma !== 0 && r.descriere);
}

const VENIT: Categorie[] = ["salariu", "freelancing", "dividende", "alte_venituri"];
const LUNI = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function statistici(t: Tranzactie[]) {
  const sum = (c: Categorie) => t.filter((x) => x.categorie === c).reduce((s, x) => s + x.suma, 0);
  const venituri = { salariu: sum("salariu"), freelancing: sum("freelancing"), dividende: sum("dividende"), alte: sum("alte_venituri") };
  const luni = [...new Set(t.map((x) => x.data.slice(0, 7)))].sort();
  const nrLuni = Math.max(1, luni.length);
  const cheltuieli = CATEGORII.filter((c) => !VENIT.includes(c))
    .map((c) => ({ categorie: c, name: ETICHETE[c], value: Math.round(-sum(c) / nrLuni) }))
    .filter((c) => c.value > 0).sort((a, b) => b.value - a.value);
  const cashflow = luni.map((l) => ({
    luna: LUNI[Number(l.slice(5, 7)) - 1] ?? l,
    v: Math.round(t.filter((x) => x.data.startsWith(l) && x.suma > 0).reduce((s, x) => s + x.suma, 0)),
  }));
  return { venituri, cheltuieli, cashflow, nrLuni, perioada: luni };
}
