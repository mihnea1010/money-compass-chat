import { createFileRoute } from "@tanstack/react-router";
import { SavingsExperience } from "@/components/SavingsExperience";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "BestSaves — Oferte care îți lasă mai mulți bani" },
    { name: "description", content: "Descoperă economii anuale estimate, oferte de carduri și pași concreți, ordonați după impact și efort. Datele din Seif rămân private." },
    { property: "og:title", content: "BestSaves — Oferte care îți lasă mai mulți bani" },
    { property: "og:description", content: "Mai puține costuri. Oferte verificate. Economii estimate din datele tale, fără conversații și fără cont." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SavingsExperience,
});
