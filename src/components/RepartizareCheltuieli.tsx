import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatRON } from "@/lib/utils";
import { ETICHETE, type Categorie, type Tranzactie } from "@/lib/statement";
import { subcategorie, subStatistici } from "@/lib/subcategories";

type Felie = { name: string; value: number; color: string; categorie?: Categorie };

export function RepartizareCheltuieli({ tranz, cheltuieli, nrLuni, culori, onFocus }: {
  tranz: Tranzactie[]; cheltuieli: Felie[]; nrLuni: number; culori: string[]; onFocus: (f: boolean) => void;
}) {
  const [cat, setCat] = useState<Categorie | null>(null);
  const [sub, setSub] = useState<string | null>(null);
  const go = (c: Categorie | null, s: string | null = null) => { setCat(c); setSub(s); onFocus(c !== null); };

  const catColor = cheltuieli.find((c) => c.categorie === cat)?.color ?? culori[0]!;
  const date: Felie[] = cat
    ? subStatistici(tranz, cat, nrLuni).map((s, i) => ({ ...s, color: i === 0 ? catColor : culori[(i + 1) % culori.length]! }))
    : cheltuieli;
  const total = date.reduce((s, c) => s + c.value, 0) || 1;
  const luna = tranz.map((x) => x.data.slice(0, 7)).sort().at(-1) ?? "";
  const lista = cat && sub
    ? tranz.filter((x) => x.categorie === cat && x.suma < 0 && x.data.startsWith(luna) && subcategorie(x) === sub).sort((a, b) => b.data.localeCompare(a.data))
    : [];
  const click = (f: Felie) => (cat ? go(cat, f.name) : f.categorie && go(f.categorie));

  return (
    <div>
      <div className="mb-4 flex items-center gap-1 text-sm">
        {cat ? (
          <>
            <button onClick={() => (sub ? go(cat) : go(null))} className="mr-1 grid size-7 place-items-center rounded-md hover:bg-muted" aria-label="Înapoi"><ChevronLeft className="size-4" /></button>
            <button onClick={() => go(null)} className="text-muted-foreground hover:text-foreground">Toate</button>
            <ChevronRight className="size-3.5 text-muted-foreground" />
            <button onClick={() => go(cat)} className={sub ? "text-muted-foreground hover:text-foreground" : "font-medium"}>{ETICHETE[cat]}</button>
            {sub && <><ChevronRight className="size-3.5 text-muted-foreground" /><span className="font-medium">{sub}</span></>}
          </>
        ) : <h2 className="font-medium">Repartizare cheltuieli</h2>}
      </div>

      {sub ? (
        <div>
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>{lista.length} plăți în luna {luna}</span>
            <span className="tabular-nums">Total {formatRON(Math.round(-lista.reduce((s, x) => s + x.suma, 0)))}</span>
          </div>
          <ul className="max-h-80 divide-y overflow-y-auto rounded-xl border">
            {lista.map((x, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate">{x.descriere}</div>
                  <div className="text-xs text-muted-foreground">{x.data}</div>
                </div>
                <span className="shrink-0 tabular-nums">{formatRON(-x.suma)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className={cat ? "grid items-center gap-6 md:grid-cols-2" : ""}>
          <div className="h-52">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={date} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={2} stroke="none"
                  onClick={(_, i) => date[i] && click(date[i])} className="cursor-pointer" isAnimationActive>
                  {date.map((c) => <Cell key={c.name} fill={c.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatRON(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-4 space-y-1 text-sm">
            {date.map((c) => (
              <li key={c.name}>
                <button onClick={() => click(c)} className="flex w-full items-center justify-between rounded-md px-2 py-1 hover:bg-muted">
                  <span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: c.color }} />{c.name}</span>
                  <span className="tabular-nums text-muted-foreground">{cat && formatRON(c.value) + " · "}{Math.round((c.value / total) * 100)}%</span>
                </button>
              </li>
            ))}
          </ul>
          {cat && <p className="text-xs text-muted-foreground md:col-span-2">Medie lunară. Apasă o subcategorie ca să vezi plățile.</p>}
        </div>
      )}
    </div>
  );
}
