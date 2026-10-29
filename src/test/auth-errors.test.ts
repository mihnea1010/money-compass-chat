import { describe, expect, it } from "vitest";
import { authErrorMessage, isObfuscatedDuplicate } from "@/lib/auth-errors";

describe("authErrorMessage", () => {
  it("explains weak (leaked) passwords on signup", () => {
    expect(authErrorMessage("up", { code: "weak_password", status: 422 })).toMatch(/ușor de ghicit/);
    expect(authErrorMessage("up", { status: 422, message: "Password is known to be weak and easy to guess" })).toMatch(/ușor de ghicit/);
  });
  it("explains duplicate email", () => {
    expect(authErrorMessage("up", { code: "user_already_exists" })).toMatch(/Există deja un cont/);
  });
  it("explains invalid email", () => {
    expect(authErrorMessage("up", { code: "email_address_invalid" })).toMatch(/nu pare validă/);
  });
  it("explains unconfirmed email on sign-in", () => {
    expect(authErrorMessage("in", { code: "email_not_confirmed" })).toMatch(/Confirmă/);
  });
  it("never leaks unknown backend text", () => {
    expect(authErrorMessage("up", { code: "x", message: "db secret detail" })).not.toMatch(/secret/);
  });
  it("detects obfuscated duplicate signups", () => {
    expect(isObfuscatedDuplicate({ identities: [] })).toBe(true);
    expect(isObfuscatedDuplicate({ identities: [{}] })).toBe(false);
  });
});
