import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, PiggyBank, Sparkles, Users, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { profileEntryPath, useProfile } from "@/lib/profile";

export const Route = createFileRoute("/acasa")({
  head: () => ({
    meta: [
      { title: "Acasă — BestSaves" },
      { name: "description", content: "BestSaves: descoperă oferte care economisesc bani și redu costurile abonamentelor, cu date private în browser." },
      { property: "og:title", content: "Acasă — BestSaves" },
      { property: "og:description", content: "Mai mulți bani la tine. Descoperă ofertele BestSaves și alternative pentru costurile recurente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Acasa,
});

function Acasa() {
  const { profil, ready } = useProfile();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready && profil) void navigate({ to: profileEntryPath(profil), replace: true });
  }, [ready, profil, navigate]);
  if (!ready || profil) return null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex min-h-full max-w-3xl items-center px-6 py-12 md:px-12">
        <section className="w-full py-8">
          <div className="mb-8 flex items-center gap-2 text-sm font-medium text-primary"><Users className="size-5" />Comunitatea BestSaves <span className="ml-auto text-xs font-normal text-muted-foreground">Scenariu demo</span></div>
          <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">BestSaves<span className="mt-3 block text-2xl font-medium text-muted-foreground">Mai mulți bani la tine.</span></h1>
          <div className="my-9 grid grid-cols-1 gap-6 border-y py-7 sm:grid-cols-2">
            <div><p className="font-display text-4xl font-semibold tabular-nums">12.400<span className="text-savings">+</span></p><p className="mt-2 text-sm text-muted-foreground">utilizatori în scenariul demonstrativ</p></div>
            <div className="sm:border-l sm:pl-6"><p className="font-display text-4xl font-semibold tabular-nums text-savings">1,2 milioane</p><p className="mt-2 text-sm text-muted-foreground">lei economisiți în scenariul demonstrativ</p></div>
          </div>
          <p className="text-lg leading-relaxed">Următorul pas spre economii începe cu tine.</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Descoperă ofertele potrivite sau redu costurile pe care le plătești deja.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button variant="savings" size="lg" className="h-14 flex-1 gap-3 text-base" asChild>
              <Link to="/"><Sparkles />Salvează bani<ArrowRight /></Link>
            </Button>
            <Button variant="outline" size="lg" className="h-14 flex-1 gap-3 border-savings bg-background text-base text-savings hover:bg-savings/10 hover:text-savings" asChild>
              <Link to="/extra"><PiggyBank />Abonamentele tale</Link>
            </Button>
          </div>
          <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-savings" />Datele tale rămân în browser. Fără cont.</p>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Cifre ilustrative, nu rezultate reale ale utilizatorilor.</p>
        </section>
      </div>
    </div>
  );
}
