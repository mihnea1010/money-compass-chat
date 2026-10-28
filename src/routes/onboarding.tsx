import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, FlaskConical, LoaderCircle, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProfile, saveProfile } from "@/lib/profile";
import { useAuth, pushProfile } from "@/hooks/use-auth";
import { nameOnlyProfile, profileState } from "@/lib/profile-state";
import { ProfileAuthForm } from "@/components/ProfileAuthForm";
import { ProfileAccount } from "@/components/ProfileAccount";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [
    { title: "Profilul meu — BestSaves" },
    { name: "description", content: "Profilul tău BestSaves: intră în cont, gestionează contul sau continuă în mod demo." },
    { property: "og:title", content: "Profilul meu — BestSaves" },
    { property: "og:description", content: "Profilul și contul tău BestSaves, într-un singur loc." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, ready: authReady, synced } = useAuth();
  const { profil, ready } = useProfile();
  const [demoOpen, setDemoOpen] = useState(false);
  const [create, setCreate] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const state = profileState(!!user, profil);
  async function finish(e: React.FormEvent) {
    e.preventDefault(); if (!name.trim()) return;
    setBusy(true); setError("");
    const profile = nameOnlyProfile(name);
    try {
      if (user) await pushProfile(user.id, profile);
      saveProfile(profile, { skipCloud: true }); setDemoOpen(false); setName("");
    } catch { setError("Nu am putut salva numele. Încearcă din nou."); }
    finally { setBusy(false); }
  }
  const nameForm = <form onSubmit={finish} className="space-y-4"><label className="block space-y-2 text-sm">Numele tău<Input autoFocus autoComplete="given-name" maxLength={80} required value={name} onChange={(e) => setName(e.target.value)} placeholder="ex. Ștefan" /></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button variant="savings" type="submit" className="w-full" disabled={!name.trim() || busy}>{busy ? <LoaderCircle className="motion-safe:animate-spin" /> : <ArrowRight />}Continuă</Button></form>;
  if (!authReady || !ready || !synced) return <div className="grid h-full place-items-center"><LoaderCircle aria-label="Se încarcă profilul" className="size-5 text-muted-foreground motion-safe:animate-spin" /></div>;
  return <div className="relative h-full overflow-y-auto">
    <div className={`mx-auto w-full px-6 py-12 md:py-16 ${state === "complete" ? "max-w-2xl" : "max-w-md pb-28"}`}>
      {state === "auth" && <ProfileAuthForm />}
      {state === "name" && <div className="space-y-8"><div><div className="mb-6 grid size-12 place-items-center rounded-full bg-success-soft text-success-foreground"><UserRound /></div><h1 className="font-display text-3xl font-semibold">Cum să-ți spunem?</h1></div>{nameForm}</div>}
      {state === "complete" && profil && <div className="space-y-12">
        <header className="flex items-center gap-5"><div className="grid size-16 shrink-0 place-items-center rounded-full bg-success-soft font-display text-2xl font-semibold text-success-foreground">{Array.from(profil.nume.trim())[0]?.toLocaleUpperCase("ro")}</div><div className="min-w-0"><h1 className="break-words font-display text-3xl font-semibold">{profil.nume}</h1><p className="mt-2 break-all text-sm text-muted-foreground">{user ? user.email : "Mod demo — fără cont"}</p></div></header>
        {user ? <ProfileAccount /> : <section className="space-y-4 border-y py-6"><div className="flex gap-3"><FlaskConical className="mt-0.5 size-5 shrink-0 text-success-foreground" /><div><h2 className="text-sm font-medium">Ești în modul demo</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Profilul este salvat doar pe acest dispozitiv. Creează un cont pentru a-l păstra și pe alte dispozitive.</p></div></div><Button variant="savings" onClick={() => setCreate(true)}>Creează cont<ArrowRight /></Button></section>}
      </div>}
    </div>
    {state === "auth" && <Button variant="outline" className="fixed bottom-5 right-5 z-20 max-w-[calc(100%-2.5rem)] shadow-soft" onClick={() => { setName(""); setError(""); setDemoOpen(true); }}><FlaskConical />Continuă fără cont · demo</Button>}
    <Dialog open={demoOpen} onOpenChange={setDemoOpen}><DialogContent className="w-[calc(100%-2rem)] rounded-lg sm:max-w-sm"><DialogHeader><DialogTitle>Cum să-ți spunem?</DialogTitle><DialogDescription>Mod demo — fără cont. Numele rămâne doar pe acest dispozitiv.</DialogDescription></DialogHeader>{nameForm}</DialogContent></Dialog>
    <Dialog open={create && !user} onOpenChange={setCreate}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg sm:max-w-md"><DialogHeader className="sr-only"><DialogTitle>Creează cont BestSaves</DialogTitle><DialogDescription>Salvează profilul tău în cont.</DialogDescription></DialogHeader><ProfileAuthForm initialMode="up" /></DialogContent></Dialog>
  </div>;
}
