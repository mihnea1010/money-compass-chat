import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UIMessage } from "ai";

type Threads = typeof import("@/lib/threads");

describe("conversație nouă", () => {
  let threads: Threads;

  beforeEach(async () => {
    localStorage.clear();
    vi.resetModules();
    threads = await import("@/lib/threads");
  });

  it("refolosește conversația goală în loc să facă una nouă", () => {
    const first = threads.createThread();
    const second = threads.createThread();
    expect(second).toBe(first);
    expect(JSON.parse(localStorage.getItem("clarai.threads.v1") || "[]")).toHaveLength(1);
  });

  it("face conversație nouă după ce prima are mesaje", () => {
    const first = threads.createThread();
    const msg = { id: "m1", role: "user", parts: [{ type: "text", text: "Salut" }] } as unknown as UIMessage;
    threads.saveMessages(first, [msg]);
    const second = threads.createThread();
    expect(second).not.toBe(first);
    expect(JSON.parse(localStorage.getItem("clarai.threads.v1") || "[]")).toHaveLength(2);
  });

  it("pune promptul trimis din Seif pe conversația goală existentă", () => {
    const first = threads.createThread();
    const second = threads.createThread("Trimite sumar anonimizat");
    expect(second).toBe(first);
    expect(threads.getThread(first)?.pendingPrompt).toBe("Trimite sumar anonimizat");
  });
});
