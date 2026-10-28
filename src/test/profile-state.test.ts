import { describe, expect, it } from "vitest";
import { nameOnlyProfile, profileState } from "@/lib/profile-state";

describe("three profile states", () => {
  it("signed-out visitor without a name sees authentication", () => { expect(profileState(false, null)).toBe("auth"); });
  it("signed-in visitor without a name sees the name-only screen", () => { expect(profileState(true, nameOnlyProfile("  "))).toBe("name"); });
  it("signed-in visitor with a name has a complete profile", () => { expect(profileState(true, nameOnlyProfile("Ștefan"))).toBe("complete"); });
  it("local demo needs only a name", () => {
    const profile = nameOnlyProfile("  Mihnea  ");
    expect(profile.nume).toBe("Mihnea");
    expect(profile.varsta).toBe(0);
    expect(profile.oras).toBe("");
    expect(profileState(false, profile)).toBe("complete");
  });
});