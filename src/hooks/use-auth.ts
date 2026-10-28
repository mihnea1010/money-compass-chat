import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearProfile, saveProfile, type Profil } from "@/lib/profile";

/** Loads the signed-in user's own profile into the local cache; clears any other cached profile when the account has none. */
async function syncProfile(userId: string) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (data && data.nume) {
    saveProfile({ nume: data.nume, varsta: data.varsta ?? 0, oras: data.oras, situatii: data.situatii, venit: data.venit, obiective: data.obiective, creatLa: data.created_at }, { skipCloud: true });
  } else {
    clearProfile();
  }
}

export async function pushProfile(userId: string, p: Profil) {
  await supabase.from("profiles").upsert({ id: userId, nume: p.nume, varsta: p.varsta, oras: p.oras, situatii: p.situatii, venit: p.venit, obiective: p.obiective, updated_at: new Date().toISOString() });
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [synced, setSynced] = useState(false);
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
      if (session?.user && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        const id = session.user.id;
        setSynced(false);
        // Defer Supabase calls out of the auth callback to avoid deadlocks.
        setTimeout(() => { void syncProfile(id).finally(() => setSynced(true)); }, 0);
      } else if (!session?.user) setSynced(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return { user, ready, synced };
}
