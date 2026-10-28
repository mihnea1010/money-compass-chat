import { useRef, useState } from "react";
import { ArrowLeftRight, Check, ChevronRight, ExternalLink, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRON } from "@/lib/utils";
import type { Swap } from "@/lib/open-source-swaps";

const THRESHOLD = 110;

export function SwipeSwaps({ swaps, example }: { swaps: Swap[]; example: boolean }) {
  const [index, setIndex] = useState(0);
  const [accepted, setAccepted] = useState<string[]>([]);
  const [dx, setDx] = useState(0);
  const drag = useRef<{ startX: number; active: boolean }>({ startX: 0, active: false });
  const current = swaps[index];

  const swipe = (dir: "right" | "left") => {
    if (!current) return;
    setDx(0);
    if (dir === "right") {
      // Rămânem pe card și dezvăluim detaliile de migrare; utilizatorul avansează din panoul de detalii.
      setAccepted((a) => (a.includes(current.id) ? a : [...a, current.id]));
    } else {
      setIndex((i) => i + 1);
    }
  };
  const next = () => { setDx(0); setIndex((i) => i + 1); };

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { startX: e.clientX, active: true };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.current.active) setDx(e.clientX - drag.current.startX);
  };
  const onPointerUp = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (dx > THRESHOLD) swipe("right");
    else if (dx < -THRESHOLD) swipe("left");
    else setDx(0);
  };

  if (!current) {
    const total = swaps.filter((s) => accepted.includes(s.id)).reduce((s, x) => s + x.annualSaved, 0);
    return (
      <div className="rounded-2xl border bg-card p-8 text-center shadow-soft">
        <Check className="mx-auto mb-4 size-10 text-success-foreground" />
        <h3 className="font-display text-xl font-semibold">Ai parcurs toate schimbările.</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {accepted.length > 0
            ? `Ai marcat ${accepted.length} ${accepted.length === 1 ? "schimbare" : "schimbări"} spre open-source — ${formatRON(total)} lei/an economisibili${example ? " (exemplu ilustrativ)" : ""}.`
            : "Nicio schimbare marcată. Poți relua lista oricând."}
        </p>
        <Button variant="outline" size="sm" className="mt-5" onClick={() => { setIndex(0); setAccepted([]); }}>
          Reia lista
        </Button>
      </div>
    );
  }

  const rotate = dx / 18;
  const showDetails = accepted.includes(current.id);

  return (
    <div className="space-y-4">
      <div
        role="group"
        aria-label={`Schimbare ${index + 1} din ${swaps.length}: ${current.paidName} spre ${current.alt.name}`}
        className="touch-pan-y select-none rounded-2xl border bg-card shadow-soft transition-transform"
        style={{ transform: `translateX(${dx}px) rotate(${rotate}deg)`, cursor: drag.current.active ? "grabbing" : "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="flex items-center justify-between border-b px-5 py-3 text-xs text-muted-foreground">
          <span>{index + 1} / {swaps.length}{example && " · exemplu ilustrativ"}</span>
          <span className="flex items-center gap-1"><ArrowLeftRight className="size-3.5" />Trage stânga/dreapta</span>
        </div>
        <div className="grid gap-0 md:grid-cols-[1fr_auto_1fr]">
          <div className="p-5">
            <div className="text-xs font-medium text-muted-foreground">PLĂTEȘTI ACUM</div>
            <div className="mt-2 font-display text-lg font-semibold">{current.paidName}</div>
            <div className="mt-1 text-sm text-destructive">{formatRON(current.costLunar)} lei / lună</div>
          </div>
          <div className="hidden items-center md:flex"><ChevronRight className="size-6 text-muted-foreground" /></div>
          <div className="border-t p-5 md:border-l md:border-t-0">
            <div className="text-xs font-medium text-success-foreground">ALTERNATIVA OPEN-SOURCE</div>
            <div className="mt-2 font-display text-lg font-semibold">{current.alt.name}</div>
            <div className="mt-1 text-sm text-muted-foreground">{current.alt.tagline}</div>
          </div>
        </div>
        <div className="border-t px-5 py-4">
          <div className="font-display text-3xl font-semibold tabular-nums text-success-foreground">
            +{formatRON(current.annualSaved)} <span className="text-base font-normal">lei / an</span>
          </div>
          <ul className="mt-3 space-y-1.5">
            {current.alt.benefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success-foreground" />{b}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => swipe("left")} aria-label={`Sari peste ${current.paidName}`}>
          <X />Sari peste
        </Button>
        <Button variant="savings" className="flex-1" onClick={() => swipe("right")} aria-label={`Vezi alternativa pentru ${current.paidName}`}>
          <Check />Vreau alternativa
        </Button>
      </div>

      {showDetails && (
        <div className="rounded-2xl border border-savings/40 bg-savings/10 p-5 motion-safe:animate-in motion-safe:fade-in">
          <h4 className="font-display font-semibold">Cum migrezi la {current.alt.name}</h4>
          <ol className="mt-3 space-y-2.5">
            {current.alt.migration.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-primary">{i + 1}</span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="savings" size="sm" asChild>
              <a href={current.alt.url} target="_blank" rel="noopener noreferrer">
                Site-ul oficial {current.alt.name} <ExternalLink />
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={next}>
              Următoarea schimbare <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
