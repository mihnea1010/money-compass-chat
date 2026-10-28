import { useEffect, useState } from "react";

export const SITUATII = ["Salariat", "PFA / freelancer", "Am SRL", "Student", "Șomer / în căutare", "Pensionar"] as const;
export const VENITURI = ["Sub 3.000 lei", "3.000 – 5.000 lei", "5.000 – 8.000 lei", "8.000 – 15.000 lei", "Peste 15.000 lei"] as const;
export const OBIECTIVE = ["Fond de urgență", "Economisire pentru casă", "Economii pentru pensie", "Investiții (ETF, titluri de stat)", "Plata datoriilor", "Buget mai clar", "Nu sunt sigur încă"] as const;

export type Profil = {
  nume: string;
  varsta: number;
  oras: string;
  situatii: string[];
  venit: string;
  obiective: string[];
  creatLa: string;
};

const KEY = "clarai.profile";
const EVT = "clarai-profile";

/** Navigation only: a local profile is not an authenticated session. */
export function profileEntryPath(profile: Profil | null): "/" | "/acasa" {
  return profile ? "/" : "/acasa";
}

export function loadProfile(): Profil | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { return null; }
}
export function saveProfile(p: Profil, opts: { skipCloud?: boolean } = {}) {
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new Event(EVT));
  if (!opts.skipCloud) {
    // Signed-in users also keep the profile in their account (lazy import keeps this module light).
    void import("@/integrations/supabase/client").then(async ({ supabase }) => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { pushProfile } = await import("@/hooks/use-auth");
      await pushProfile(data.user.id, p);
    });
  }
}
export function clearProfile() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVT));
}

/** Profilul curent; null până la hidratare sau dacă nu există. */
export function useProfile() {
  const [p, setP] = useState<Profil | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => { setP(loadProfile()); setReady(true); };
    sync();
    window.addEventListener(EVT, sync);
    return () => window.removeEventListener(EVT, sync);
  }, []);
  return { profil: p, ready };
}

/** Context trimis Copilotului — fără nume, doar date agregate. */
export function profilPentruAI(p: Profil | null) {
  if (!p) return null;
  return { varsta: p.varsta, oras: p.oras, situatii: p.situatii, venit: p.venit, obiective: p.obiective };
}
