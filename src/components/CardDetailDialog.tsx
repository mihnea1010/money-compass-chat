import { useState } from "react";
import { EyeOff, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { demoCardDetails, type CardNetwork } from "@/lib/card-demo";
import type { MyCard } from "@/lib/my-cards";

export function CardDetailDialog({ card, onClose }: { card: MyCard; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const network: CardNetwork = card.network ?? (card.bank === "Banca Transilvania" || card.bank === "BCR" ? "Mastercard" : "Visa");
  const details = demoCardDetails(network, password);
  return <Dialog open onOpenChange={(open) => { if (!open) { setPassword(""); onClose(); } }}>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg sm:max-w-md">
      <DialogHeader><DialogTitle>{card.bank} · {card.name}</DialogTitle><DialogDescription>Date fictive de test · {network}. Nu sunt datele cardului tău real.</DialogDescription></DialogHeader>
      <dl className="space-y-5 border-y py-5">
        <div><dt className="mb-2 text-xs text-muted-foreground">Număr card · demo</dt><dd className="break-words font-mono text-lg" data-testid="card-number">{details.number}</dd></div>
        <div className="flex justify-between"><div><dt className="text-xs text-muted-foreground">CVV · demo</dt><dd className="mt-2 font-mono" data-testid="card-cvv">{details.cvv}</dd></div><div><dt className="text-xs text-muted-foreground">Rețea de test</dt><dd className="mt-2 text-sm">{network}</dd></div></div>
      </dl>
      <label className="space-y-2 text-sm">Parolă de deblocare · demo<Input type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Orice parolă" /></label>
      <p className="text-xs text-muted-foreground">Orice parolă dezvăluie doar date fictive. Nu folosi parola contului tău.</p>
      {password && <Button variant="outline" onClick={() => setPassword("")}><EyeOff />Ascunde datele</Button>}
      {!password && <div className="flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="size-3.5" />Date mascate</div>}
      <div className="space-y-2"><h3 className="text-sm font-medium">Beneficii</h3>{card.perks.length ? card.perks.map((p) => <div key={p.merchant} className="flex justify-between gap-4 text-sm"><span>{p.merchant}</span><span className="shrink-0 text-success-foreground">{p.percent}%</span></div>) : <p className="text-sm text-muted-foreground">Nicio ofertă adăugată</p>}</div>
    </DialogContent>
  </Dialog>;
}