import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cardInputSchema, cardMetadata, detectNetwork, digitsOnly, formatCardNumber, formatExpiry, formatHolder, type CardInput } from "@/lib/card-input";
import type { MyCard } from "@/lib/my-cards";

export function AddCardDialog({ onAdd }: { onAdd: (card: MyCard) => void }) {
  const [open, setOpen] = useState(false);
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button size="sm" variant="outline"><Plus /> Adaugă card</Button></DialogTrigger>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>Adaugă card nou</DialogTitle><DialogDescription>Numărul complet și CVV-ul nu sunt salvate sau trimise.</DialogDescription></DialogHeader>
      {open && <CardForm onAdd={(card) => { onAdd(card); setOpen(false); }} />}
    </DialogContent>
  </Dialog>;
}

function CardForm({ onAdd }: { onAdd: (card: MyCard) => void }) {
  const [flipped, setFlipped] = useState(false);
  const { register, watch, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<CardInput>({ resolver: zodResolver(cardInputSchema()), mode: "onTouched", defaultValues: { bank: "", number: "", holder: "", expiry: "", cvv: "", merchants: "", percent: 5 } });
  const values = watch();
  const network = detectNetwork(values.number);
  const error = (field: keyof CardInput) => errors[field] ? <p id={`card-${field}-error`} role="alert" className="text-xs text-destructive">{errors[field]?.message}</p> : null;
  const accessibility = (field: keyof CardInput) => ({ id: `card-${field}`, "aria-invalid": Boolean(errors[field]), "aria-describedby": errors[field] ? `card-${field}-error` : undefined });
  return <form className="space-y-4" autoComplete="off" onSubmit={handleSubmit((data) => onAdd(cardMetadata(data, crypto.randomUUID())))}>
    <div className="card-preview-scene mx-auto w-full max-w-sm" aria-label={flipped ? "Spatele cardului — CVV ascuns" : "Previzualizare card"}>
      <div className={`card-preview-turn ${flipped ? "is-flipped" : ""}`}>
        <div className="card-preview-face wallet-bt-alt flex flex-col justify-between p-5 text-wallet-foreground shadow-soft" aria-hidden={flipped}>
          <div className="flex items-center justify-between gap-3"><span className="truncate font-semibold">{values.bank || "Banca ta"}</span><span className="shrink-0 text-sm">{network || "Card"}</span></div>
          <CreditCard className="size-7 opacity-70" />
          <div className="font-mono text-base sm:text-lg">{values.number || "•••• •••• •••• ••••"}</div>
          <div className="flex items-end justify-between gap-4"><span className="min-w-0 break-words text-xs">{values.holder || "TITULAR CARD"}</span><span className="shrink-0 font-mono text-xs">{values.expiry || "MM/YY"}</span></div>
        </div>
        <div className="card-preview-face card-preview-back wallet-bt-alt flex flex-col justify-center gap-4 text-wallet-foreground shadow-soft" aria-hidden={!flipped}>
          <div className="h-10 w-full bg-foreground" />
          <div className="mx-5 flex items-center justify-between rounded bg-muted p-3 text-foreground"><span className="text-xs text-muted-foreground">CVV</span><span className="font-mono" data-testid="preview-cvv">••••</span></div>
          <span className="px-5 text-right text-xs">{network || "Card"}</span>
        </div>
      </div>
    </div>
    <div className="space-y-1.5"><label htmlFor="card-bank" className="text-sm font-medium">Banca</label><Input {...register("bank")} {...accessibility("bank")} maxLength={100} placeholder="ex. Banca Transilvania" />{error("bank")}</div>
    <div className="space-y-1.5"><div className="flex justify-between"><label htmlFor="card-number" className="text-sm font-medium">Număr card</label><span className="text-xs text-muted-foreground" aria-live="polite">{network}</span></div><Input {...register("number")} {...accessibility("number")} inputMode="numeric" maxLength={23} placeholder="0000 0000 0000 0000" onChange={(e) => setValue("number", formatCardNumber(e.target.value), { shouldValidate: Boolean(errors.number), shouldDirty: true })} />{error("number")}</div>
    <div className="space-y-1.5"><label htmlFor="card-holder" className="text-sm font-medium">Titular card</label><Input {...register("holder")} {...accessibility("holder")} maxLength={100} placeholder="NUME PRENUME" onChange={(e) => setValue("holder", formatHolder(e.target.value), { shouldValidate: Boolean(errors.holder), shouldDirty: true })} />{error("holder")}</div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5"><label htmlFor="card-expiry" className="text-sm font-medium">Expirare</label><Input {...register("expiry")} {...accessibility("expiry")} inputMode="numeric" maxLength={5} placeholder="MM/YY" onChange={(e) => setValue("expiry", formatExpiry(e.target.value), { shouldValidate: Boolean(errors.expiry), shouldDirty: true })} />{error("expiry")}</div>
      <div className="space-y-1.5"><label htmlFor="card-cvv" className="text-sm font-medium">CVV</label><Input {...register("cvv")} {...accessibility("cvv")} type="password" inputMode="numeric" maxLength={network === "Amex" ? 4 : 3} placeholder={network === "Amex" ? "••••" : "•••"} onFocus={() => setFlipped(true)} onBlur={(e) => { setFlipped(false); void register("cvv").onBlur(e); }} onChange={(e) => setValue("cvv", digitsOnly(e.target.value).slice(0, network === "Amex" ? 4 : 3), { shouldValidate: Boolean(errors.cvv), shouldDirty: true })} />{error("cvv")}</div>
    </div>
    <details className="text-sm"><summary className="cursor-pointer text-muted-foreground">Beneficii cashback · opțional</summary><div className="mt-3 space-y-3"><div className="space-y-1.5"><label htmlFor="card-merchants">Magazine (separate prin virgulă)</label><Input {...register("merchants")} {...accessibility("merchants")} maxLength={500} />{error("merchants")}</div><div className="space-y-1.5"><label htmlFor="card-percent">Cashback %</label><Input {...register("percent")} {...accessibility("percent")} type="number" min={0} max={100} step="0.01" />{error("percent")}</div></div></details>
    <Button className="w-full" type="submit" disabled={isSubmitting}>Salvează cardul</Button>
  </form>;
}