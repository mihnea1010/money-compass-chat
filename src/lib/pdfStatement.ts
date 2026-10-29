import { extractMerchant } from "./statement-parse";

type Row = { data: string; descriere: string; suma: number };

/** Extras simplu ING/Revolut: fiecare rând = `DD.MM.YYYY  descriere  sumă`. */
function parseSimpleLines(text: string): Row[] {
  const out: Row[] = [];
  const re = /(\d{2})[./-](\d{2})[./-](\d{4})\s+(.+?)\s+(-?\+?[\d.]+,\d{2}|-?\+?[\d,]+\.\d{2})(?=\s|$)/g;
  for (const line of text.split(/\n/)) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line))) {
      const [, d, mo, y, desc, raw] = m;
      const num = raw!.includes(",") && raw!.lastIndexOf(",") > raw!.lastIndexOf(".")
        ? raw!.replace(/\./g, "").replace(",", ".") : raw!.replace(/,/g, "");
      const suma = Number(num.replace("+", ""));
      if (Number.isFinite(suma)) out.push({ data: `${y}-${mo}-${d}`, descriere: desc!.trim(), suma });
    }
  }
  return out;
}

/**
 * Extras BCR/George: tranzacțiile apar ca blocuri cu "Suma platita X RON" (debit,
 * bani ieșiți) sau "Plata Instant/Decontare ... Credit" (bani intrați), cu data în
 * tiparul `Data_Ora: DD-MM-YYYY`. Reconstruim din tot textul, nu linie cu linie.
 */
function parseBcr(text: string): Row[] {
  const flat = text.replace(/\s+/g, " ");
  const out: Row[] = [];
  // Debit: plăți la comercianți / retrageri.
  const spend = /Suma (?:platita|retrasa)\s+([\d.,]+)\s*RON[\s\S]*?Data_Ora:\s*(\d{2})-(\d{2})-(\d{4})/gi;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = spend.exec(flat))) {
    const amount = Number(m[1]!.replace(/\./g, (m[1]!.match(/,\d{2}$/) ? "" : "")).replace(",", "."));
    const num = m[1]!.includes(",") && m[1]!.lastIndexOf(",") > m[1]!.lastIndexOf(".")
      ? m[1]!.replace(/\./g, "").replace(",", ".") : m[1]!.replace(/,/g, "");
    const suma = -Math.abs(Number(num));
    const data = `${m[4]}-${m[3]}-${m[2]}`;
    // descriere din fragmentul "Locatie: ..." care precede Data_Ora
    const ctx = flat.slice(Math.max(0, m.index - 10), m.index + m[0]!.length);
    const descriere = extractMerchant(ctx) || "Plată card";
    const key = `${data}|${suma}|${descriere}`;
    if (Number.isFinite(suma) && suma !== 0 && !seen.has(key)) { seen.add(key); out.push({ data, descriere, suma }); }
    void amount;
  }
  return out;
}

/** Extrage tranzacții dintr-un text de extras PDF. Încearcă mai multe formate. Rulează local. */
export function parseStatementText(text: string): Row[] {
  const bcr = /ACCOUNT STATEMENT|Tranzactie comerciant|Suma platita|George Banking/i.test(text) ? parseBcr(text) : [];
  const simple = parseSimpleLines(text);
  // Alege formatul care a extras mai multe tranzacții.
  return bcr.length >= simple.length ? (bcr.length ? bcr : simple) : simple;
}

/** Transformă rândurile în CSV pentru pipeline-ul existent. */
export const toCSV = (r: { data: string; descriere: string; suma: number }[]) =>
  "Data,Descriere,Suma\n" + r.map((x) => `${x.data},"${x.descriere.replace(/"/g, '""')}",${x.suma}`).join("\n");

export async function pdfToText(file: File) {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const lines: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const c = await (await doc.getPage(p)).getTextContent();
    const rows = new Map<number, string[]>();
    for (const it of c.items as { str: string; transform: number[] }[]) {
      const y = Math.round(it.transform[5]!);
      rows.set(y, [...(rows.get(y) ?? []), it.str]);
    }
    [...rows].sort((a, b) => b[0] - a[0]).forEach(([, s]) => lines.push(s.join(" ")));
  }
  return lines.join("\n");
}
