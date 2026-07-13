import { describe, it, expect } from "vitest";
import { SERVICES, listServices, getService } from "./services";
import { core } from "./index";

describe("service catalog", () => {
  it("exposes the six hire-able services with stable ids", () => {
    const ids = listServices().map((s) => s.id);
    expect(ids).toEqual([
      "build-run-sell",
      "growth",
      "support",
      "sales",
      "market-watch",
      "data-copilot",
    ]);
  });

  it("has exactly one flagship (build-run-sell)", () => {
    const flagships = SERVICES.filter((s) => s.flagship);
    expect(flagships).toHaveLength(1);
    expect(flagships[0].id).toBe("build-run-sell");
  });

  it("every service is complete and honestly statused", () => {
    for (const s of SERVICES) {
      expect(s.name.trim()).not.toBe("");
      expect(s.summary.trim()).not.toBe("");
      expect(s.does.length).toBeGreaterThan(0);
      expect(s.agents.length).toBeGreaterThan(0);
      expect(["ready", "partial", "planned"]).toContain(s.status);
    }
  });

  it("uses no emojis or pictographic symbols (founder rule)", () => {
    // Founder rule: no emojis / decorative symbols in the catalog (prose punctuation like — is fine).
    const text = JSON.stringify(SERVICES);
    expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it("getService finds by id and misses cleanly", () => {
    expect(getService("support")?.name).toBe("Customer support");
    expect(getService("nope")).toBeUndefined();
  });

  it("is reachable through the core façade", () => {
    expect(core.listServices()).toBe(SERVICES);
  });
});
