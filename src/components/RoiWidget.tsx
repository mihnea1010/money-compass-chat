import { useEffect, useRef, useState } from "react";
import { TrendingUp } from "lucide-react";
import { fiveYearValue, hydrateStore, ROI_YEARS, useStore } from "@/store/useStore";

function useAnimatedNumber(target: number, ms = 700) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now(), a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms), eased = 1 - (1 - p) ** 3;
      const v = a + (target - a) * eased;
      setValue(v); from.current = v;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

/** Randament Anualizat — valoarea pe 5 ani a optimizărilor activate. */
export function RoiWidget() {
  useEffect(hydrateStore, []);
  const active = useStore((s) => s.activeOptimizations);
  const total = fiveYearValue(active);
  const shown = useAnimatedNumber(total);
  const [pulse, setPulse] = useState(false);
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } setPulse(true); const t = setTimeout(() => setPulse(false), 600); return () => clearTimeout(t); }, [total]);
  return <section aria-label="Randament Anualizat" className="relative overflow-hidden rounded-2xl border bg-success-soft p-6 md:p-8">
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-success-foreground"><TrendingUp className="size-4" />Randament Anualizat (Financial ROI)</div>
    <div aria-live="polite" className={`mt-3 font-display text-5xl font-semibold tabular-nums text-success-foreground transition-transform duration-500 md:text-6xl ${pulse ? "scale-105" : "scale-100"}`}>
      +{Math.round(shown).toLocaleString("ro-RO")} RON
    </div>
    <p className="mt-3 max-w-xl text-sm text-muted-foreground">Valoarea totală a optimizărilor tale active pe următorii {ROI_YEARS} ani (Cashback, Deduceri, Dobânzi tăiate).</p>
    <p className="mt-1 text-xs text-muted-foreground">{active.length} optimizări active · estimare, nu câștig garantat</p>
  </section>;
}
