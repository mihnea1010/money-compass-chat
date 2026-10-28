import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, CreditCard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cardInputSchema, cardMetadata, detectNetwork, digitsOnly, formatExpiry, formatHolder, type CardInput } from "@/lib/card-input";
import type { MyCard } from "@/lib/my-cards";

export function AddCardDialog({ onAdd }: { onAdd: (card: MyCard) => void }) {
  const [open, setOpen] = useState(false);
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button size="sm" variant="outline"><Plus /> Adaugă card</Button></DialogTrigger>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>Adaugă card nou</DialogTitle><DialogDescription>Se introduc doar codul BIN și ultimele 4 cifre; nimic nu este salvat sau trimis.</DialogDescription></DialogHeader>
      {open && <CardForm onAdd={(card) => { onAdd(card); setOpen(false); }} />}
    </DialogContent>
  </Dialog>;
}

const mask = (value: string, length: number) => (value + "•".repeat(length)).slice(0, length);

function CardForm({ onAdd }: { onAdd: (card: MyCard) => void }) {
  const { register, watch, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<CardInput>({ resolver: zodResolver(cardInputSchema()), mode: "onTouched", defaultValues: { bank: "", bin: "", last4: "", holder: "", expiry: "", merchants: "", percent: 5 } });
  const values = watch();
  const network = detectNetwork(values.bin);
  const previewNumber = values.bin || values.last4 ? `${mask(values.bin, 6)} •••• •••• ${mask(values.last4, 4)}` : "•••••• •••• •••• ••••";
  const error = (field: keyof CardInput) => errors[field] ? <p id={`card-${field}-error`} role="alert" className="text-xs text-destructive">{errors[field]?.message}</p> : null;
  const accessibility = (field: keyof CardInput) => ({ id: `card-${field}`, "aria-invalid": Boolean(errors[field]), "aria-describedby": errors[field] ? `card-${field}-error` : undefined });
  return <form className="space-y-4" autoComplete="off" onSubmit={handleSubmit((data) => onAdd(cardMetadata(data, crypto.randomUUID())))}>
    <div className="card-preview-scene mx-auto w-full max-w-sm" aria-label="Previzualizare card">
      <div className="card-preview-turn">
        <div className="card-preview-face wallet-bt-alt flex flex-col justify-between p-5 text-wallet-foreground shadow-soft">
          <div className="flex items-center justify-between gap-3"><span className="truncate font-semibold">{values.bank || "Banca ta"}</span><span className="shrink-0 text-sm">{network || "Card"}</span></div>
          <CreditCard className="size-7 opacity-70" />
          <div className="font-mono text-base sm:text-lg">{previewNumber}</div>
          <div className="flex items-end justify-between gap-4"><span className="min-w-0 break-words text-xs">{values.holder || "TITULAR CARD"}</span><span className="shrink-0 font-mono text-xs">{values.expiry || "MM/YY"}</span></div>
        </div>
      </div>
    </div>
    <div className="space-y-1.5"><label htmlFor="card-bank" className="text-sm font-medium">Banca</label><Input {...register("bank")} {...accessibility("bank")} maxLength={100} placeholder="ex. Banca Transilvania" />{error("bank")}</div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5"><div className="flex items-baseline justify-between gap-2"><label htmlFor="card-bin" className="text-sm font-medium">Primele 6 cifre (BIN)</label><span className="text-xs text-muted-foreground" aria-live="polite">{network}</span></div><Input {...register("bin")} {...accessibility("bin")} inputMode="numeric" maxLength={6} placeholder="424242" onChange={(e) => setValue("bin", digitsOnly(e.target.value).slice(0, 6), { shouldValidate: Boolean(errors.bin), shouldDirty: true })} />{error("bin")}</div>
      <div className="space-y-1.5"><label htmlFor="card-last4" className="text-sm font-medium">Ultimele 4 cifre</label><Input {...register("last4")} {...accessibility("last4")} inputMode="numeric" maxLength={4} placeholder="4242" onChange={(e) => setValue("last4", digitsOnly(e.target.value).slice(0, 4), { shouldValidate: Boolean(errors.last4), shouldDirty: true })} />{error("last4")}</div>
    </div>
    <div className="space-y-1.5"><label htmlFor="card-holder" className="text-sm font-medium">Titular card</label><Input {...register("holder")} {...accessibility("holder")} maxLength={100} placeholder="NUME PRENUME" onChange={(e) => setValue("holder", formatHolder(e.target.value), { shouldValidate: Boolean(errors.holder), shouldDirty: true })} />{error("holder")}</div>
    <div className="space-y-1.5"><label htmlFor="card-expiry" className="text-sm font-medium">Expirare</label><Input {...register("expiry")} {...accessibility("expiry")} inputMode="numeric" maxLength={5} placeholder="MM/YY" onChange={(e) => setValue("expiry", formatExpiry(e.target.value), { shouldValidate: Boolean(errors.expiry), shouldDirty: true })} />{error("expiry")}</div>
    <details className="text-sm"><summary className="cursor-pointer text-muted-foreground">Beneficii cashback · opțional</summary><div className="mt-3 space-y-3"><div className="space-y-1.5"><label htmlFor="card-merchants">Magazine (separate prin virgulă)</label><Input {...register("merchants")} {...accessibility("merchants")} maxLength={500} />{error("merchants")}</div><div className="space-y-1.5"><label htmlFor="card-percent">Cashback %</label><Input {...register("percent")} {...accessibility("percent")} type="number" min={0} max={100} step="0.01" />{error("percent")}</div></div></details>
    <Button className="w-full" type="submit" disabled={isSubmitting}>Salvează cardul</Button>
    <p className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden /><span>Conform PCI-DSS. Din motive de securitate, nu stocăm numărul complet al cardului și nici codul CVV.</span></p>
  </form>;
}
