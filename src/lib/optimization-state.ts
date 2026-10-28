import { z } from "zod";

export const optimizationSettingsSchema = z.object({
  localTaxRon: z.number().min(0).max(1000000).default(0),
  localDiscountPercent: z.number().min(0).max(10).default(0),
  pensionContributionEur: z.number().min(0).max(100000).default(0),
  eurRon: z.number().min(0).max(100).default(0),
  employee: z.boolean().default(false),
  cards: z.array(z.enum(["bcr", "direct", "flying"])).default([]),
  bcrEligibleVolume: z.number().min(0).max(1000000).default(0),
  creditDueRon: z.number().min(0).max(1000000).default(0),
  creditDueDate: z.string().default(""),
  directAnnualCostRon: z.number().min(0).max(1000000).nullable().default(null),
  repayInFull: z.boolean().default(false),
});
export type OptimizationSettings = z.infer<typeof optimizationSettingsSchema>;
export const EMPTY_SETTINGS = optimizationSettingsSchema.parse({});
export type OptimizationRecord = { id: string; year: number; status: "completed" | "dismissed"; realizedRon: number };
const recordSchema = z.object({ id: z.string(), year: z.number().int(), status: z.enum(["completed", "dismissed"]), realizedRon: z.number().min(0) });
const stateSchema = z.object({ settings: optimizationSettingsSchema, records: z.array(recordSchema) });
export type OptimizationState = z.infer<typeof stateSchema>;
const KEY = "clarai.optimizations.v1";
export function loadOptimizationState(): OptimizationState {
  try { return stateSchema.parse(JSON.parse(localStorage.getItem(KEY) ?? "null")); }
  catch { return { settings: { ...EMPTY_SETTINGS, cards: [] }, records: [] }; }
}
export function saveOptimizationState(state: OptimizationState) {
  localStorage.setItem(KEY, JSON.stringify(stateSchema.parse(state)));
}
export function recordOptimization(records: OptimizationRecord[], record: OptimizationRecord) {
  return [...records.filter((r) => r.id !== record.id || r.year !== record.year), record];
}
export function realizedTotal(records: OptimizationRecord[], year: number) {
  return records.filter((r) => r.year === year && r.status === "completed").reduce((s, r) => s + r.realizedRon, 0);
}
export function localTaxSaving(amount: number, discountPercent: number) {
  return Math.round(Math.max(0, amount) * Math.min(10, Math.max(0, discountPercent))) / 100;
}
export function pensionTaxSaving(contributionEur: number, eurRon: number) {
  return Math.round(Math.min(400, Math.max(0, contributionEur)) * Math.max(0, eurRon) * 10) / 100;
}
export function deadlinePassed(date: Date, month: number, day: number) {
  // Calendar dates in Romania, inclusive deadline day.
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const currentMonth = Number(parts.find((p) => p.type === "month")?.value);
  const currentDay = Number(parts.find((p) => p.type === "day")?.value);
  return currentMonth > month || (currentMonth === month && currentDay > day);
}