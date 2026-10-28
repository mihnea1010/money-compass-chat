import { useEffect, useState } from "react";
import { ChevronDown, ExternalLink, Repeat } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { formatRON } from "@/lib/utils";
import type { Tranzactie } from "@/lib/statement";
import { detecteazaAbonamente, loadOprite, saveOprite } from "@/lib/subscriptions";

export function Abonamente({ tranz }: { tranz: Tranzactie[] }) {
  const lista = detecteazaAbonamente(tranz);
  const [oprite, setOprite] = useState<string[]>([]);
  useEffect(() => setOprite(loadOprite()), []);
  const toggle = (id: string, on: boolean) => {
    const n = on ? oprite.filter((x) => x !== id) : [...oprite, id];
    setOprite(n); saveOprite(n);
  };
  const [deschis, setDeschis] = useState(true);
  const economie = lista.filter((a) => oprite.includes(a.id)).reduce((s, a) => s + a.costLunar, 0);
  const total = lista.reduce((s, a) => s + a.costLunar, 0) - economie;
  const deAnulat = lista.filter((a) => oprite.includes(a.id));
  if (!lista.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <button onClick={() => setDeschis(!deschis)} className="text-left" aria-expanded={deschis}>
          <h2 className="flex items-center gap-2 font-medium"><Repeat className="size-4" /> Abonamente active <span className="text-xs font-normal text-muted-foreground">({lista.length - oprite.filter((o) => lista.some((a) => a.id === o)).length}/{lista.length})</span> <ChevronDown className={`size-4 transition-transform ${deschis ? "" : "-rotate-90"}`} /></h2>
          <p className="text-sm text-muted-foreground">Oprește ce nu folosești. Butonul te duce direct pe pagina de anulare.</p>
        </button>
        <div className="text-right text-sm">
          <div className="font-display text-lg font-semibold tabular-nums">{formatRON(Math.round(total))}<span className="text-xs font-normal text-muted-foreground"> / lună</span></div>
          {economie > 0 && <div className="text-xs text-success-foreground">Economisești {formatRON(Math.round(economie))} / lună · {formatRON(Math.round(economie * 12))} / an</div>}
        </div>
      </div>
      {deschis && <ul className="space-y-1.5">
        {lista.map((a) => {
          const on = !oprite.includes(a.id);
          return (
            <li key={a.id} className={`flex items-center gap-4 rounded-xl border px-4 py-3 shadow-soft transition-colors ${on ? "bg-card" : "border-destructive/40 bg-destructive/10"}`}>
              <div className={`grid size-9 shrink-0 place-items-center rounded-lg font-display font-semibold ${on ? "bg-primary/10 text-primary" : "bg-destructive/15 text-destructive"}`}>{a.nume[0]}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{a.nume}</div>
                <div className="truncate text-xs text-muted-foreground">{a.firma} | {formatRON(a.costLunar)} / lună · {formatRON(Math.round(a.costLunar * 12))} / an</div>
              </div>
              <span className={`w-24 text-right text-xs ${on ? "text-muted-foreground" : "font-medium text-destructive"}`}>{on ? "Activ" : "De anulat"}</span>
              <Switch checked={on} onCheckedChange={(v) => toggle(a.id, v)} aria-label={`Marchează ${a.nume}`} />
              <a href={a.cancel} target="_blank" rel="noopener noreferrer" title={`Anulează ${a.nume}`}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${on ? "text-destructive hover:bg-destructive/10" : "bg-destructive text-destructive-foreground shadow-sm hover:opacity-90"}`}>
                Anulează <ExternalLink className="size-3.5" />
              </a>
            </li>
          );
        })}
      </ul>}
      {deschis && deAnulat.length > 1 && (
        <div className="flex justify-end">
          <button onClick={() => deAnulat.forEach((a) => window.open(a.cancel, "_blank", "noopener"))}
            className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-soft hover:opacity-90">
            Anulează selectate ({deAnulat.length}) <ExternalLink className="size-4" />
          </button>
        </div>
      )}
    </section>
  );
}
