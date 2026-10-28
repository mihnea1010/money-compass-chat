import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Abonamente } from "@/components/Abonamente";
import { SwipeSwaps } from "@/components/SwipeSwaps";
import { detecteazaSwaps, EXAMPLE_SWAPS } from "@/lib/open-source-swaps";
import { loadStatement, type Tranzactie } from "@/lib/statement";
import { loadOprite } from "@/lib/subscriptions";
import { subscriptionAlert } from "@/lib/spending-alert";
import { formatRON } from "@/lib/utils";

export const Route = createFileRoute("/extra")({
  head: () => ({ meta: [
    { title: "Abonamente — BestSaves" },
    { name: "description", content: "Abonamentele și cheltuielile recurente din extrasul tău, cu link direct de anulare." },
    { property: "og:title", content: "Abonamente — BestSaves" },
    { property: "og:description", content: "Vezi ce abonamente plătești și oprește-le pe cele de care nu ai nevoie." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Extra,
});

function Extra() {
  const [tranz, setTranz] = useState<Tranzactie[]>([]);
  const [stopped, setStopped] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTranz(loadStatement() ?? []); setStopped(loadOprite()); setLoaded(true); }, []);
  const alert = subscriptionAlert(tranz, stopped);
  const example = tranz.length === 0;
  const swaps = example ? EXAMPLE_SWAPS : detecteazaSwaps(tranz);
  return <div className="h-full overflow-y-auto"><div className="mx-auto max-w-3xl space-y-6 px-5 py-8 md:px-10">
    <div><h1 className="font-display text-3xl font-semibold">Abonamente</h1><p className="mt-2 text-sm text-muted-foreground">Abonamente și plăți recurente găsite în extrasul tău.</p></div>
    {loaded && <section className="space-y-4"><div><h2 className="font-display text-xl font-semibold">Alternative open-source</h2><p className="mt-1 text-sm text-muted-foreground">{example ? "Exemple ilustrative. Încarcă extrasul pentru alternativele tale." : "Alternative pentru software-ul plătit din extrasul tău."}</p></div>{swaps.length > 0 ? <SwipeSwaps swaps={swaps} example={example} /> : <p className="text-sm text-muted-foreground">Nu am găsit abonamente cu alternative open-source potrivite.</p>}</section>}
    {tranz.length === 0 ? <div className="rounded-lg border p-6"><p className="text-sm">Încarcă extrasul în Seif ca să vedem abonamentele tale.</p><Button className="mt-4" asChild><Link to="/dashboard">Deschide Seiful <ArrowRight /></Link></Button></div> : <>
      {alert.excessive ? <div role="alert" className="flex gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"><AlertTriangle className="size-5 shrink-0" /><div><b>Cheltuieli excesive pe abonamente: {formatRON(Math.round(alert.monthly))} / lună.</b><br />Peste 300 lei sau peste 10% din cheltuielile lunare. Oprește-le pe cele nefolosite.</div></div>
        : <div className="flex gap-3 rounded-lg bg-success-soft p-4 text-sm text-success-foreground"><CheckCircle2 className="size-5 shrink-0" />Abonamentele tale par în limite rezonabile.</div>}
      <Abonamente tranz={tranz} />
    </>}
  </div></div>;
}
