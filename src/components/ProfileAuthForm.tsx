import { useState } from "react";
import { ArrowRight, LoaderCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { authErrorMessage, isObfuscatedDuplicate } from "@/lib/auth-errors";

export function ProfileAuthForm({ initialMode = "in" }: { initialMode?: "in" | "up" }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/onboarding` } });
        if (error) throw error;
        if (isObfuscatedDuplicate(data.user)) { setError(authErrorMessage("up", { code: "user_already_exists" })); return; }
        if (!data.session) { setConfirmation(true); setPassword(""); }
      }
    } catch (err) {
      const e = err as { code?: string; status?: number; message?: string };
      if (import.meta.env.DEV) console.warn("[auth]", mode, e?.status, e?.code);
      setError(authErrorMessage(mode, e));
    }
    finally { setBusy(false); }
  }
  async function google() {
    setBusy(true); setError("");
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/onboarding` });
      if (result.error) throw result.error;
      if (result.redirected) return;
    } catch { setError("Nu am putut continua cu Google. Încearcă din nou."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6">
    <div className="space-y-2"><div className="mb-5 flex size-11 items-center justify-center rounded-lg bg-success-soft text-success-foreground"><Mail className="size-5" /></div><h1 className="font-display text-3xl font-semibold">{mode === "in" ? "Bine ai revenit" : "Creează cont"}</h1><p className="text-sm text-muted-foreground">{mode === "in" ? "Intră în contul tău BestSaves." : "Un cont pentru profilul tău, pe orice dispozitiv."}</p></div>
    <div className="grid grid-cols-2 border-b" role="tablist" aria-label="Autentificare">{(["in", "up"] as const).map((m) => <Button key={m} variant="ghost" role="tab" aria-selected={mode === m} className={`rounded-none border-b-2 ${mode === m ? "border-success-foreground text-success-foreground" : "border-transparent text-muted-foreground"}`} onClick={() => { setMode(m); setError(""); setConfirmation(false); }}>{m === "in" ? "Intră" : "Creează cont"}</Button>)}</div>
    {confirmation ? <div role="status" className="space-y-3 rounded-lg bg-success-soft p-4 text-sm"><h2 className="font-medium">Verifică emailul</h2><p>Confirmă contul din mesajul primit, apoi intră în cont.</p><Button variant="outline" onClick={() => { setMode("in"); setConfirmation(false); }}>Înapoi la autentificare</Button></div> : <form onSubmit={submit} className="space-y-4">
      <label className="block space-y-2 text-sm">Email<Input type="email" autoComplete="email" required placeholder="email@exemplu.ro" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label className="block space-y-2 text-sm">Parolă<Input type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} required minLength={6} placeholder={mode === "up" ? "Parolă unică, greu de ghicit" : "Parola ta"} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <Button variant="savings" type="submit" disabled={busy} className="w-full">{busy ? <LoaderCircle className="motion-safe:animate-spin" /> : <ArrowRight />}{mode === "in" ? "Intră în cont" : "Creează cont"}</Button>
    </form>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />sau<span className="h-px flex-1 bg-border" /></div>
    <Button variant="outline" disabled={busy} className="w-full" onClick={google}><span className="font-semibold" aria-hidden>G</span>Continuă cu Google</Button>
  </div>;
}
