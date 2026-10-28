import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { bestCardForStore, loadCards, perkSummary, saveCards, type MyCard } from "@/lib/my-cards";
import { useStorePresence } from "@/hooks/use-store-presence";

const LOC_KEY = "bestsaves.locationOn";

export function MyCards() {
  const [cards, setCards] = useState<MyCard[]>([]);
  const [locOn, setLocOn] = useState(false);
  useEffect(() => { setCards(loadCards()); setLocOn(localStorage.getItem(LOC_KEY) === "1"); }, []);
  const { store, error } = useStorePresence(cards, locOn);
  const best = store ? bestCardForStore(cards, store.name) : null;
  const update = (next: MyCard[]) => { setCards(next); saveCards(next); };

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
        <Carousel opts={{ align: "start", dragFree: true }} className="px-10">
          <CarouselContent className="pb-2 pt-12">
            {cards.map((c) => {
              const hi = best?.card.id === c.id;
              return (
                <CarouselItem key={c.id} className="basis-auto">
                  <div tabIndex={0} style={{ background: `var(--wallet-${c.style ?? "default"}, var(--wallet-default))` }}
                    className={`group relative flex h-36 w-60 flex-col justify-between rounded-2xl p-4 text-wallet-foreground shadow-soft outline-none transition-transform hover:-translate-y-1 focus:ring-2 focus:ring-primary/40 ${hi ? "scale-[1.04] ring-4 ring-primary" : ""}`}>
                    <div className="pointer-events-none absolute -top-10 left-0 z-10 w-max max-w-64 rounded-lg bg-popover px-2.5 py-1.5 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus:opacity-100">{perkSummary(c)}</div>
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
