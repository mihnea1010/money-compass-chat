import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, KeyRound, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { deleteOwnAccount } from "@/lib/account.functions";
import { clearProfile } from "@/lib/profile";

export function ProfileAccount() {
  const [expanded, setExpanded] = useState(false);
  const [change, setChange] = useState(false);
  const [remove, setRemove] = useState(false);
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const deleteAccount = useServerFn(deleteOwnAccount);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  async function leave() {
    await queryClient.cancelQueries(); queryClient.clear();
    await supabase.auth.signOut({ scope: "local" }); clearProfile();
    await navigate({ to: "/onboarding", replace: true });
  }
  async function changePassword(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (password !== confirm) { setError("Parolele noi nu coincid."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password, current_password: current });
      if (error) throw error;
      setChange(false); setCurrent(""); setPassword(""); setConfirm(""); toast.success("Parola a fost schimbată.");
    } catch { setError("Parola nu a fost schimbată. Verifică parola actuală și încearcă din nou."); }
    finally { setBusy(false); }
  }
  async function erase() {
    setBusy(true); setError("");
    try { await deleteAccount(); await leave(); toast.success("Contul a fost șters."); }
    catch { setError("Contul nu a putut fi șters. Încearcă din nou."); }
    finally { setBusy(false); }
  }
  return <section className="border-y">
    <Button variant="ghost" className="h-16 w-full justify-between rounded-none px-0 text-base" aria-expanded={expanded} aria-controls="account-options" onClick={() => setExpanded(!expanded)}>Cont<ChevronDown className={expanded ? "rotate-180 transition-transform" : "transition-transform"} /></Button>
    {expanded && <div id="account-options" className="space-y-1 border-t py-3">
      <Button variant="ghost" className="w-full justify-start" onClick={() => { setError(""); setChange(true); }}><KeyRound />Schimbă parola</Button>
      <Button variant="ghost" className="w-full justify-start" onClick={leave}><LogOut />Ieși din cont</Button>
      <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={() => { setError(""); setRemove(true); }}><Trash2 />Șterge contul</Button>
    </div>}
    <Dialog open={change} onOpenChange={(open) => { setChange(open); if (!open) { setCurrent(""); setPassword(""); setConfirm(""); setError(""); } }}>
      <DialogContent className="w-[calc(100%-2rem)] rounded-lg sm:max-w-md"><DialogHeader><DialogTitle>Schimbă parola</DialogTitle><DialogDescription>Introdu parola actuală și alege o parolă nouă.</DialogDescription></DialogHeader>
        <form onSubmit={changePassword} className="space-y-4">
          <label className="block space-y-2 text-sm">Parola actuală<Input type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} /></label>
          <label className="block space-y-2 text-sm">Parola nouă<Input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <label className="block space-y-2 text-sm">Confirmă parola nouă<Input type="password" required minLength={6} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">{busy ? "Se salvează…" : "Salvează parola"}</Button>
        </form>
      </DialogContent>
    </Dialog>
    <AlertDialog open={remove} onOpenChange={setRemove}><AlertDialogContent className="w-[calc(100%-2rem)] rounded-lg"><AlertDialogHeader><AlertDialogTitle>Ștergi contul?</AlertDialogTitle><AlertDialogDescription>Contul și profilul salvat în cont vor fi șterse definitiv. Această acțiune nu poate fi anulată. Cardurile și extrasele păstrate pe acest dispozitiv nu sunt șterse.</AlertDialogDescription></AlertDialogHeader>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <AlertDialogFooter><AlertDialogCancel disabled={busy}>Renunță</AlertDialogCancel><AlertDialogAction disabled={busy} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={(e) => { e.preventDefault(); void erase(); }}>{busy ? "Se șterge…" : "Șterge definitiv"}</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent></AlertDialog>
  </section>;
}
