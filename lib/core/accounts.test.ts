import { describe, it, expect } from "vitest";
import { ACCOUNTS, accountStatus, nextStep, accountSummary, uncoveredConnections } from "./accounts";
import { CONNECTION_MAP } from "./connections";
import { CAPABILITIES } from "./capabilities";

describe("the grouping is honest, not cosmetic", () => {
  it("routes every connection through some account, hiding none", () => {
    // If a connection is not reachable through an account, grouping has quietly dropped it from the UI
    // rather than simplifying it. That would be the dishonest version of this change.
    expect(uncoveredConnections()).toEqual([]);
  });

  it("names only connections that actually exist", () => {
    const ids = new Set(CONNECTION_MAP.map((c) => c.id));
    for (const a of ACCOUNTS) {
      for (const c of a.covers) expect(ids.has(c), `account "${a.id}" covers unknown connection "${c}"`).toBe(true);
    }
  });

  it("never puts one connection under two accounts", () => {
    const seen = new Set<string>();
    for (const a of ACCOUNTS) {
      for (const c of a.covers) {
        expect(seen.has(c), `${c} is claimed by two accounts, so the count would double`).toBe(false);
        seen.add(c);
      }
    }
  });

  it("is genuinely fewer things than the raw list", () => {
    // The whole point. 19 capabilities collapse onto a number a person can hold in their head.
    expect(ACCOUNTS.length).toBeLessThan(CONNECTION_MAP.length / 2);
    expect(ACCOUNTS.length).toBeLessThanOrEqual(10);
  });

  it("explains each grouping rather than asserting it", () => {
    for (const a of ACCOUNTS) {
      expect(a.why.length, `${a.id} needs a reason it is one step`).toBeGreaterThan(30);
      expect(a.action.length).toBeGreaterThan(10);
      expect(a.signupUrl).toMatch(/^https:\/\//);
      expect(`${a.why} ${a.action}`, "no em-dashes in customer-facing prose").not.toMatch(/—/);
    }
  });
});

describe("account status reflects what is actually configured", () => {
  it("marks an account connected only when every connection it covers is present", () => {
    const partial = accountStatus(["database"]); // supabase also covers object-storage
    const supabase = partial.find((a) => a.id === "supabase")!;
    expect(supabase.connected).toBe(false);
    expect(supabase.missing).toEqual(["object-storage"]);

    const full = accountStatus(["database", "object-storage"]);
    expect(full.find((a) => a.id === "supabase")!.connected).toBe(true);
  });

  it("reports what one account would light up from here", () => {
    const s = accountStatus(["ai-model"]);
    const supabase = s.find((a) => a.id === "supabase")!;
    // From a model key alone, Supabase completes both persist and store in one signup.
    expect(supabase.unlocks).toEqual(expect.arrayContaining(["persist", "store"]));
  });

  it("counts accounts, not services, in the headline", () => {
    const summary = accountSummary(["ai-model"]);
    expect(summary.total).toBe(ACCOUNTS.length);
    expect(summary.connected).toBe(1);
    expect(summary.line).toMatch(/only the model key is ever required/i);
  });
});

describe("just-in-time consent: one next step, never a list", () => {
  it("returns a single account, not a checklist", () => {
    const step = nextStep(["ai-model"]);
    expect(step).not.toBeNull();
    expect(step!.account).toBeTruthy();
    expect(step!.because.length).toBeGreaterThan(10);
  });

  it("targets the account that a blocked capability actually needs", () => {
    const step = nextStep(["ai-model"], "persist");
    expect(step!.account.id).toBe("supabase");
    expect(step!.because).toMatch(/needs only this/i);
  });

  it("says honestly when one signup will NOT be enough", () => {
    // Deploy needs github AND hosting. Sending someone to Vercel without saying GitHub is also required
    // is how onboarding checklists lose people.
    const step = nextStep(["ai-model"], "deploy");
    expect(step).not.toBeNull();
    expect(step!.because).toMatch(/and then 1 more/i);
  });

  it("prefers the account that unlocks the most when nothing specific is blocked", () => {
    const step = nextStep(["ai-model"])!;
    const all = accountStatus(["ai-model"]).filter((a) => !a.connected);
    const best = Math.max(...all.map((a) => a.unlocks.length));
    expect(step.unlocks.length).toBe(best);
  });

  it("returns null when there is nothing left to connect", () => {
    const everything = CONNECTION_MAP.map((c) => c.id);
    expect(nextStep(everything)).toBeNull();
    expect(accountSummary(everything).line).toBe("Everything is connected.");
  });

  it("never suggests an account that is already connected", () => {
    let configured = ["ai-model"];
    for (let i = 0; i < ACCOUNTS.length + 2; i++) {
      const step = nextStep(configured);
      if (!step) break;
      expect(step.account.covers.some((c) => !configured.includes(c))).toBe(true);
      configured = [...configured, ...step.account.covers];
    }
  });

  it("walks a user from one key to fully connected without ever showing a list", () => {
    // The end-to-end shape of the new onboarding: repeated single steps, each explained.
    let configured: string[] = ["ai-model"];
    const steps: string[] = [];
    for (let i = 0; i < 20; i++) {
      const step = nextStep(configured);
      if (!step) break;
      steps.push(step.account.id);
      configured = [...configured, ...step.account.covers];
    }
    expect(steps.length).toBe(ACCOUNTS.length - 1); // all but the model key, which was already in
    expect(new Set(steps).size).toBe(steps.length); // never asks twice
    const live = CAPABILITIES.filter((c) => c.needs.every((n) => configured.includes(n)));
    expect(live.length).toBe(CAPABILITIES.length);
  });
});
