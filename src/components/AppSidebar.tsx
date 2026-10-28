import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, UserRound, Vault, ShieldCheck, Sparkles, PiggyBank, LogIn, LogOut, Settings, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearProfile } from "@/lib/profile";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useSavings } from "@/hooks/use-savings";
import { subscriptionAlert } from "@/lib/spending-alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { simulateCarrefour } from "@/lib/simulate-store";
import { useQueryClient } from "@tanstack/react-query";

export function Logo() {
  return <div className="flex items-center gap-2.5"><div className="grid size-8 place-items-center rounded-md bg-primary font-display text-sm font-bold text-primary-foreground">B</div><div className="leading-tight"><div className="font-display text-lg font-semibold">BestSaves</div><div className="text-[10px] text-muted-foreground">Mai mulți bani la tine.</div></div></div>;
}
export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { offers, transactions, stopped, example } = useSavings();
  const hasOffers = !example && offers.some((o) => o.annualRon > 0);
  const alert = subscriptionAlert(transactions, stopped);
  const navigate = useNavigate();
  return <div className="flex h-full flex-col bg-sidebar p-4 text-sidebar-foreground">
    <div className="mx-2 mb-10 mt-2 flex items-center justify-between gap-2">
      <Link to="/acasa" onClick={onNavigate} aria-label="BestSaves — pagina principală" className="block rounded-md outline-offset-4 focus-visible:outline-2"><Logo /></Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Setări"><Settings /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Meniu secret</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => { simulateCarrefour(() => { navigate({ to: "/dashboard" }); onNavigate?.(); }); toast("Simulare pornită", { description: "Notificarea vine în 7 secunde." }); }}><MapPin />Simulează: sunt la Carrefour</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <nav className="space-y-2">
      <Button variant="ghost" className="w-full justify-start" asChild><Link to="/" activeOptions={{ exact: true }} onClick={onNavigate} activeProps={{ className: "bg-sidebar-accent font-medium" }}><Sparkles />Economisește{hasOffers && path !== "/" && <span aria-label="Ai oferte active" className="ml-auto grid size-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground motion-safe:animate-pulse">!</span>}</Link></Button>
      <Button variant="ghost" className={`w-full justify-start ${alert.excessive ? "text-destructive hover:text-destructive" : ""}`} asChild><Link to="/extra" onClick={onNavigate} activeProps={{ className: "bg-sidebar-accent font-medium" }}><PiggyBank />Abonamente{alert.excessive && <span aria-label="Cheltuieli excesive" className="ml-auto size-2 rounded-full bg-destructive" />}</Link></Button>
      <Button variant="ghost" className="w-full justify-start" asChild><Link to="/dashboard" onClick={onNavigate} activeProps={{ className: "bg-sidebar-accent font-medium" }}><Vault />Seiful meu</Link></Button>
      <Button variant="ghost" className="w-full justify-start" asChild><Link to="/onboarding" onClick={onNavigate} activeProps={{ className: "bg-sidebar-accent font-medium" }}><UserRound />Profilul meu</Link></Button>
    </nav>
    <div className="mt-6">
      {user
        ? <div className="flex items-center justify-between gap-2 px-2 text-xs"><span className="truncate text-muted-foreground">{user.email}</span><Button variant="ghost" size="sm" onClick={async () => { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); clearProfile(); await navigate({ to: "/onboarding", replace: true }); onNavigate?.(); }}><LogOut />Ieși</Button></div>
        : <Button variant="outline" className="w-full" asChild><Link to="/onboarding" onClick={onNavigate}><LogIn />Intră în cont</Link></Button>}
    </div>
    <div className="mt-auto space-y-4 border-t pt-5"><div className="px-2"><div className="font-display text-base font-semibold">Extrasul tău. Cifra ta.</div><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Află ce oferte se potrivesc cheltuielilor tale.</p><Button variant="link" size="sm" className="mt-3 h-auto p-0" asChild><Link to="/dashboard" onClick={onNavigate}>Deschide Seiful <ArrowUpRight /></Link></Button></div><div className="flex items-start gap-2 rounded-md bg-success-soft p-3 text-xs text-success-foreground"><ShieldCheck className="size-4 shrink-0" /><span>Date private.<br />Fără cont. Fără conversații.</span></div></div>
  </div>;
}
