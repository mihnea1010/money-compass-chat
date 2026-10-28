import type { Tranzactie } from "./statement";

export type SwapAlternative = {
  name: string;
  url: string;
  tagline: string;
  benefits: string[];
  migration: string[];
};

export type SwapDef = {
  id: string;
  paidName: string;
  match: RegExp;
  alt: SwapAlternative;
};

export type Swap = SwapDef & {
  costLunar: number;
  annualSaved: number;
  luni: number;
};

/**
 * Doar software cu alternative open-source legitime.
 * NICIODATĂ servicii de streaming de conținut (Netflix, Spotify, HBO, Disney+ etc.):
 * nu pot fi înlocuite legal de open source.
 */
export const SWAPS: SwapDef[] = [
  {
    id: "adobe",
    paidName: "Adobe Creative Cloud",
    match: /adobe/i,
    alt: {
      name: "GIMP + Krita",
      url: "https://www.gimp.org",
      tagline: "Editare foto și ilustrație profesională, gratuită",
      benefits: [
        "0 lei cost de licență, pentru totdeauna",
        "Fără abonament și fără lock-in",
        "Comunitate mare, pluginuri gratuite",
      ],
      migration: [
        "Instalează GIMP (editare foto) și Krita (ilustrație) de pe site-urile oficiale.",
        "Deschide fișierele .PSD existente direct în GIMP — majoritatea straturilor se păstrează.",
        "Exportă în formate deschise (PNG, TIFF, ORA) ca să nu depinzi de un furnizor.",
        "Anulează abonamentul Adobe din contul tău după ce te-ai obișnuit cu fluxul nou.",
      ],
    },
  },
  {
    id: "office",
    paidName: "Microsoft 365 / Office",
    match: /microsoft|office 365|msft/i,
    alt: {
      name: "LibreOffice",
      url: "https://www.libreoffice.org",
      tagline: "Suită de birou completă: documente, foi de calcul, prezentări",
      benefits: [
        "0 lei cost de licență",
        "Deschide și salvează .docx, .xlsx, .pptx",
        "Funcționează complet offline — datele rămân la tine",
      ],
      migration: [
        "Descarcă LibreOffice de pe site-ul oficial (Windows, macOS, Linux).",
        "Deschide documentele tale existente — compatibilitatea cu formatele Microsoft e bună.",
        "Setează formatul implicit la ODF pentru independență totală, sau păstrează .docx pentru colaborare.",
      ],
    },
  },
  {
    id: "notion",
    paidName: "Notion",
    match: /notion/i,
    alt: {
      name: "AppFlowy",
      url: "https://appflowy.io",
      tagline: "Notițe și proiecte, open-source, cu datele la tine",
      benefits: [
        "Gratuit și open-source",
        "Datele stau local, nu pe serverele altcuiva",
        "Fără lock-in — export liber al datelor",
      ],
      migration: [
        "Instalează AppFlowy de pe site-ul oficial.",
        "Exportă din Notion (Settings → Export) ca Markdown & CSV.",
        "Importă arhiva în AppFlowy și verifică paginile importante.",
      ],
    },
  },
  {
    id: "passwords",
    paidName: "1Password / LastPass",
    match: /1password|lastpass|dashlane/i,
    alt: {
      name: "Bitwarden",
      url: "https://bitwarden.com",
      tagline: "Manager de parole open-source, auditat public",
      benefits: [
        "Plan gratuit generos, cod auditat public",
        "Poți găzdui singur serverul (self-host)",
        "Sincronizare pe toate dispozitivele",
      ],
      migration: [
        "Creează cont gratuit pe bitwarden.com.",
        "Exportă parolele din managerul actual (CSV) și importă-le în Bitwarden.",
        "Șterge fișierul CSV exportat după import și instalează extensia de browser.",
      ],
    },
  },
  {
    id: "dropbox",
    paidName: "Dropbox / iCloud",
    match: /dropbox|icloud|apple\.com/i,
    alt: {
      name: "Nextcloud",
      url: "https://nextcloud.com",
      tagline: "Cloud personal self-hostat — fișierele tale, serverul tău",
      benefits: [
        "Fără taxă lunară de stocare",
        "Control total asupra datelor (privacy)",
        "Aplicații de sincronizare pentru toate platformele",
      ],
      migration: [
        "Alege o găzduire Nextcloud sau instalează-l pe un mini-PC acasă.",
        "Instalează aplicația de sincronizare și mută folderele importante.",
        "Verifică backup-urile, apoi renunță la planul plătit de stocare.",
      ],
    },
  },
  {
    id: "zoom",
    paidName: "Zoom",
    match: /zoom\.us|zoom video/i,
    alt: {
      name: "Jitsi Meet",
      url: "https://meet.jit.si",
      tagline: "Apeluri video gratuite, fără cont, fără limită artificială",
      benefits: [
        "Gratuit, fără cont necesar",
        "Criptare și opțiune de self-hosting",
        "Fără limita de 40 de minute",
      ],
      migration: [
        "Deschide meet.jit.si și creează o cameră — atât, fără instalare.",
        "Trimite linkul participanților exact ca la Zoom.",
        "Pentru echipe: instalează Jitsi pe propriul server.",
      ],
    },
  },
  {
    id: "slack",
    paidName: "Slack",
    match: /slack/i,
    alt: {
      name: "Mattermost",
      url: "https://mattermost.com",
      tagline: "Chat de echipă open-source, self-hostat",
      benefits: [
        "Istoric complet al mesajelor, fără limita planului gratuit",
        "Datele echipei rămân pe serverul vostru",
        "Fără cost per utilizator la self-hosting",
      ],
      migration: [
        "Instalează Mattermost pe un server sau folosește varianta cloud.",
        "Importă canalele și istoricul din Slack cu instrumentul oficial de migrare.",
        "Invită echipa și setează integrările esențiale.",
      ],
    },
  },
  {
    id: "grammarly",
    paidName: "Grammarly",
    match: /grammarly/i,
    alt: {
      name: "LanguageTool",
      url: "https://languagetool.org",
      tagline: "Corectură gramaticală open-source, inclusiv în română",
      benefits: [
        "Variantă gratuită solidă, cod open-source",
        "Suport bun pentru limba română",
        "Poate rula local — textele tale nu pleacă la terți",
      ],
      migration: [
        "Instalează extensia de browser LanguageTool.",
        "Verifică setările de limbă (română + engleză).",
        "Anulează abonamentul Grammarly după o săptămână de utilizare paralelă.",
      ],
    },
  },
  {
    id: "canva",
    paidName: "Canva Pro",
    match: /canva/i,
    alt: {
      name: "Penpot",
      url: "https://penpot.app",
      tagline: "Design UI și grafică, open-source, în browser",
      benefits: [
        "Gratuit, fără plan plătit",
        "Formate deschise — fără lock-in",
        "Self-hosting disponibil pentru echipe",
      ],
      migration: [
        "Creează cont gratuit pe penpot.app (sau instalează-l local).",
        "Recreează șabloanele folosite des — componentele Penpot sunt flexibile.",
        "Exportă asset-urile din Canva ca SVG/PNG înainte de anulare.",
      ],
    },
  },
  {
    id: "chatgpt",
    paidName: "ChatGPT Plus",
    match: /openai|chatgpt/i,
    alt: {
      name: "Ollama (modele locale)",
      url: "https://ollama.com",
      tagline: "Modele AI care rulează pe calculatorul tău",
      benefits: [
        "0 lei abonament — rulează local",
        "Conversațiile nu pleacă de pe dispozitiv",
        "Modele deschise (Llama, Mistral, Qwen)",
      ],
      migration: [
        "Instalează Ollama de pe site-ul oficial.",
        "Descarcă un model potrivit calculatorului tău (ex. `ollama run llama3.1`).",
        "Păstrează planul plătit doar dacă ai nevoie de modelele cele mai puternice.",
      ],
    },
  },
];

/** Detectează abonamentele cu alternativă open-source: plătite în cel puțin 2 luni diferite. */
export function detecteazaSwaps(t: Tranzactie[]): Swap[] {
  return SWAPS.map((def) => {
    const plati = t.filter((x) => x.suma < 0 && def.match.test(x.descriere));
    const luni = new Set(plati.map((p) => p.data.slice(0, 7))).size;
    if (luni < 2) return null;
    const total = -plati.reduce((s, p) => s + p.suma, 0);
    const costLunar = Math.round((total / luni) * 100) / 100;
    return { ...def, costLunar, luni, annualSaved: Math.round(costLunar * 12) };
  })
    .filter((s): s is Swap => s !== null)
    .sort((a, b) => b.annualSaved - a.annualSaved);
}

const exemplu = (def: SwapDef, costLunar: number): Swap => ({
  ...def,
  costLunar,
  luni: 6,
  annualSaved: Math.round(costLunar * 12),
});

/** Date ilustrative folosite când utilizatorul nu are extras încărcat. */
export const EXAMPLE_SWAPS: Swap[] = [
  exemplu(SWAPS.find((s) => s.id === "adobe")!, 120),
  exemplu(SWAPS.find((s) => s.id === "office")!, 45),
  exemplu(SWAPS.find((s) => s.id === "notion")!, 50),
  exemplu(SWAPS.find((s) => s.id === "canva")!, 60),
];
