import { useMemo, useState } from "react";
import { MapPin, Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useStore } from "@/store/useStore";
import { availableOffers, type LocationOffer } from "@/lib/offer-notifications";
import { sendOfferNotification } from "@/lib/simulate-store";

/**
 * Panou DEMO/DEV (vizibil, dar etichetat) din Seiful meu:
 * - Stânga: alege „locația” dintr-o listă cu toate ofertele disponibile (% + card).
 * - Dreapta: trimite notificarea concretă pentru locația aleasă.
 * Logica de potrivire este reală; declanșarea e manuală (nu din GPS încă).
 */
export function DemoStoreNotifier() {
  const cards = useStore((s) => s.userCards);
  const offers = useMemo(() => availableOffers(cards), [cards]);
  const [picked, setPicked] = useState<LocationOffer | null>(null);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!picked) return;
    setSent(true);
    await sendOfferNotification(picked);
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <section className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">Demo</span>
        <span className="text-sm font-medium">Simulează notificarea în magazin</span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Doar pentru demo: alege o locație din ofertele cardurilor tale, apoi trimite notificarea „ești în magazin”. Logica de potrivire e reală; locația e aleasă manual în loc de GPS.
      </p>
      <div className="flex flex-wrap gap-3">
        {/* Stânga: alege locația */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex-1 justify-start gap-2">
              <MapPin className="size-4" />
              {picked ? <span className="truncate">{picked.merchant} · {picked.cardBank} {picked.percent}%</span> : "Alege locația"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-80 w-80 overflow-y-auto">
            <DropdownMenuLabel>Oferte disponibile ({offers.length})</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {offers.length === 0 && <div className="px-2 py-3 text-xs text-muted-foreground">Niciun card cu oferte. Adaugă un card în Cardurile mele.</div>}
            {offers.map((o, i) => (
              <DropdownMenuItem key={`${o.cardId}-${o.merchant}-${i}`} onSelect={() => { setPicked(o); setSent(false); }} className="flex items-center gap-3 py-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-xs font-semibold text-primary">{o.percent}%</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{o.merchant}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{o.cardBank} {o.cardName} · {o.status === "demo" ? "DEMO" : "neconfirmat"}</span>
                </span>
                {picked?.cardId === o.cardId && picked?.merchant === o.merchant && <Check className="size-4 shrink-0 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dreapta: trimite notificarea */}
        <Button variant="savings" className="flex-1 gap-2" disabled={!picked} onClick={send}>
          {sent ? <><Check className="size-4" /> Trimisă</> : <><Bell className="size-4" /> Trimite notificarea</>}
        </Button>
      </div>
    </section>
  );
}
