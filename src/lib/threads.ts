import { useSyncExternalStore } from "react";
import type { UIMessage } from "ai";

export type Thread = {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
  pendingPrompt?: string | undefined;
};

const KEY = "clarai.threads.v1";
const EMPTY: Thread[] = [];
let cache: Thread[] | null = null;
const listeners = new Set<() => void>();

function read(): Thread[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || "[]") as Thread[];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: Thread[]) {
  cache = [...next].sort((a, b) => b.updatedAt - a.updatedAt);
  localStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((l) => l());
}

export function useThreads() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => EMPTY,
  );
}

export function getThread(id: string) {
  return read().find((t) => t.id === id);
}

export function createThread(pendingPrompt?: string): string {
  const threads = read();
  // Reuse a conversation that's still blank instead of piling up empty ones.
  const blank = threads.find((t) => t.messages.length === 0 && !t.pendingPrompt);
  if (blank) {
    write([
      { ...blank, title: "Conversație nouă", updatedAt: Date.now(), pendingPrompt },
      ...threads.filter((x) => x.id !== blank.id),
    ]);
    return blank.id;
  }
  const id = crypto.randomUUID().slice(0, 8);
  write([{ id, title: "Conversație nouă", updatedAt: Date.now(), messages: [], pendingPrompt }, ...threads]);
  return id;
}

export function saveMessages(id: string, messages: UIMessage[]) {
  const threads = read();
  const t = threads.find((x) => x.id === id);
  const firstText = messages
    .find((m) => m.role === "user")
    ?.parts.find((p) => p.type === "text") as { text: string } | undefined;
  const title = firstText ? firstText.text.slice(0, 48) : "Conversație nouă";
  const updated: Thread = { ...(t ?? { id, updatedAt: 0, messages: [] }), title, messages, updatedAt: Date.now() };
  write([updated, ...threads.filter((x) => x.id !== id)]);
}

export function clearPending(id: string) {
  write(read().map((t) => (t.id === id ? { ...t, pendingPrompt: undefined } : t)));
}

export function deleteThread(id: string) {
  write(read().filter((t) => t.id !== id));
}
