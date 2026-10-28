import { createContext, createElement, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearProfile, saveProfile, type Profil } from "@/lib/profile";

const AuthContext = createContext<{ user: User | null; ready: boolean; synced: boolean }>({ user: null, ready: false, synced: false });

export async function pushProfile(userId: string, p: Profil) {
  const { error } = await supabase.from("profiles").upsert({ id: userId, nume: p.nume, varsta: p.varsta, oras: p.oras, situatii: p.situatii, venit: p.venit, obiective: p.obiective, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ user: null as User | null, ready: false, synced: false });
  const generation = useRef(0);
  const queryClient = useQueryClient();
  const router = useRouter();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      const version = ++generation.current;
      clearTimeout(timer);
      if (!session?.user) {
        if (event === "SIGNED_OUT") clearProfile();
        setState({ user: null, ready: true, synced: true });
        if (event === "SIGNED_OUT") { queryClient.clear(); void router.invalidate(); }
        return;
      }
      setState({ user: null, ready: false, synced: false });
      timer = setTimeout(() => { void (async () => {
        const { data, error } = await supabase.auth.getUser();
        if (!mounted || version !== generation.current) return;
        if (error || !data.user) { setState({ user: null, ready: true, synced: true }); return; }
        const user = data.user;
        const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
        if (!mounted || version !== generation.current) return;
        if (!profileError) {
          if (profile?.nume.trim()) saveProfile({ nume: profile.nume, varsta: profile.varsta ?? 0, oras: profile.oras, situatii: profile.situatii, venit: profile.venit, obiective: profile.obiective, creatLa: profile.created_at }, { skipCloud: true });
          else clearProfile();
        } else clearProfile();
        setState({ user, ready: true, synced: true });
        if (event !== "INITIAL_SESSION") { void router.invalidate(); void queryClient.invalidateQueries(); }
      })(); }, 0);
    });
    return () => { mounted = false; generation.current++; clearTimeout(timer); sub.subscription.unsubscribe(); };
  }, [queryClient, router]);
  return createElement(AuthContext.Provider, { value: state }, children);
}

export function useAuth() { return useContext(AuthContext); }
