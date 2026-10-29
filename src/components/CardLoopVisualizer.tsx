import { ArrowDown, ArrowRight, CreditCard, Landmark, ShieldCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CARD_SOURCES, type ChurningAlert } from "@/lib/card-loops";
import type { OptimizationSettings } from "@/lib/optimization-state";

export function CardLoopVisualizer({ settings, alerts }: { settings: OptimizationSettings; alerts: ChurningAlert[] }) {
  return <section className="space-y-4 border-t pt-6" aria-label="Sinergii de carduri">
    <header className="flex flex-wrap items-start justify-between gap-2">
      <div><h3 className="font-display text-lg font-semibold">Traseul banilor & recompense</h3><p className="mt-1 text-xs text-muted-foreground">Referințe neconfirmate · termenii actuali trebuie verificați</p></div>
      <span className="flex items-center gap-1 text-xs text-success-foreground"><ShieldCheck className="size-4" />Beneficii neconfirmate</span>
    </header>
    <div className="grid items-start gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
      <Node icon={Landmark} title="01 / Încasări" name="BCR George Platinum" owned={settings.cards.includes("bcr")} source={CARD_SOURCES.bcr}>
        <p>Pragul de încasări, comisionul și accesul lounge nu sunt confirmate în catalog.</p><p className="text-xs">Verifică varianta exactă a produsului și contractul curent în George.</p>
      </Node>
      <FlowArrow />
      <Node icon={CreditCard} title="02 / Cumpărături" name="BT Direct de la Carrefour" owned={settings.cards.includes("direct")} source={CARD_SOURCES.direct}>
        <p><strong className="text-muted-foreground">Cashback neconfirmat</strong></p><p>Procentele, limitele, costurile și perioada trebuie susținute de termeni oficiali specifici.</p><p className="text-xs">Nu deducem cashback încasat din descrierile extrasului; comisioanele și dobânzile reduc avantajul.</p>
      </Node>
      <FlowArrow />
      <Node icon={ShieldCheck} title="03 / Rambursare" name="Pago / BT Flying Blue" owned={settings.cards.includes("flying")} source={CARD_SOURCES.pago}>
        <p>Disponibilitatea plății BT Direct prin Pago trebuie confirmată.</p><p className="text-warning-foreground">Milele pentru rambursarea datoriei nu sunt confirmate. Nu tratăm acest pas ca arbitraj profitabil.</p><p className="text-xs">Ratele de mile și eligibilitatea Flying Blue nu sunt confirmate.</p>
        <Button asChild variant="link" size="sm" className="h-auto justify-start p-0"><a href={CARD_SOURCES.flying} target="_blank" rel="noopener noreferrer">Condiții Flying Blue <ExternalLink /></a></Button>
      </Node>
    </div>
    {alerts.length > 0 && <div className="space-y-2">{alerts.map((a) => <article key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning-soft p-4">
      <div className="min-w-0 flex-1 basis-64"><div className="text-sm font-semibold">{a.title}</div><p className="mt-1 text-xs text-muted-foreground">{a.description}</p><p className="mt-1 text-xs text-warning-foreground">{a.daysRemaining === null ? "Scadență necunoscută" : a.daysRemaining < 0 ? `Întârziere: ${-a.daysRemaining} zile` : `${a.daysRemaining} zile rămase`} · valori declarate de tine</p></div>
      <Button asChild size="sm" className="h-auto whitespace-normal text-left"><a href={a.actionPayload.targetUrl} target="_blank" rel="noopener noreferrer">{a.actionButtonLabel}<ExternalLink /></a></Button>
    </article>)}</div>}
    <p className="text-xs text-muted-foreground">Plătește integral soldul la scadența din extras. Nu roti fonduri și nu lua credit doar pentru recompense.</p>
  </section>;
}
function FlowArrow() { return <div className="flex justify-center py-2 text-muted-foreground lg:pt-16" aria-hidden><ArrowRight className="hidden size-5 lg:block" /><ArrowDown className="size-5 lg:hidden" /></div>; }
function Node({ icon: Icon, title, name, owned, source, children }: { icon: typeof Landmark; title: string; name: string; owned: boolean; source: string; children: React.ReactNode }) {
  return <article className="min-w-0 rounded-lg border bg-card p-4">
    <div className="mb-3 flex items-center justify-between gap-2"><Icon className="size-5 text-primary" /><span className="text-[11px] text-muted-foreground">{owned ? "Deținut · declarat" : "Deținere neconfirmată"}</span></div>
    <div className="text-xs font-medium text-muted-foreground">{title}</div><h4 className="mt-1 text-sm font-semibold">{name}</h4>
    <div className="mt-3 space-y-3 text-sm text-muted-foreground">{children}</div>
    <details className="mt-4 text-xs"><summary className="cursor-pointer font-medium text-primary">Condiții & sursă</summary><p className="mt-2 text-muted-foreground">Contractul tău, varianta exactă a cardului și termenii curenți decid eligibilitatea. Soldurile demo nu dovedesc beneficiile.</p><Button asChild variant="link" size="sm" className="mt-2 h-auto p-0"><a href={source} target="_blank" rel="noopener noreferrer">Referință · nu dovadă <ExternalLink /></a></Button></details>
  </article>;
}