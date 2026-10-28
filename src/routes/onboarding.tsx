import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OBIECTIVE, SITUATII, VENITURI, loadProfile, saveProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Creează-ți profilul — BestSaves" },
      { name: "description", content: "Profil privat pentru oferte și oportunități de economisire potrivite." },
      { property: "og:title", content: "Creează-ți profilul — BestSaves" },
      { property: "og:description", content: "Profil financiar privat, păstrat doar în browserul tău." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});

const PASI = ["Despre tine", "Ce lucrezi", "Venit", "Obiective"];

function Onboarding() {
  const navigate = useNavigate();
  const [pas, setPas] = useState(0);
  const [nume, setNume] = useState("");
  const [varsta, setVarsta] = useState("");
  const [oras, setOras] = useState("");
  const [situatii, setSituatii] = useState<string[]>([]);
  const [venit, setVenit] = useState("");
  const [obiective, setObiective] = useState<string[]>([]);

  useEffect(() => {
    const p = loadProfile();
    if (!p) return;
    setNume(p.nume); setVarsta(String(p.varsta)); setOras(p.oras);
    setSituatii(p.situatii); setVenit(p.venit); setObiective(p.obiective);
  }, []);

  const v = Number(varsta);
  const valid = [nume.trim() && v >= 16 && v <= 100 && oras.trim(), situatii.length > 0, !!venit, obiective.length > 0][pas];
  const toggle = (list: string[], set: (l: string[]) => void, x: string) => set(list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);

  const finish = () => {
    saveProfile({ nume: nume.trim(), varsta: v, oras: oras.trim(), situatii, venit, obiective, creatLa: new Date().toISOString() });
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-xl px-4 py-10 md:py-16">
        <div className="mb-8 flex gap-1.5">
          {PASI.map((p, i) => <div key={p} className={cn("h-1 flex-1 rounded-full", i <= pas ? "bg-primary" : "bg-muted")} />)}
        </div>
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pasul {pas + 1} din 4 · {PASI[pas]}</div>

        {pas === 0 && (
          <Step title="Hai să ne cunoaștem" sub="Date pentru oferte potrivite vârstei și locului unde trăiești.">
            <Field label="Cum să-ți spunem?"><Input value={nume} onChange={(e) => setNume(e.target.value)} placeholder="ex. Ștefan" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Vârsta"><Input type="number" min={16} max={100} value={varsta} onChange={(e) => setVarsta(e.target.value)} placeholder="25" /></Field>
              <Field label="Orașul"><Input value={oras} onChange={(e) => setOras(e.target.value)} placeholder="București" /></Field>
            </div>
          </Step>
        )}
        {pas === 1 && (
          <Step title="Cu ce te ocupi?" sub="Poți alege mai multe — de exemplu salariat și freelancer.">
            <Chips options={SITUATII} selected={situatii} onToggle={(x) => toggle(situatii, setSituatii, x)} />
          </Step>
        )}
        {pas === 2 && (
          <Step title="Cât câștigi pe lună, aproximativ?" sub="Venit net total, din toate sursele.">
            <Chips options={VENITURI} selected={venit ? [venit] : []} onToggle={setVenit} />
          </Step>
        )}
        {pas === 3 && (
          <Step title="Ce vrei să obții?" sub="Alege obiectivele care contează pentru tine.">
            <Chips options={OBIECTIVE} selected={obiective} onToggle={(x) => toggle(obiective, setObiective, x)} />
          </Step>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setPas(pas - 1)} disabled={pas === 0}><ArrowLeft className="size-4" /> Înapoi</Button>
          {pas < 3
            ? <Button onClick={() => setPas(pas + 1)} disabled={!valid}>Continuă <ArrowRight className="size-4" /></Button>
            : <Button onClick={finish} disabled={!valid}>Gata, creează profilul <Check className="size-4" /></Button>}
        </div>
        <p className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4" /> Intră în cont ca profilul să rămână salvat.
        </p>
      </div>
    </div>
  );
}

function Step({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="mt-2 space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5 text-sm font-medium">{label}{children}</label>;
}

function Chips({ options, selected, onToggle }: { options: readonly string[]; selected: string[]; onToggle: (x: string) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button key={o} type="button" onClick={() => onToggle(o)}
            className={cn("flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors",
              on ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted/60")}>
            {o}{on && <Check className="size-4 text-primary" />}
          </button>
        );
      })}
    </div>
  );
}
