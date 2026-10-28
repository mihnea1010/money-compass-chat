import { createFileRoute, redirect } from "@tanstack/react-router";

// Preserve old browser bookmarks without retaining the conversational product.
export const Route = createFileRoute("/chat/$threadId")({
  beforeLoad: () => { throw redirect({ to: "/", replace: true }); },
  head: () => ({ meta: [
    { title: "Oferte de economisire — BestSaves" },
    { name: "description", content: "Conversațiile au fost înlocuite cu oportunități concrete de economisire." },
    { property: "og:title", content: "Oferte de economisire — BestSaves" },
    { property: "og:description", content: "Descoperă oferte și economii estimate, fără conversații." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
});
