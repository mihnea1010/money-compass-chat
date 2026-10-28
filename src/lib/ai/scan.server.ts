import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { CATEGORII } from "@/lib/statement";

const MODEL = "google/gemini-3.1-flash-lite";

export async function handleScan(request: Request) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return new Response("Configurare AI lipsă.", { status: 500 });
  let items: { i: number; d: string; s: number }[];
  try {
    const body = (await request.json()) as { items?: typeof items };
    if (!Array.isArray(body.items) || body.items.length > 1000) throw new Error();
    items = body.items;
  } catch {
    return new Response("Cerere invalidă.", { status: 400 });
  }
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey },
  });
  try {
    const { object } = await generateObject({
      model: provider.chat(MODEL),
      schema: z.object({ rezultate: z.array(z.object({ i: z.number(), c: z.enum(CATEGORII) })) }),
      prompt: `Clasifică fiecare tranzacție bancară românească într-o categorie. Sume pozitive = încasări, negative = plăți.
Categorii: salariu, freelancing (plăți de la clienți, Upwork etc.), dividende, alte_venituri, chirie_utilitati, mancare (supermarket, livrări), abonamente_tech, transport, shopping, altele.
Returnează câte un rezultat pentru fiecare i.
${JSON.stringify(items)}`,
    });
    return Response.json(object);
  } catch (e) {
    console.error(e);
    return new Response("Scanarea a eșuat.", { status: 502 });
  }
}
