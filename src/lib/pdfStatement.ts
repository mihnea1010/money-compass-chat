/** Extrage tranzacții dintr-un text de extras PDF (ING/Revolut). Rulează local. */
export function parseStatementText(text: string) {
  const out: { data: string; descriere: string; suma: number }[] = [];
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
