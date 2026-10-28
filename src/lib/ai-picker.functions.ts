import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const input = z.object({
  spend: z.record(z.string().max(40), z.number().min(0).max(1e7)),
  offers: z.array(z.object({ id: z.string().max(80), title: z.string().max(200), annualRon: z.number(), minutes: z.number(), provider: z.string().max(200) })).max(40),
});

/** AI picks and orders the best offers. Receives only aggregated monthly spend per category. */
export const pickOffers = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key || data.offers.length === 0) return { order: [] as string[], reasons: {} as Record<string, string> };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Alegi cele mai bune oferte bancare din România pentru un utilizator. Primești cheltuielile lunare pe categorii (lei) și ofertele cu economia anuală estimată și efortul în minute. Ordonează după bani economisiți pe minut de efort și potrivirea cu cheltuielile. Nu inventa cifre sau oferte. Răspunde DOAR JSON: {\"order\":[id...],\"reasons\":{id:\"motiv scurt în română, max 15 cuvinte\"}}." },
          { role: "user", content: JSON.stringify(data) },
        ],
      }),
    });
    if (!res.ok) return { order: [], reasons: {} };
    try {
      const body = await res.json();
      const parsed = JSON.parse(body.choices?.[0]?.message?.content ?? "{}");
      const ids = new Set(data.offers.map((o) => o.id));
      const order = Array.isArray(parsed.order) ? parsed.order.filter((id: unknown): id is string => typeof id === "string" && ids.has(id)) : [];
      const reasons: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed.reasons ?? {})) if (ids.has(k) && typeof v === "string") reasons[k] = v.slice(0, 160);
      return { order, reasons };
    } catch { return { order: [], reasons: {} }; }
  });
