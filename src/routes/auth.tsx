import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ProfileAuthForm } from "@/components/ProfileAuthForm";

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
  useEffect(() => { if (ready && user) navigate({ to: "/onboarding", replace: true }); }, [ready, user, navigate]);

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <ProfileAuthForm />
      </div>
    </div>
  );
}
