import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Intră în cont — BestSaves" },
      { name: "description", content: "Intră în contul BestSaves ca profilul tău să rămână salvat pe orice dispozitiv." },
      { property: "og:title", content: "Intră în cont — BestSaves" },
      { property: "og:description", content: "Contul tău BestSaves, cu profilul salvat în siguranță." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (ready && user) navigate({ to: "/", replace: true }); }, [ready, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        if (!data.session) toast.success("Verifică emailul și confirmă contul, apoi intră.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nu a mers. Încearcă din nou.");
    } finally { setBusy(false); }
  };

  const oauth = async (provider: "google" | "lovable") => {
    const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (r.error) toast.error("Nu am putut intra în cont.");
  };

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">{mode === "in" ? "Intră în cont" : "Creează cont"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Profilul tău rămâne salvat și după refresh sau pe alt dispozitiv.</p>
        </div>
        <div className="space-y-2">
          <Button variant="outline" className="w-full" onClick={() => oauth("google")}>Continuă cu Google</Button>
          <Button variant="outline" className="w-full" onClick={() => oauth("lovable")}>Continuă cu Lovable</Button>
        </div>
        <div className="text-center text-xs text-muted-foreground">sau cu email</div>
        <form onSubmit={submit} className="space-y-3">
          <Input type="email" required placeholder="email@exemplu.ro" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" required minLength={6} placeholder="Parolă" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" className="w-full" disabled={busy}>{mode === "in" ? "Intră" : "Creează cont"}</Button>
        </form>
        <button type="button" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Nu ai cont? Creează unul" : "Ai deja cont? Intră"}
        </button>
      </div>
    </div>
  );
}
