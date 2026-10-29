/** Verification is an editorial evidence record, never inferred from a URL/date. */
export type OfferStatus = "demo" | "verified" | "unverified";
export const EVIDENCE_TERMS = ["product", "rate_percent", "merchant_pattern", "merchant_rate_percent", "categories", "conditions", "monthly_cap_ron", "annual_cap_ron", "annual_fee_ron", "valid_from", "valid_until"] as const;
const BANK_DOMAINS: Record<string, string[]> = {
  "BCR": ["bcr.ro"], "Banca Transilvania": ["bancatransilvania.ro", "btdirect.ro"],
  "ING": ["ing.ro"], "ING Bank": ["ing.ro"], "Raiffeisen": ["raiffeisen.ro"], "Raiffeisen Bank": ["raiffeisen.ro"],
};
export function officialOfferUrl(value: string, bank: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password && u.pathname.replace(/\//g, "").length > 2
      && (BANK_DOMAINS[bank] ?? []).some((domain) => u.hostname === domain || u.hostname.endsWith(`.${domain}`));
  } catch { return false; }
}
export function validDay(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
type EvidenceOffer = { id: string; bank: string; conditions: string; source_url: string; verified_on: string; offer_status?: string; verification_evidence?: unknown; product: string; valid_from: string | null; valid_until: string | null; annual_fee_ron: number | null };
export function bankOfferStatus<T extends EvidenceOffer>(o: T, day: string): { status: OfferStatus; explanation: string } {
  if (o.offer_status === "demo" || o.id.startsWith("demo-") || /demo|simulat|inventat/i.test(o.conditions)) return { status: "demo", explanation: "Date simulate — produsul, procentele și condițiile sunt fictive, nu o ofertă a băncii." };
  const unverified = (explanation: string) => ({ status: "unverified" as const, explanation });
  if (!officialOfferUrl(o.source_url, o.bank)) return unverified("Neconfirmată — lipsește o sursă oficială relevantă; pagina principală a băncii nu dovedește oferta.");
  if (o.offer_status !== "verified") return unverified("Neconfirmată — termenii acestei oferte nu au dovezi de verificare în catalog.");
  if (!validDay(o.verified_on) || o.verified_on > day) return unverified("Neconfirmată — data verificării lipsește sau este invalidă.");
  if (!validDay(o.valid_from) || !validDay(o.valid_until) || o.valid_from > o.valid_until || typeof o.product !== "string" || !o.product.trim() || !o.conditions.trim() || o.annual_fee_ron === null) return unverified("Neconfirmată — produsul, condițiile, costurile sau perioada de valabilitate sunt incomplete.");
  if (o.valid_until < day) return unverified("Expirată — perioada de valabilitate declarată s-a încheiat; nu calculăm economii.");
  if (o.valid_from > day) return unverified("Inactivă — perioada de valabilitate declarată nu a început.");
  const evidence = o.verification_evidence;
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) return unverified("Neconfirmată — lipsesc dovezile pentru termenii specifici.");
  const records = evidence as Record<string, unknown>;
  for (const term of EVIDENCE_TERMS) {
    const item = records[term];
    if (!item || typeof item !== "object" || Array.isArray(item)) return unverified("Neconfirmată — lipsesc dovezi oficiale pentru produs, procente, condiții, limite, costuri sau valabilitate.");
    const entry = item as Record<string, unknown>;
    if (typeof entry['url'] !== "string" || !officialOfferUrl(entry['url'], o.bank) || typeof entry['excerpt'] !== "string" || !entry['excerpt'].trim() || JSON.stringify(entry['value']) !== JSON.stringify((o as unknown as Record<string, unknown>)[term])) return unverified("Neconfirmată — dovezile lipsesc sau nu corespund termenilor afișați.");
  }
  return { status: "verified", explanation: `Verificată cu dovezi pentru termenii specifici la ${o.verified_on}. Valabilitate: ${o.valid_from} – ${o.valid_until}.` };
}
export const statusLabel = (status: OfferStatus) => status === "demo" ? "DEMO · DATE SIMULATE" : status === "verified" ? "Verificată · dovezi disponibile" : "Neconfirmată";