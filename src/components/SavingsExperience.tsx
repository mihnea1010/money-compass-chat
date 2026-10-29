import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, ChevronLeft, Clock3, CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { OptimizationSettings } from "@/components/OptimizationSettings";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { applyAiOrder, spendByCategory, type SavingsOffer } from "@/lib/savings-offers";
import { recordOptimization, realizedTotal, saveOptimizationState, type OptimizationState } from "@/lib/optimization-state";
import { useSavings } from "@/hooks/use-savings";
import { pickOffers } from "@/lib/ai-picker.functions";
import { useProfile } from "@/lib/profile";
import { statusLabel } from "@/lib/offer-integrity";
import { SavingsGraphic } from "@/components/SavingsGraphic";

const lei = (value: number) => value.toLocaleString("ro-RO", { maximumFractionDigits: 0 });
export function SavingsExperience() {
  const { profil } = useProfile();
  const { transactions, state, setState, today, example, offers: baseOffers, bankLoading } = useSavings();
  const [started, setStarted] = useState(false);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [filter, setFilter] = useState("all");
  const [confirm, setConfirm] = useState<SavingsOffer | null>(null);
  const [amount, setAmount] = useState("");
  const pick = useServerFn(pickOffers);
  const ai = useQuery({
    queryKey: ["ai-pick", example, baseOffers.map((o) => `${o.id}:${o.status}:${o.annualRon}`).join(",")],
    enabled: !example && baseOffers.some((o) => o.status === "verified"),
    staleTime: Infinity, retry: false,
    queryFn: () => pick({ data: { spend: spendByCategory(transactions), offers: baseOffers.filter((o) => o.status === "verified").map(({ id, title, annualRon, minutes, provider }) => ({ id, title, annualRon, minutes, provider })) } }),
  });
  const year = Number(new Intl.DateTimeFormat("en", { timeZone: "Europe/Bucharest", year: "numeric" }).format(today));
  const offers = useMemo(() => ai.data ? applyAiOrder(baseOffers, ai.data.order, ai.data.reasons) : baseOffers, [baseOffers, ai.data]);
  const total = offers.reduce((s, o) => s + o.annualRon, 0);
  const remaining = offers.filter((o) => !skipped.includes(o.id));
  const current = remaining[0];
  const visible = offers.filter((o) => filter === "all" || o.category === filter);
  const update = (next: OptimizationState) => {
    try { saveOptimizationState(next); setState(next); } catch { toast.error("Nu am putut salva datele în browser."); }
  };
  const openOffer = (offer: SavingsOffer) => window.open(offer.url, "_blank", "noopener,noreferrer");
  return <div className="h-full overflow-y-auto">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 md:px-10">
      <div className="text-sm font-medium">Bani în plus. Nu sfaturi în plus.</div>
      <Button variant="ghost" size="sm" asChild><Link to="/dashboard"><ShieldCheck />Seiful meu <ArrowUpRight /></Link></Button>
    </header>
    <div className="mx-auto max-w-5xl px-5 md:px-10">
      {!started ? <>
        <section className="relative border-b pb-8 pt-9 md:pb-10 md:pt-12">
          <div className="relative z-10 max-w-xl">
            <div className="mb-5 flex items-center gap-2 text-xs font-medium text-success-foreground"><span className="size-2 rounded-full bg-savings" />{example ? "UN EXEMPLU DE POTENȚIAL. NU O PROMISIUNE." : `OPORTUNITĂȚI PENTRU ${profil?.nume?.toUpperCase() ?? "TINE"}`}</div>
            <h1 className="font-display text-3xl font-semibold leading-tight md:text-4xl">BestSaves. Mai mulți bani<br />rămân la tine.</h1>
            <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1"><span className="font-display text-6xl font-semibold tabular-nums text-success-foreground md:text-7xl">{lei(total)}</span><span className="text-xl text-success-foreground">lei / an</span></div>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{example ? "Calcul fictiv pe oferte simulate și cheltuieli ilustrative. Nu reprezintă oferte reale ale băncilor sau economii personale." : total > 0 ? `Economii potențiale din datele tale. ${offers.filter((o) => o.annualRon > 0).length} pași cu impact calculabil, cei mai eficienți primii.` : "Nu există economii bancare confirmabile din catalogul actual. Ofertele simulate sau fără dovezi nu contribuie la cifra ta."}</p>
            <Button variant="savings" size="lg" className="mt-6 h-14 w-full max-w-sm gap-4 text-base" onClick={() => { setStarted(true); setSkipped([]); }}>Salvează bani <ArrowRight /></Button>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>Fără cont</span><span>Fără plăți automate</span><span>Statutul fiecărei oferte este explicit</span></div>
          </div>
          <SavingsGraphic className="absolute inset-y-0 right-0 hidden w-[42%] max-w-[460px] lg:block" />
          {example ? <details className="mt-6 max-w-xl text-xs text-muted-foreground"><summary className="cursor-pointer">Cum ajunge exemplul la {lei(total)} lei?</summary><p className="mt-2 leading-relaxed">Scenariu fictiv: cheltuieli lunare ilustrative și procentele din ofertele marcate DEMO. Calculul presupune cost anual zero și rambursare integrală. Nu sunt oferte reale, tarife actuale sau datele tale.</p><Button variant="link" size="sm" className="mt-2 h-auto p-0" asChild><Link to="/dashboard">Încarcă extrasul pentru cifra ta <ArrowRight /></Link></Button></details> : <p className="mt-5 text-xs text-muted-foreground">Estimare pe 12 luni, nu economie garantată. Costurile declarate sunt scăzute din cashback; eligibilitatea se verifică la furnizor.</p>}
        </section>
        <section className="py-7">
          <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-display text-xl font-semibold">Banii pe care îi lași pe masă</h2><p className="mt-1 text-xs text-muted-foreground">{example ? "Exemplu ilustrativ" : "Din Seiful tău"} · ordonați după lei economisiți / minut de efort</p></div>{!example && <OptimizationSettings value={state.settings} onSave={(settings) => update({ ...state, settings })} />}</div>
          <div className="mt-5 flex flex-wrap gap-1 border-b pb-3" role="group" aria-label="Tip de oportunitate">{([["all", "Toate"], ["card", "Carduri"], ["tax", "Beneficii fiscale"]] as const).map(([id, label]) => <Button key={id} size="sm" variant={filter === id ? "secondary" : "ghost"} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</Button>)}</div>
          <div className="divide-y">{visible.map((offer, i) => <div key={offer.id} className="flex items-center gap-3 py-5"><span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">{String(i + 1).padStart(2, "0")}</span><div className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-primary">{offer.category === "card" ? <CreditCard className="size-5" /> : <Sparkles className="size-5" />}</div><div className="min-w-0 flex-1"><div className="text-xs text-muted-foreground">{offer.provider} · {statusLabel(offer.status)}</div><h3 className="mt-1 text-sm text-muted-foreground">{offer.title}</h3><div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" />~{offer.minutes} min efort</div></div><div className="shrink-0 text-right"><div className="text-sm font-semibold text-success-foreground">{offer.annualRon > 0 ? `+${lei(offer.annualRon)} lei` : "De calculat"}</div><div className="mt-1 text-xs text-muted-foreground">{offer.status === "demo" ? "simulare · nu economie reală" : offer.annualRon > 0 ? "/ an orientativ" : "termeni neconfirmați"}</div></div></div>)}</div>
          {bankLoading && <p className="py-4 text-sm text-muted-foreground">Încarc ofertele băncilor…</p>}{!example && ai.isFetching && <p className="py-2 text-xs text-muted-foreground">AI-ul alege ofertele potrivite pentru tine…</p>}{visible.length === 0 && !bankLoading && <p className="py-8 text-sm text-muted-foreground">Nicio oportunitate disponibilă în această categorie.</p>}
        </section>
      </> : <section className="py-8 md:py-12">
        <Button variant="ghost" size="sm" className="mb-6 -ml-3" onClick={() => setStarted(false)}><ChevronLeft />Toate oportunitățile</Button>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-medium text-success-foreground">{example ? "PARCURGI EXEMPLUL" : "PLANUL TĂU DE ECONOMISIRE"} · {offers.length - remaining.length + (current ? 1 : 0)} / {offers.length}</span><span className="text-sm text-muted-foreground">{lei(remaining.reduce((s, o) => s + o.annualRon, 0))} lei/an potențial rămas</span></div>
        {current ? <article key={current.id} className="max-w-2xl motion-safe:animate-in motion-safe:fade-in">
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground"><CreditCard className="size-4" />{current.provider}<span className="ml-auto flex items-center gap-1 text-xs"><Clock3 className="size-3" />~{current.minutes} min</span></div>
          <h1 className="font-display text-6xl font-semibold tabular-nums text-success-foreground md:text-7xl">{current.annualRon > 0 ? <>+{lei(current.annualRon)} <span className="text-2xl">{current.status === "demo" ? "lei / an simulat" : "lei / an"}</span></> : <span className="text-4xl">{current.status === "demo" ? "Date simulate" : "Ofertă de verificat"}</span>}</h1>
          <p className="mt-4 text-sm font-semibold text-primary">{statusLabel(current.status)}</p><p className="mt-2 text-xs text-muted-foreground">{current.statusExplanation}</p><p className="mt-4 text-sm font-medium text-muted-foreground">{current.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground/80">{current.description}</p>
          {current.reason && <p className="mt-3 flex items-start gap-2 text-sm text-primary"><Sparkles className="mt-0.5 size-4 shrink-0" />{current.reason}</p>}
          <ol className="my-7 space-y-4 border-y py-6">{current.steps.map((step, i) => <li key={step} className="flex gap-3 text-sm"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-primary">{i + 1}</span><span className="pt-0.5">{step}</span></li>)}</ol>
          <div className="flex flex-wrap gap-3">{current.url && <Button variant="savings" className="h-auto min-h-12 whitespace-normal py-3" onClick={() => openOffer(current)}>{current.action}<ArrowUpRight /></Button>}{!example && current.status === "verified" && <Button variant="outline" className="h-auto min-h-12 whitespace-normal py-3" onClick={() => { setConfirm(current); setAmount(""); }}><Check />Confirmă economia realizată</Button>}</div>
          <Button className="mt-3" variant="ghost" onClick={() => { setSkipped([...skipped, current.id]); }}>Nu acum, următoarea <ArrowRight /></Button>
          <details className="mt-6 border-t pt-4 text-xs text-muted-foreground" open><summary className="cursor-pointer font-medium">Condiții și calcul</summary><p className="mt-2 leading-relaxed">{current.conditions}</p></details>
          {example && <div className="mt-6 border-l-2 border-primary pl-4"><p className="text-sm">Acesta este un exemplu, nu planul tău personal.</p><Button variant="link" className="h-auto p-0 pt-2" asChild><Link to="/dashboard">Calculează din Seiful meu <ArrowRight /></Link></Button></div>}
          {!example && !current.calculable && <div className="mt-5"><OptimizationSettings value={state.settings} onSave={(settings) => update({ ...state, settings })} /></div>}
        </article> : <div className="max-w-lg py-10"><Check className="mb-5 size-10 text-success-foreground" /><h1 className="font-display text-3xl font-semibold">Ai parcurs oportunitățile.</h1><p className="mt-3 text-sm text-muted-foreground">{example ? "Acum află cât poți economisi tu, cu datele din Seif." : `${lei(realizedTotal(state.records, year))} lei confirmați de tine în ${year}. Pașii amânați pot fi revăzuți.`}</p><Button variant="savings" className="mt-6" onClick={() => { setStarted(false); setSkipped([]); }}>Revino la economii <ArrowRight /></Button><Button variant="link" className="mt-3" asChild><Link to="/dashboard">Deschide Seiful</Link></Button></div>}
      </section>}
      <footer className="flex flex-wrap justify-between gap-3 border-t py-5 text-xs text-muted-foreground"><span className="flex items-center gap-2"><ShieldCheck className="size-3.5" />Datele tale rămân în acest browser.</span><span>Demo, neconfirmate sau verificate cu dovezi · fără garanții de câștig</span></footer>
    </div>
    <Dialog open={!!confirm} onOpenChange={(open) => { if (!open) setConfirm(null); }}><DialogContent><DialogHeader><DialogTitle>Câți bani ai economisit efectiv?</DialogTitle><DialogDescription>Introdu suma netă deja realizată, nu proiecția anuală. Deschiderea ofertei nu înseamnă economie.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); const n = Number(amount); if (!confirm || confirm.status !== "verified" || amount.trim() === "" || !Number.isFinite(n) || n < 0 || n > 1000000) return; update({ ...state, records: recordOptimization(state.records, { id: confirm.id, year, status: "completed", realizedRon: n }) }); setConfirm(null); toast.success("Economia declarată a fost salvată în browser."); }}><label className="block space-y-2 text-sm">Economia netă realizată (lei)<Input type="number" min={0} max={1000000} step="0.01" required autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} /></label><Button variant="savings" type="submit" className="w-full">Confirmă suma <Check /></Button></form></DialogContent></Dialog>
  </div>;
}