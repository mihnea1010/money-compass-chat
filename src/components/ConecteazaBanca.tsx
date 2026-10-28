import { useState } from "react";
import { Link2, ShieldCheck, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const BANCI = ["Banca Transilvania", "ING", "Revolut"] as const;

/** Flux Open Banking simulat (PSD2) — instant și sigur pentru demo. */
export function ConecteazaBanca({ onConfirm, disabled }: { onConfirm: (banca: string) => Promise<void>; disabled?: boolean }) {
  const [banca, setBanca] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ok = async () => { setBusy(true); try { await onConfirm(banca!); } finally { setBusy(false); setBanca(null); } };
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-3">
        {BANCI.map((b) => (
          <Button key={b} variant="outline" disabled={disabled} onClick={() => setBanca(b)} className="h-auto py-3">
            <Link2 className="size-4" /> {b}
          </Button>
        ))}
      </div>
      <Dialog open={!!banca} onOpenChange={(o) => !o && !busy && setBanca(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conectează {banca} prin Open Banking</DialogTitle>
            <DialogDescription>Acord PSD2 · BestSaves solicită acces la contul tău.</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 rounded-xl border p-4 text-sm">
            <li>✓ Permisiune <b>read-only</b> pentru <b>90 de zile</b></li>
            <li>✓ Citim soldul și tranzacțiile</li>
            <li>✗ Nu putem face plăți și nu vedem parole</li>
          </ul>
          <div className="flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-xs text-success-foreground">
            <ShieldCheck className="size-4" /> Datele nu părăsesc laptopul tău.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" disabled={busy} onClick={() => setBanca(null)}>Refuz</Button>
            <Button disabled={busy} onClick={ok}>{busy && <Loader2 className="size-4 animate-spin" />} Accept și conectez</Button>
          </div>
          <p className="text-[11px] text-muted-foreground">Demo: conexiune simulată cu tranzacții realiste.</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
