import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, Download, RotateCcw, Sparkles, X, Eye, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { OptimizationSettings } from "./OptimizationSettings";
import { useStore } from "@/store/useStore";
import { buildOptimizations, payrollRequest, type OptimizationTrigger } from "@/lib/optimizations";
import { cardAlerts } from "@/lib/card-loops";
import { EMPTY_SETTINGS, loadOptimizationState, saveOptimizationState, recordOptimization, realizedTotal, type OptimizationState } from "@/lib/optimization-state";
import type { Tranzactie } from "@/lib/statement";
import { formatRON, cn } from "@/lib/utils";

const CATEGORY = { tax_bonification: "Beneficiu fiscal", salary_deduction: "Salarizare", fee_reduction: "Comisioane", fx_optimization: "Schimb valutar", cashback_arbitrage: "Recompense" };

export function ProactiveOptimizations({ tranz, onSettingsChange }: { tranz: Tranzactie[]; onSettingsChange?: (s: OptimizationState["settings"]) => void }) {
  const activated = useStore((s) => s.activeOptimizations);
  const activate = useStore((s) => s.activateOptimization);
  const [state, setState] = useState<OptimizationState>({ settings: EMPTY_SETTINGS, records: [] });
  const [today, setToday] = useState(new Date());
  const [confirm, setConfirm] = useState<OptimizationTrigger | null>(null);
  const [amount, setAmount] = useState("");
  const [review, setReview] = useState(false);
  useEffect(() => {
    setState(loadOptimizationState());
    const timer = setInterval(() => setToday(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const year = Number(new Intl.DateTimeFormat("en", { timeZone: "Europe/Bucharest", year: "numeric" }).format(today));
  const triggers = useMemo(() => buildOptimizations(tranz, state.settings, today), [tranz, state.settings, today]);
  const active = triggers.filter((t) => !t.closed && !state.records.some((r) => r.id === t.id && r.year === year));
  const closed = triggers.filter((t) => t.closed);
  const estimates = active.reduce((s, t) => s + t.impactAmountRon, 0);
  const realized = realizedTotal(state.records, year);
  const alerts = cardAlerts(state.settings, today);
  const update = (next: OptimizationState) => {
    try { saveOptimizationState(next); setState(next); onSettingsChange?.(next.settings); } catch { toast.error("Nu am putut salva în browser. Verifică spațiul disponibil."); }
  };
  const dismiss = (t: OptimizationTrigger) => update({ ...state, records: recordOptimization(state.records, { id: t.id, year, status: "dismissed", realizedRon: 0 }) });
  const run = (t: OptimizationTrigger) => {
    if (t.primaryAction.actionType === "generate_pdf") {
      const url = URL.createObjectURL(new Blob([payrollRequest(state.settings, year)], { type: "text/plain;charset=utf-8" }));
      const a = document.createElement("a"); a.href = url; a.download = `cerere-salarizare-${year}.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Cererea a fost descărcată. Completeaz-o și verific-o cu salarizarea.");
    } else if (t.primaryAction.actionType === "one_click_toggle") setReview(true);
    else if (t.primaryAction.payload?.url) {
      window.open(t.primaryAction.payload.url, "_blank", "noopener,noreferrer");
      toast.info("Pagina oficială a fost deschisă. Nicio plată sau depunere nu a fost efectuată.");
    }
  };
  const relevant = tranz.filter((t) => t.suma < 0 && /comision|commission|taxa administrare|taxă administrare|\b(eur|usd|schimb valutar|conversie)\b/i.test(t.descriere));

  return <section className="space-y-5 border-y py-6" aria-label="Optimizări active">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><div className="mb-1 flex items-center gap-2 text-xs font-medium text-primary"><Sparkles className="size-4" /> OPORTUNITĂȚI PENTRU TINE</div><h2 className="font-display text-xl font-semibold">Optimizări active & arbitraj financiar</h2></div>
      <OptimizationSettings value={state.settings} onSave={(settings) => update({ ...state, settings })} />
    </header>
    <div className="grid gap-5 border-l-4 border-success-foreground bg-success-soft p-5 sm:grid-cols-2">
      <div><div className="text-xs font-medium text-muted-foreground">Economii potențiale · de confirmat</div><div className="mt-1 font-display text-3xl font-semibold tabular-nums text-success-foreground">{formatRON(estimates)}</div><div className="mt-2 text-xs text-muted-foreground">{active.length} oportunități de verificat · {alerts.length} alerte de card</div></div>
      <div className="space-y-2 sm:self-center"><div className="flex flex-wrap justify-between gap-2 text-xs"><span>Economii confirmate de tine în {year}</span><strong className="tabular-nums text-success-foreground">{formatRON(realized)}</strong></div><Progress value={realized + estimates > 0 ? Math.min(100, realized / (realized + estimates) * 100) : 0} /><p className="text-xs text-muted-foreground">Deschiderea unui link sau descărcarea unei cereri nu înseamnă bani economisiți.</p></div>
    </div>
    <div className="grid items-stretch gap-3 md:grid-cols-2">
      {active.map((t) => <article key={t.id} className={cn("flex min-w-0 flex-col gap-4 rounded-lg border bg-card p-5 transition-opacity motion-reduce:transition-none", t.urgencyLevel === "medium" && "border-warning/40")}>
        <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-medium text-muted-foreground">{CATEGORY[t.category]}</span><span className={cn("text-xs", t.urgencyLevel === "medium" ? "text-warning-foreground" : "text-muted-foreground")}>{t.urgencyLabel}</span></div>
        <h3 className="text-base font-semibold">{t.title}</h3><p className="text-sm text-muted-foreground">{t.contextExplanation}</p>
        <div className="mt-auto"><div className="mb-3 font-display text-2xl font-semibold text-success-foreground">{t.impactAmountRon > 0 ? `Până la ${formatRON(t.impactAmountRon)}` : t.impactKind === "donation" ? "Nu este economie personală" : "Impact de calculat"}</div>
          {activated.some((a) => a.id === t.id) ? <div className="mb-2 flex items-center justify-center gap-1 rounded-md bg-success-soft py-2 text-sm font-medium text-success-foreground"><Check className="size-4" />Activat</div> : <Button variant="savings" disabled={t.impactAmountRon <= 0} onClick={() => { activate(t.id, t.impactAmountRon); toast.success("Optimizare activată · randamentul a crescut."); }} className="mb-2 w-full"><Sparkles />Activează</Button>}
          <Button variant="outline" onClick={() => run(t)} className="h-auto min-h-9 w-full whitespace-normal py-2 text-left">{t.primaryAction.actionType === "generate_pdf" ? <Download /> : t.primaryAction.actionType === "one_click_toggle" ? <Eye /> : <ArrowUpRight />}{t.primaryAction.actionType === "generate_pdf" ? "Descarcă cerere (.txt)" : t.primaryAction.label}</Button>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-1"><Button size="sm" variant="ghost" onClick={() => { setConfirm(t); setAmount(""); }}><Check />Confirmă rezultatul</Button><Button size="icon-sm" variant="ghost" title="Ignoră" aria-label={`Ignoră: ${t.title}`} onClick={() => dismiss(t)}><X /></Button><Button asChild variant="link" size="sm" className="h-auto p-0"><a href={t.sourceUrl} target="_blank" rel="noopener noreferrer">Sursă oficială</a></Button></div>
        </div>
      </article>)}
    </div>
    {active.length === 0 && <p className="py-2 text-sm text-muted-foreground">Toate oportunitățile disponibile au fost analizate.</p>}
    {state.records.some((r) => r.year === year) && <Button size="sm" variant="ghost" className="h-auto max-w-full whitespace-normal py-2 text-left" onClick={() => update({ ...state, records: state.records.filter((r) => r.year !== year) })}><RotateCcw />Reafișează oportunitățile și resetează confirmările din {year}</Button>}
    <details className="border-t pt-4"><summary className="cursor-pointer text-sm font-medium">Calendar fiscal · {closed.length} termene încheiate</summary><div className="mt-3 grid gap-3 md:grid-cols-2">{closed.map((t) => <article key={t.id} className="rounded-lg border bg-muted/30 p-4"><div className="text-xs text-muted-foreground">{t.urgencyLabel}</div><h3 className="mt-1 text-sm font-semibold">{t.title}</h3><p className="mt-2 text-xs text-muted-foreground">{t.contextExplanation}</p><Button variant="link" size="sm" className="mt-2 h-auto p-0" onClick={() => run(t)}>Informații oficiale <ArrowUpRight /></Button></article>)}</div><p className="mt-3 text-xs text-muted-foreground">Nu prelungim automat campaniile pentru 2027. Procentul local și următorul termen trebuie reconfirmate.</p></details>
    <Dialog open={!!confirm} onOpenChange={(v) => { if (!v) setConfirm(null); }}><DialogContent className="w-[calc(100%-2rem)]"><DialogHeader><DialogTitle>Confirmă rezultatul, nu estimarea</DialogTitle><DialogDescription>{confirm?.title}. Introdu suma netă efectiv economisită, după costuri și dobânzi. Confirmarea este declarația ta, nu verificarea băncii.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={(e) => {
      e.preventDefault(); const n = Number(amount);
      if (!confirm || amount.trim() === "" || !Number.isFinite(n) || n < 0 || n > 1000000) { toast.error("Introdu o sumă validă între 0 și 1.000.000 RON."); return; }
      update({ ...state, records: recordOptimization(state.records, { id: confirm.id, year, status: "completed", realizedRon: confirm.impactKind === "donation" ? 0 : n }) });
      setConfirm(null); toast.success(`${formatRON(n)} economii confirmate de tine.`);
    }}><label className="block space-y-2 text-sm">Economia netă realizată (RON)<Input autoFocus type="number" min={0} max={1000000} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" /></label><Button type="submit" className="w-full"><Check />Confirmă suma realizată</Button></form></DialogContent></Dialog>
    <Dialog open={review} onOpenChange={setReview}><DialogContent className="w-[calc(100%-2rem)]"><DialogHeader><DialogTitle>Costuri de verificat</DialogTitle><DialogDescription>Detectare după descriere. Nu presupunem un spread de 1,9% sau o economie de 576 RON/an.</DialogDescription></DialogHeader><ul className="max-h-72 overflow-y-auto divide-y">{relevant.map((t, i) => <li key={`${t.data}-${i}`} className="flex justify-between gap-3 py-3 text-sm"><div className="min-w-0"><span className="text-xs text-muted-foreground">{t.data}</span><p className="break-words">{t.descriere}</p></div><strong className="shrink-0 tabular-nums">{formatRON(-t.suma)}</strong></li>)}</ul></DialogContent></Dialog>
    <div className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0" /><span>Nicio plată automată. Nu stocăm numere de card și nu copiem date bancare în clipboard.</span></div>
  </section>;
}