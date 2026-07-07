// MISSION INVARIANTS — one executable contract that locks the platform's non-negotiable guarantees so they
// can't silently regress as the code evolves. Each maps to a VISION/MISSION promise. (Per-module tests cover
// the details; this file is the single "these guarantees still hold" gate a reviewer can read in 30 seconds.)
import { describe, it, expect } from "vitest";
import { overHardCap, hardSpendCapCents } from "./spend-cap";
import { reviewGeneratedSite } from "./site-review";
import { mergeSyncState, type SyncState } from "./sync";
import { getProvider } from "./provider";
import { SECRET_PATTERNS } from "../../scripts/secret-patterns.mjs";
import type { Company } from "./types";

const empty: SyncState = { companies: [], activities: {}, approvals: {}, operate: {}, experiments: {} };

describe("MISSION INVARIANT — Gate 2: money is capped below the prompt", () => {
  it("with the default cap ($0), NO positive spend can move", () => {
    delete process.env.HARD_SPEND_CAP_CENTS;
    expect(hardSpendCapCents()).toBe(0);
    expect(overHardCap(1)).toBe(true);
    expect(overHardCap(5000)).toBe(true);
  });
});

describe("MISSION INVARIANT — no broken/fake artifact reaches a customer", () => {
  it("a 'coming soon' placeholder in app mode is always rejected (the Webory failure class)", () => {
    const r = reviewGeneratedSite({ "index.html": `<!doctype html><html><body><h1>Coming soon</h1><script>1</script></body></html>` }, "app");
    expect(r.ok).toBe(false);
  });
  it("a truncated build is rejected; a real interactive app passes", () => {
    expect(reviewGeneratedSite({ "index.html": `<!doctype html><html><body><div class="` }, "site").ok).toBe(false);
    expect(reviewGeneratedSite({ "index.html": `<!doctype html><html><body><h1>App</h1><div id="a"></div><script src="app.js"></script></body></html>`, "app.js": "1" }, "app").ok).toBe(true);
  });
});

describe("MISSION INVARIANT — company isolation / no data loss on reconcile", () => {
  it("a locally-created company is never dropped by a cloud sync, and deletes stay deleted", () => {
    const co = (id: string): Company => ({ id, night: 0 } as unknown as Company);
    const merged = mergeSyncState({ ...empty, companies: [co("local-only")] }, { ...empty, companies: [co("cloud")] });
    expect(merged.companies.map((c) => c.id).sort()).toEqual(["cloud", "local-only"]);
    const afterDelete = mergeSyncState({ ...empty, companies: [] }, { ...empty, companies: [co("gone")] }, ["gone"]);
    expect(afterDelete.companies).toHaveLength(0);
  });
});

describe("MISSION INVARIANT — honesty: a drafted shift moves no real money", () => {
  it("every simulated shift activity has cost 0 (no fabricated spend)", () => {
    const company = { id: "c", name: "X", idea: "an idea", slug: "x", night: 0, status: "operating", ledger: { spent: 0, credited: 0, tasksDone: 0, tasksFailed: 0 } } as unknown as Company;
    for (let i = 0; i < 20; i++) {
      const shift = getProvider().shift({ ...company, night: i } as Company);
      for (const a of shift.activities) expect(a.cost).toBe(0);
    }
  });
});

describe("MISSION INVARIANT — secret detection actually detects", () => {
  const match = (s: string) => SECRET_PATTERNS.some((p) => (p[1] as RegExp).test(s));
  it("flags planted key-shaped secrets", () => {
    // Built by concatenation so the source file contains no contiguous key literal (would trip our own scan).
    expect(match("sk-" + "ant-" + "A".repeat(24))).toBe(true);          // Anthropic
    expect(match("AIza" + "B".repeat(35))).toBe(true);                    // Google
    expect(match("gh" + "p_" + "C".repeat(36))).toBe(true);               // GitHub
    expect(match("eyJ" + "a".repeat(15) + "." + "b".repeat(25) + "." + "c".repeat(15))).toBe(true); // JWT
  });
  it("ignores ordinary prose and env-var names (no false positives)", () => {
    expect(match("Set ANTHROPIC_API_KEY and GITHUB_TOKEN in Vercel; ghp_x is too short.")).toBe(false);
  });
});
