import type { Profil } from "@/lib/profile";

export function profileState(signedIn: boolean, profile: Profil | null): "auth" | "name" | "complete" {
  if (profile?.nume.trim()) return "complete";
  return signedIn ? "name" : "auth";
}

export function nameOnlyProfile(name: string): Profil {
  return { nume: name.trim(), varsta: 0, oras: "", situatii: [], venit: "", obiective: [], creatLa: new Date().toISOString() };
}