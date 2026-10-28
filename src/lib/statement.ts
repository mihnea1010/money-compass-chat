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

/** Parse CSV local: Data, Descriere, Suma (alte coloane, ex. IBAN, sunt ignorate și nu pleacă din browser). */
export function parseCSV(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const split = (l: string) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"'));
  const head = split(lines[0] ?? "").map((h) => h.toLowerCase());
  const iD = head.findIndex((h) => h.includes("data"));
  const iT = head.findIndex((h) => h.includes("descr") || h.includes("detalii"));
  const iS = head.findIndex((h) => h.includes("suma") || h.includes("amount"));
  if (iD < 0 || iT < 0 || iS < 0) throw new Error("Coloane lipsă: Data, Descriere, Suma");
  return lines.slice(1).filter(Boolean).map((l) => {
    const c = split(l);
    return { data: c[iD] ?? "", descriere: c[iT] ?? "", suma: Number((c[iS] ?? "0").replace(",", ".")) };
  }).filter((r) => r.data && Number.isFinite(r.suma));
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
