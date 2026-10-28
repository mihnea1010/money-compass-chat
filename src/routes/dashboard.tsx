import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, ArrowRight, FileUp, ShieldCheck } from "lucide-react";
import { ResponsiveContainer, Tooltip, Bar, BarChart, XAxis } from "recharts";
import { RepartizareCheltuieli } from "@/components/RepartizareCheltuieli";
import { Button } from "@/components/ui/button";
import { formatRON } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { clearStatement, loadStatement, parseCSV, saveStatement, statistici, type Categorie, type Tranzactie } from "@/lib/statement";
import { Abonamente } from "@/components/Abonamente";
import { SoldConturi } from "@/components/SoldConturi";
import { ConecteazaBanca } from "@/components/ConecteazaBanca";
import { parseStatementText, pdfToText, toCSV } from "@/lib/pdfStatement";
import { MyCards } from "@/components/MyCards";
import { EMPTY_SETTINGS, loadOptimizationState, saveOptimizationState, type OptimizationState } from "@/lib/optimization-state";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Seif financiar — BestSaves" },
      { name: "description", content: "Venituri, cheltuieli și economii, procesate privat în browserul tău." },
      { property: "og:title", content: "Seif financiar — BestSaves" },
      { property: "og:description", content: "Vezi pe ce merg banii tăi și unde poți economisi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const CULORI = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];

function Dashboard() {
  const navigate = useNavigate();
  const [tranz, setTranz] = useState<Tranzactie[] | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [focus, setFocus] = useState(false);
  const [solduri, setSolduri] = useState(false);
  const [surse, setSurse] = useState(false);
  const [optimization, setOptimization] = useState<OptimizationState>({ settings: EMPTY_SETTINGS, records: [] });
  useEffect(() => { setOptimization(loadOptimizationState()); }, []);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setTranz(loadStatement()); setLoaded(true); }, []);

  const scan = async (text: string) => {
    setErr(null); setScanning(true);
    try {
      const rows = parseCSV(text);
      // Doar descriere + sumă pleacă spre AI; IBAN-ul și alte coloane rămân local.
      const res = await fetch("/api/scan", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: rows.map((r, i) => ({ i, d: r.descriere, s: r.suma })) }) });
      if (!res.ok) throw new Error(await res.text());
      const { rezultate } = (await res.json()) as { rezultate: { i: number; c: Categorie }[] };
      const map = new Map(rezultate.map((r) => [r.i, r.c]));
      const t = rows.map((r, i) => ({ ...r, categorie: map.get(i) ?? (r.suma > 0 ? "alte_venituri" : "altele") }) as Tranzactie);
      saveStatement(t); setTranz(t);
    } catch (e) { setErr(e instanceof Error ? e.message : "Eroare la scanare"); }
    finally { setScanning(false); }
  };
  const onFile = async (f?: File) => {
    if (!f) return;
    if (f.name.toLowerCase().endsWith(".pdf")) {
      setErr(null); setScanning(true);
      try {
        const rows = parseStatementText(await pdfToText(f));
        if (!rows.length) throw new Error("Nu am găsit tranzacții în PDF");
        await scan(toCSV(rows));
      } catch (e) { setErr(e instanceof Error ? e.message : "Eroare PDF"); setScanning(false); }
      return;
    }
    await scan(await f.text());
  };
  const demo = async () => scan(await (await fetch("/extras_ING_demo_2026.csv")).text());

  if (!loaded) return null;
  if (!tranz) return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-await/18 via-await/6 to-transparent">
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-16 text-center md:px-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-await-foreground md:text-3xl">Seif financiar</h1>
        <p className="text-sm text-muted-foreground">Încarcă un extras bancar CSV. Îl citim în browser, iar un AI mic clasifică doar descrierile și sumele.</p>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-await/70 bg-await-soft p-10 text-sm text-muted-foreground transition-colors hover:border-await hover:bg-await/25"
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}>
          {scanning ? <Loader2 className="size-6 animate-spin text-warning-foreground" /> : <FileUp className="size-6 text-warning-foreground" />}
          <div className="font-medium text-warning-foreground">{scanning ? "Scanez tranzacțiile…" : "Încarcă extras bancar (CSV sau PDF)"}</div>
          <div>CSV: Data, Descriere, Suma · PDF: ING sau Revolut, citit local</div>
          <input ref={fileRef} type="file" accept=".csv,text/csv,.pdf,application/pdf" className="hidden" disabled={scanning} onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        <div className="space-y-2 rounded-2xl border border-await/40 bg-card/60 p-4 text-left"><div className="text-sm font-medium">Sau conectează banca prin Open Banking</div><ConecteazaBanca disabled={scanning} onConfirm={demo} /></div>
        <Button variant="outline" className="border-await/60 text-await-foreground hover:bg-await/15 hover:text-await-foreground" onClick={demo} disabled={scanning}>Folosește extrasul demo</Button>
        {err && <p className="text-sm text-destructive">{err}</p>}
      </div>
    </div>
  );

  const st = statistici(tranz);
  const VENITURI = st.venituri;
  const CHELTUIELI = st.cheltuieli.map((c, i) => ({ ...c, color: CULORI[i % CULORI.length] ?? "var(--muted-foreground)" }));
  const CASHFLOW = st.cashflow;
  const venitTotal = VENITURI.salariu + VENITURI.freelancing + VENITURI.dividende + VENITURI.alte;
  const totalCheltuieli = CHELTUIELI.reduce((s, c) => s + c.value, 0) || 1;
  const cheltuitTotal = Math.round(totalCheltuieli * st.nrLuni);
  const economie = venitTotal - cheltuitTotal;
  const reset = () => { clearStatement(); setTranz(null); };


  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Seif financiar</h1>
            <p className="text-sm text-muted-foreground">{tranz.length} tranzacții · {st.perioada[0]} → {st.perioada[st.perioada.length - 1]}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-success-soft px-3 py-1.5 text-xs font-medium text-success-foreground">
            <ShieldCheck className="size-4" /> Stocat doar în browser
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <SoldConturi tranz={tranz} deschis={solduri} onToggle={setSolduri} />
          <button type="button" onClick={() => setSurse((s) => !s)} aria-expanded={surse}
            className={`rounded-2xl border bg-card p-5 text-left shadow-soft transition-all hover:bg-accent/40 ${surse ? "ring-2 ring-primary/30" : ""}`}>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Venituri totale</div>
            <div className="mt-2 font-display text-2xl font-semibold tabular-nums">{formatRON(venitTotal)}</div>
            {surse ? (
              <ul className="mt-3 space-y-1.5 text-sm">
                {([["Salariu", VENITURI.salariu], ["Freelancing", VENITURI.freelancing], ["Dividende", VENITURI.dividende], ["Alte venituri", VENITURI.alte]] as const)
                  .filter(([, v]) => v > 0).map(([n, v]) => (
                    <li key={n} className="flex justify-between gap-2"><span className="text-muted-foreground">{n}</span><span className="tabular-nums font-medium">{formatRON(v)} · {Math.round((v / Math.max(1, venitTotal)) * 100)}%</span></li>
                  ))}
              </ul>
            ) : <div className="mt-1 text-xs text-muted-foreground">{st.nrLuni} luni · apasă pentru surse</div>}
          </button>
          <Kpi label="Cheltuieli lunare" value={formatRON(totalCheltuieli)} hint={`medie / lună · ${CHELTUIELI.length} categorii`} />
        </div>

        <MyCards />

        <div className="grid gap-4 lg:grid-cols-5">
          <section className={`rounded-2xl border bg-card p-5 shadow-soft transition-all ${focus ? "ring-2 ring-primary/30 lg:col-span-5" : "lg:col-span-2"}`}>
            <RepartizareCheltuieli tranz={tranz} cheltuieli={CHELTUIELI} nrLuni={st.nrLuni} culori={CULORI} onFocus={setFocus} />
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-soft lg:col-span-3">
            <h2 className="mb-4 font-medium">Încasări lunare</h2>
            <div className="h-52">
              <ResponsiveContainer>
                <BarChart data={CASHFLOW}>
                  <XAxis dataKey="luna" axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip formatter={(v: number) => formatRON(v)} cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="v" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Din venituri, câți bani ți-au rămas</span>
                <span>{formatRON(Math.max(0, economie))} reținuți</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${economie >= 0 ? "bg-primary" : "bg-warning"}`} style={{ width: `${Math.min(100, Math.max(0, (Math.max(0, economie) / Math.max(1, venitTotal)) * 100))}%` }} />
              </div>
            </div>
          </section>
        </div>

        <Abonamente tranz={tranz} />


        <div className="flex justify-center"><Button variant="ghost" onClick={reset}><FileUp className="size-4" /> Încarcă alt extras</Button></div>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: "warn" | undefined }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</div>
      <div className={tone === "warn" ? "mt-1 text-xs text-warning-foreground" : "mt-1 text-xs text-muted-foreground"}>{hint}</div>
    </div>
  );
}

