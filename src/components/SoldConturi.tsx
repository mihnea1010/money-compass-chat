import { useState } from "react";
import { ChevronLeft, Landmark, PiggyBank, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatRON } from "@/lib/utils";
import type { Tranzactie } from "@/lib/statement";
import { CONTURI_DEMO, fluxLuna, lunaCurenta, totalTip, type Cont } from "@/lib/accounts";

type Vedere = null | "curent" | "economii";

export function SoldConturi({ tranz, deschis, onToggle }: { tranz: Tranzactie[]; deschis: boolean; onToggle: (v: boolean) => void }) {
  const [vedere, setVedere] = useState<Vedere>(null);
  const curent = totalTip(CONTURI_DEMO, "curent");
  const economii = totalTip(CONTURI_DEMO, "economii");
  const luna = lunaCurenta(tranz);
  const { intrat, cheltuit } = fluxLuna(tranz, luna);

  if (!deschis) return (
    <button onClick={() => onToggle(true)} className="rounded-2xl border bg-card p-5 text-left shadow-soft transition-all hover:ring-2 hover:ring-primary/20">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Bani curenți în conturi</div>
      <div className="mt-2 font-display text-2xl font-semibold tabular-nums">{formatRON(Math.round(curent))}</div>
      <div className="mt-1 text-xs text-muted-foreground">{new Set(CONTURI_DEMO.map((c) => c.banca)).size} bănci · apasă pentru detalii</div>
    </button>
  );

  const banci = (tip: Cont["tip"]) => CONTURI_DEMO.filter((c) => c.tip === tip);

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-soft ring-2 ring-primary/30 md:col-span-3">
      <div className="mb-4 flex items-center gap-2 text-sm">
        <button onClick={() => (vedere ? setVedere(null) : onToggle(false))} className="grid size-7 place-items-center rounded-md hover:bg-muted" aria-label="Înapoi"><ChevronLeft className="size-4" /></button>
        <h2 className="font-medium">{vedere === "curent" ? "Bani curenți pe bănci" : vedere === "economii" ? "Economii pe bănci" : "Banii tăi"}</h2>
        <span className="ml-auto text-xs text-muted-foreground">Solduri demo · conectarea băncilor urmează</span>
      </div>

      {vedere ? (
        <ul className="divide-y rounded-xl border">
          {banci(vedere).map((c) => (
            <li key={c.banca} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="flex items-center gap-2"><Landmark className="size-4 text-muted-foreground" />{c.banca}</span>
              <span className="font-medium tabular-nums">{formatRON(c.sold)}</span>
            </li>
          ))}
          <li className="flex justify-between px-4 py-3 text-sm font-semibold"><span>Total</span><span className="tabular-nums">{formatRON(vedere === "curent" ? curent : economii)}</span></li>
        </ul>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          <Bloc icon={Landmark} label="Bani curenți" value={curent} onClick={() => setVedere("curent")} />
          <Bloc icon={PiggyBank} label="Conturi de economii" value={economii} onClick={() => setVedere("economii")} />
          <div className="rounded-xl border p-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Luna {luna}</div>
            <div className="grid grid-cols-2 gap-3">
              <div><div className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowUpRight className="size-3.5 text-destructive" />Cheltuit</div><div className="font-display text-lg font-semibold tabular-nums">{formatRON(Math.round(cheltuit))}</div></div>
              <div className="text-right"><div className="flex items-center justify-end gap-1 text-xs text-muted-foreground"><ArrowDownLeft className="size-3.5 text-success-foreground" />Intrat</div><div className="font-display text-lg font-semibold tabular-nums">{formatRON(Math.round(intrat))}</div></div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Bloc({ icon: Icon, label, value, onClick }: { icon: typeof Landmark; label: string; value: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-xl border p-4 text-left hover:bg-muted/50">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground"><Icon className="size-3.5" />{label}</div>
      <div className="mt-1 font-display text-xl font-semibold tabular-nums">{formatRON(Math.round(value))}</div>
      <div className="text-xs text-muted-foreground">Vezi pe bănci →</div>
    </button>
  );
}
