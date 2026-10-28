import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { bestCardForStore, loadCards, saveCards, type MyCard } from "@/lib/my-cards";
import { useStorePresence } from "@/hooks/use-store-presence";

const WALLET: Record<string, string> = { ing: "wallet-ing", "ing-alt": "wallet-ing-alt", bcr: "wallet-bcr", "bcr-alt": "wallet-bcr-alt", bt: "wallet-bt", "bt-alt": "wallet-bt-alt", raiffeisen: "wallet-raiffeisen" };
const LOC_KEY = "bestsaves.locationOn";
const POP_W = 224;

/** Panoul de deasupra cardului se desenează deasupra întregii pagini (portal),
 *  deci nu mai rezervăm spațiu gol în carousel. */
function useCardPopup() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [box, setBox] = useState<{ top: number; left: number; below: boolean } | null>(null);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const placeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const el = activeId ? refs.current[activeId] : null;
    if (!el) { setBox(null); placeRef.current = null; return; }
    const place = () => {
      const r = el.getBoundingClientRect();
      const below = r.top < 200;
      const left = Math.min(Math.max(8, r.left), Math.max(8, window.innerWidth - POP_W - 8));
      setBox({ top: below ? r.bottom + 10 : r.top - 10, left, below });
    };
    placeRef.current = place;
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      placeRef.current = null;
    };
  }, [activeId]);

  return { activeId, setActiveId, box, refs, reposition: () => placeRef.current?.() };
}

export function MyCards() {
  const [cards, setCards] = useState<MyCard[]>([]);
  const [locOn, setLocOn] = useState(false);
  const popup = useCardPopup();
  useEffect(() => { setCards(loadCards()); setLocOn(localStorage.getItem(LOC_KEY) === "1"); }, []);
  const { store, error } = useStorePresence(cards, locOn);
  const best = store ? bestCardForStore(cards, store.name) : null;
  const update = (next: MyCard[]) => { setCards(next); saveCards(next); };
  const active = popup.activeId ? cards.find((c) => c.id === popup.activeId) : undefined;

  return (
    <section className="space-y-3 border-y py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-medium">Cardurile mele</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {store ? <span className="inline-flex items-center gap-1 font-medium text-primary"><MapPin className="size-3" /> Ești la {store.name}{best ? ` — folosește ${best.card.bank} (${best.perk.percent}%)` : ""}</span>
              : "Pune mouse-ul sau degetul pe un card ca să vezi ce economisești cu el."}
          </p>
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch checked={locOn} onCheckedChange={(v) => { setLocOn(v); localStorage.setItem(LOC_KEY, v ? "1" : "0"); }} /> Recunoaște magazinul
          </label>
          <AddCard onAdd={(c) => update([...cards, c])} />
        </div>
      </div>
      {cards.length === 0 ? <p className="text-sm text-muted-foreground">Adaugă primul tău card.</p> : (
        <Carousel opts={{ align: "start", dragFree: true }} className="px-10" setApi={(api) => api?.on("scroll", popup.reposition)}>
          <CarouselContent className="py-2">
            {cards.map((c) => {
              const hi = best?.card.id === c.id;
              return (
                <CarouselItem key={c.id} className="basis-auto">
                  <div tabIndex={0}
                    ref={(el) => { popup.refs.current[c.id] = el; }}
                    onMouseEnter={() => popup.setActiveId(c.id)}
                    onMouseLeave={() => popup.setActiveId((id) => (id === c.id ? null : id))}
                    onFocus={() => popup.setActiveId(c.id)}
                    onBlur={() => popup.setActiveId((id) => (id === c.id ? null : id))}
                    className={`${WALLET[c.style ?? ""] ?? "wallet-default"} group relative flex h-36 w-60 flex-col justify-between rounded-2xl p-4 text-wallet-foreground shadow-soft outline-none transition-transform hover:-translate-y-1 focus:ring-2 focus:ring-primary/40 ${hi ? "scale-[1.04] ring-4 ring-primary" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate text-base font-semibold">{c.bank}</div>
                      {hi ? <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">Cel mai bun aici</span>
                        : <button type="button" aria-label={`Șterge ${c.bank} ${c.name}`} onClick={() => update(cards.filter((x) => x.id !== c.id))} className="opacity-0 transition-opacity group-hover:opacity-80 hover:opacity-100"><Trash2 className="size-3.5" /></button>}
                    </div>
                    <div className="h-6 w-9 rounded-md bg-wallet-foreground/30" />
                    <div className="flex items-end justify-between text-xs">
                      <span className="opacity-90">{c.name}</span>
                      <span className="font-mono tracking-wider opacity-90">•••• {c.last4 ?? "0000"}</span>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="left-0" />
          <CarouselNext className="right-0" />
        </Carousel>
      )}
      {active && popup.box && typeof document !== "undefined" && createPortal(
        <div role="tooltip"
          className={`pointer-events-none fixed z-[70] w-56 rounded-xl border bg-popover p-3 text-popover-foreground shadow-xl ${popup.box.below ? "" : "-translate-y-full"}`}
          style={{ top: popup.box.top, left: popup.box.left }}>
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-primary">Top 3 oportunități de salvare</div>
          {active.perks.length === 0 ? <p className="text-xs text-muted-foreground">Nicio ofertă adăugată</p> : (
            <ol className="space-y-1.5">
              {[...active.perks].sort((a, b) => b.percent - a.percent).slice(0, 3).map((p, i) => (
                <li key={p.merchant} className="flex items-center gap-2 text-xs">
                  <span className="grid size-5 place-items-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">{i + 1}</span>
                  <span className="flex-1 truncate">{p.merchant}</span>
                  <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">{p.percent}%</span>
                </li>
              ))}
            </ol>
          )}
          {active.perks.length > 3 && <p className="mt-2 text-[10px] text-muted-foreground">și încă {active.perks.length - 3}</p>}
        </div>,
        document.body,
      )}
    </section>
  );
}

function AddCard({ onAdd }: { onAdd: (c: MyCard) => void }) {
  const [open, setOpen] = useState(false);
  const [bank, setBank] = useState(""); const [name, setName] = useState("");
  const [merchants, setMerchants] = useState(""); const [percent, setPercent] = useState("5");
  const submit = () => {
    const pct = Number(percent) || 0;
    onAdd({ id: crypto.randomUUID(), bank: bank.trim(), name: name.trim() || "Card", perks: merchants.split(",").map((m) => m.trim()).filter(Boolean).map((merchant) => ({ merchant, percent: pct })) });
    setOpen(false); setBank(""); setName(""); setMerchants("");
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Plus /> Adaugă card</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Adaugă un card</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Banca (ex. ING)" value={bank} onChange={(e) => setBank(e.target.value)} />
          <Input placeholder="Numele cardului" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Magazine cu cashback, separate prin virgulă" value={merchants} onChange={(e) => setMerchants(e.target.value)} />
          <Input type="number" placeholder="Cashback %" value={percent} onChange={(e) => setPercent(e.target.value)} />
          <Button className="w-full" disabled={!bank.trim()} onClick={submit}>Salvează</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
