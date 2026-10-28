import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/lib/profile";

/** Signed-in users without a saved profile are sent to fill in "Hai să ne cunoaștem". */
export function ProfileGate() {
  const { user, synced } = useAuth();
  const { profil, ready } = useProfile();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  useEffect(() => {
    if (user && synced && ready && !profil && path !== "/onboarding") void navigate({ to: "/onboarding", replace: true });
  }, [user, synced, ready, profil, path, navigate]);
  return null;
}
