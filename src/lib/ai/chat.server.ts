import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { CARD_CONTEXT } from "../card-loops";
import { VERIFIED_FISCAL_CONTEXT } from "../optimizations";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "./run-id.server";

const MODEL = "openai/gpt-6-astra";

const SYSTEM = `Ești BestSaves Copilot — un consilier financiar personal pentru România, axat pe educație financiară.
Răspunzi mereu în limba română, clar, prietenos și concis, folosind markdown (liste, bold, tabele scurte).
Domenii: buget personal (regula 50/30/20, metoda plicurilor), economisire (fond de urgență, obiective pe termen lung), scăderea abonamentelor și cheltuielilor recurente, iesirea din datorii (metoda bulgărelui de zăpadă), noțiuni de bază despre investiții pentru începători (dobândă compusă, ETF-uri, diversificare), economii pentru pensie în termeni simpli.
Reguli:
- Poți explica regulile fiscale de reconfirmat de mai jos, fără a te prezenta ca expert contabil. Nu inventa cote, eligibilitate sau termene; recomandă confirmarea cu primăria/salarizarea/specialistul pentru situația concretă. Nu efectuezi plăți, depuneri sau facturare.
- Pentru recompense de carduri nu trata referințele de mai jos ca dovezi; declară lipsa verificării pentru termenii specifici. Nu oferi schema double-dipping ca fapt verificat; explică exact ce e confirmat și ce nu. Nu recomanda rotirea artificială a fondurilor. Avertizează despre dobânzi și rambursarea integrală la scadența reală.
- Când dai cifre, menționează ipotezele și că diferențele individuale contează; pentru decizii mari (investiții, împrumuturi) recomandă consultarea unui specialist autorizat.
- Nu cere și nu folosi date bancare personale (IBAN, nume). Dacă utilizatorul trimite un sumar anonimizat din Seif, lucrează doar cu sumele totale.
- La final, propune 1-3 pași concreți următori.`;

export async function handleChat(request: Request) {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) return new Response("Configurare AI lipsă.", { status: 500 });

  let messages: UIMessage[];
  let profil = "";
  try {
    const body = (await request.json()) as { messages?: UIMessage[]; profil?: unknown; seif?: unknown; optimizations?: unknown };
    profil += `\n\n${CARD_CONTEXT}\n${VERIFIED_FISCAL_CONTEXT}\nData curentă UTC: ${new Date().toISOString()}. Reconfirmă termenii dacă anul curent nu este 2026; nu reactiva campanii expirate.`;
    if (body.optimizations && typeof body.optimizations === "object") {
      profil += `\n\nOptimizări din browser (date DECLARATE de utilizator, nu confirmate de bancă; estimările nu sunt economii realizate): ${JSON.stringify(body.optimizations).slice(0, 10000)}`;
    }
    if (body.profil && typeof body.profil === "object") {
      profil += `\n\nProfilul utilizatorului (personalizează sfaturile după el, fără să-l repeți inutil): ${JSON.stringify(body.profil).slice(0, 1000)}`;
    }
    if (body.seif && typeof body.seif === "object") {
      profil += `\n\nDate din Seiful financiar al utilizatorului (acces complet, sume în RON; folosește-le direct când răspunzi, nu cere aceste date din nou): ${JSON.stringify(body.seif).slice(0, 6000)}
KPI-uri precalculate (în "kpi"): savingsRate % = economii lunare/venit net×100; emergencyRunwayLuni = lichidități/cheltuieli esențiale lunare; dti % = rate datorii/venit×100; viabilityRatio = flux net neangajat/încasări; requisiteVariety = cheltuieli discreționare/obligații fixe; humanToFinancial = valoarea actualizată a câștigurilor viitoare/active financiare nete; fireProgress % = portofoliu (aproximat cu economiile)/(25×cheltuieli anuale)×100.
Când utilizatorul cere un raport sau sfaturi, bazează-te pe acești indicatori: dă valoarea, explică pe scurt ce înseamnă și pragul sănătos (ex. savings rate ≥20%, runway 3–6 luni, DTI <36%), apoi recomandări. Nu recalcula altfel formulele.`;
    } else {
      profil += `\n\nSeiful financiar e gol. Dacă utilizatorul cere un raport pe cifrele lui, spune-i să încarce un extras în Seif.`;
    }
    if (!Array.isArray(body.messages)) throw new Error();
    messages = body.messages;
  } catch {
    return new Response("Cerere invalidă.", { status: 400 });
  }

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: provider.responses(MODEL),
    system: SYSTEM + profil,
    messages: await convertToModelMessages(messages),
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  return withLovableAiGatewayRunIdHeader(
    result.toUIMessageStreamResponse({
      originalMessages: messages,
      sendReasoning: true,
      onError: (error) => {
        console.error("chat error", error);
        const status = (error as { statusCode?: number })?.statusCode;
        if (status === 429) return "Prea multe cereri. Încearcă din nou în câteva secunde.";
        if (status === 402) return "Creditele AI s-au epuizat. Adaugă credite din Settings → Plans & credits.";
        return "A apărut o eroare. Încearcă din nou.";
      },
    }),
    runIdFetch,
  );
}
