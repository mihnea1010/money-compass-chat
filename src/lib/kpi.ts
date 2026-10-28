import { CONTURI_DEMO, fluxLuna, lunaCurenta, totalTip, type Cont } from "./accounts";
import { ETICHETE, statistici, type Categorie, type Tranzactie } from "./statement";

/** Categorii folosite în formulele KPI. */
const ESENTIALE: Categorie[] = ["chirie_utilitati", "mancare", "transport"];
const FIXE: Categorie[] = ["chirie_utilitati", "abonamente_tech"];
const DISCRETIONARE: Categorie[] = ["shopping", "altele"];
const DATORIE = /\b(rata|credit|leasing|imprumut|împrumut|card de credit)\b/i;

const r1 = (n: number) => Math.round(n * 10) / 10;
const div = (a: number, b: number) => (b > 0 ? a / b : 0);

/** Calculează indicatorii din Seif. Toate valorile sunt lunare (medie pe perioada extrasului). */
export function calculeazaKpi(t: Tranzactie[], conturi: Cont[] = CONTURI_DEMO, varsta = 30) {
  const st = statistici(t);
  const n = st.nrLuni;
  const lunar = (c: Categorie[]) => st.cheltuieli.filter((x) => c.includes(x.categorie)).reduce((s, x) => s + x.value, 0);
  const venitLunar = (st.venituri.salariu + st.venituri.freelancing + st.venituri.dividende + st.venituri.alte) / n;
  const cheltuieliLunare = st.cheltuieli.reduce((s, x) => s + x.value, 0);
  const datorieLunara = -t.filter((x) => x.suma < 0 && DATORIE.test(x.descriere)).reduce((s, x) => s + x.suma, 0) / n;
  const economisitLunar = venitLunar - cheltuieliLunare;
  const curent = totalTip(conturi, "curent");
  const economii = totalTip(conturi, "economii");
  const fixe = lunar(FIXE) + datorieLunara;
  const aniRamasi = Math.max(0, 65 - varsta);
  // NPV al veniturilor viitoare, actualizare 3%/an până la 65 de ani.
  const capitalUman = venitLunar * 12 * (aniRamasi ? (1 - 1.03 ** -aniRamasi) / 0.03 : 0);
  const activeFinanciare = curent + economii;

  return {
    venitLunar: Math.round(venitLunar),
    cheltuieliLunare: Math.round(cheltuieliLunare),
    savingsRate: r1(div(economisitLunar, venitLunar) * 100),
    emergencyRunwayLuni: r1(div(activeFinanciare, lunar(ESENTIALE))),
    dti: r1(div(datorieLunara, venitLunar) * 100),
    viabilityRatio: r1(div(venitLunar - fixe - lunar(ESENTIALE.filter((c) => !FIXE.includes(c))), venitLunar)),
    requisiteVariety: r1(div(lunar(DISCRETIONARE), fixe)),
    humanToFinancial: r1(div(capitalUman, activeFinanciare)),
    // Portofoliu investit aproximat cu conturile de economii (nu avem date de investiții).
    fireProgress: r1(div(economii, 25 * cheltuieliLunare * 12) * 100),
  };
}

/** Tot ce știe Seiful, pentru Copilot (principiul „full trust"). */
export function seifPentruAI(t: Tranzactie[] | null, varsta?: number) {
  if (!t?.length) return null;
  const st = statistici(t);
  const luna = lunaCurenta(t);
  return {
    perioada: `${st.perioada[0]} → ${st.perioada.at(-1)} (${st.nrLuni} luni)`,
    conturi: CONTURI_DEMO,
    soldCurentTotal: totalTip(CONTURI_DEMO, "curent"),
    soldEconomiiTotal: totalTip(CONTURI_DEMO, "economii"),
    venituriPeSurse: st.venituri,
    cheltuieliLunarePeCategorii: st.cheltuieli.map((c) => ({ categorie: ETICHETE[c.categorie], lunar: c.value })),
    incasariLunare: st.cashflow,
    lunaCurenta: { luna, ...fluxLuna(t, luna) },
    kpi: calculeazaKpi(t, CONTURI_DEMO, varsta),
  };
}
