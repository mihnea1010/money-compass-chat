import { describe, expect, it, vi, beforeEach } from "vitest";

const { deleteUser, getUser } = vi.hoisted(() => ({ deleteUser: vi.fn(), getUser: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({ middleware: () => ({ handler: (fn: (input: unknown) => unknown) => fn }) }),
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { auth: { admin: { deleteUser } } } }));
import { deleteOwnAccount } from "@/lib/account.functions";

// The mocked builder exposes the actual handler without an HTTP transport.
const invoke = deleteOwnAccount as unknown as (input: { context: { userId: string; supabase: { auth: { getUser: typeof getUser } } } }) => Promise<{ deleted: boolean }>;
const input = { context: { userId: "caller-id", supabase: { auth: { getUser } } } };
beforeEach(() => vi.resetAllMocks());
describe("self account deletion", () => {
  it("deletes only the validated caller", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "caller-id" } }, error: null });
    deleteUser.mockResolvedValue({ error: null });
    expect(await invoke(input)).toEqual({ deleted: true });
    expect(deleteUser).toHaveBeenCalledExactlyOnceWith("caller-id");
  });
  it("cannot delete when validated identity differs", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "other-id" } }, error: null });
    await expect(invoke(input)).rejects.toThrow();
    expect(deleteUser).not.toHaveBeenCalled();
  });
  it("rejects a revoked or missing session before privileged work", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error("revoked") });
    await expect(invoke(input)).rejects.toThrow();
    expect(deleteUser).not.toHaveBeenCalled();
  });
});