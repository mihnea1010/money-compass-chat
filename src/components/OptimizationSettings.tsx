import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { optimizationSettingsSchema, type OptimizationSettings as Settings } from "@/lib/optimization-state";
import { toast } from "sonner";

export function OptimizationSettings({ value, onSave }: { value: Settings; onSave: (settings: Settings) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const numberField = (key: "localTaxRon" | "localDiscountPercent" | "pensionContributionEur" | "eurRon" | "bcrEligibleVolume" | "creditDueRon", label: string, max: number) => (
    <label className="space-y-1 text-sm" key={key}><span>{label}</span><Input type="number" min={0} max={max} step="any" value={draft[key] || ""} placeholder="Nespecificat" onChange={(e) => setDraft({ ...draft, [key]: Number(e.target.value) })} /></label>
  );
  return <>
    <Button variant="outline" size="sm" onClick={() => { setDraft(value); setOpen(true); }}><Settings2 /> Date & eligibilitate</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto">
        <DialogHeader><DialogTitle>Date pentru optimizări</DialogTitle><DialogDescription>Completează doar valori confirmate. Nu cerem numere de card sau IBAN; datele rămân în browser.</DialogDescription></DialogHeader>
        <form className="space-y-5" onSubmit={(e) => {
          e.preventDefault(); const result = optimizationSettingsSchema.safeParse(draft);
          if (!result.success) { toast.error("Verifică valorile introduse."); return; }
          onSave(result.data); setOpen(false); toast.success("Datele au fost salvate în browser.");
        }}>
          <fieldset className="space-y-3"><legend className="mb-2 font-medium">Beneficii fiscale</legend>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={draft.employee} onCheckedChange={(v) => setDraft({ ...draft, employee: v === true })} /> Sunt salariat, la funcția de bază</label>
            <div className="grid gap-3 sm:grid-cols-2">
              {numberField("localTaxRon", "Impozit local anual (RON)", 1000000)}
              {numberField("localDiscountPercent", "Bonificație aprobată de primărie (%)", 10)}
              {numberField("pensionContributionEur", "Contribuție proprie Pilon III/an (EUR)", 100000)}
              {numberField("eurRon", "Curs folosit de salarizare (RON/EUR)", 100)}
            </div>
            <p className="text-xs text-muted-foreground">Confirmă bonificația la primărie și calculul deducerii cu salarizarea. O contribuție la pensie este o cheltuială, nu un câștig.</p>
          </fieldset>
          <fieldset className="space-y-3"><legend className="mb-2 font-medium">Carduri pe care le dețin</legend>
            {([["bcr", "BCR George Platinum"], ["direct", "BT Direct Cardul Direct"], ["flying", "BT Flying Blue"]] as const).map(([id, name]) => <label key={id} className="flex items-center gap-2 text-sm"><Checkbox checked={draft.cards.includes(id)} onCheckedChange={(v) => setDraft({ ...draft, cards: v === true ? [...new Set([...draft.cards, id])] : draft.cards.filter((x) => x !== id) })} />{name}</label>)}
            {numberField("bcrEligibleVolume", "BCR: încasări eligibile confirmate în luna curentă (RON)", 1000000)}
            {numberField("creditDueRon", "Sold de rambursat integral (RON)", 1000000)}
            <label className="block space-y-1 text-sm">BT Direct: cost total anual confirmat (lei)<Input type="number" min={0} value={draft.directAnnualCostRon ?? ""} placeholder="Include toate comisioanele; 0 doar dacă este confirmat" onChange={(e) => setDraft({ ...draft, directAnnualCostRon: e.target.value === "" ? null : Number(e.target.value) })} /></label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={draft.repayInFull} onCheckedChange={(v) => setDraft({ ...draft, repayInFull: v === true })} /> Voi rambursa integral la scadență; nu primesc deja aceste recompense</label>
            <label className="block space-y-1 text-sm">Scadența din extras<Input type="date" value={draft.creditDueDate} onChange={(e) => setDraft({ ...draft, creditDueDate: e.target.value })} /></label>
            <p className="text-xs text-muted-foreground">Transferurile între conturile tale nu sunt presupuse eligibile. Soldul și scadența sunt introduse manual, nu detectate din conturile demo.</p>
          </fieldset>
          <Button type="submit" className="w-full">Salvează datele</Button>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}