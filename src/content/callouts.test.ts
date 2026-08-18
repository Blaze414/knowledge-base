import { describe, it, expect } from "vitest";
import { callouts, getCallout } from "./callouts";

describe("callouts registry", () => {
  it("returns a registered callout with kind + text", () => {
    const c = getCallout("lucy-football");
    expect(c).toBeDefined();
    expect(c?.kind).toBe("WARNING");
    expect(c?.text).toMatch(/football/i);
  });

  it("returns undefined for unknown keys", () => {
    expect(getCallout("does-not-exist")).toBeUndefined();
  });

  it("only uses NOTE or WARNING kinds", () => {
    for (const [key, c] of Object.entries(callouts)) {
      expect(["NOTE", "WARNING"], `callout ${key}`).toContain(c.kind);
      expect(c.text.trim().length, `callout ${key}`).toBeGreaterThan(0);
    }
  });
});
