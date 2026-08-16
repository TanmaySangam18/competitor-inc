import { describe, it, expect } from "vitest";
import { CAPABILITIES, MINIMUM_TO_START, capabilityStatus, nextBestConnection } from "./capabilities";
import { CONNECTION_MAP } from "./connections";

describe("the headline number: one key, not four", () => {
  it("requires exactly one customer connection to start", () => {
    // THE A1 assertion. This is the number we are worst on in the category, so it gets a test that
    // fails loudly rather than a comment that quietly rots back to four.
    const required = CONNECTION_MAP.filter((c) => c.required);
    expect(required.map((c) => c.id)).toEqual(["ai-model"]);
    expect(MINIMUM_TO_START).toEqual(["ai-model"]);
  });

  it("gives a working org from that one key", () => {
    const r = capabilityStatus(["ai-model"]);
    expect(r.ready).toBe(true);
    expect(r.live.map((c) => c.id)).toContain("think");
  });

  it("refuses to pretend it works with nothing", () => {
    const r = capabilityStatus([]);
    expect(r.ready).toBe(false);
    expect(r.live).toHaveLength(0);
    expect(r.headline).toMatch(/one model key/i);
  });
});

describe("every capability names its own connections", () => {
  it("points only at connections that actually exist in the map", () => {
    const ids = new Set(CONNECTION_MAP.map((c) => c.id));
    for (const c of CAPABILITIES) {
      for (const n of c.needs) expect(ids.has(n), `capability "${c.id}" needs unknown connection "${n}"`).toBe(true);
    }
  });

  it("always needs the model, because nothing happens without cognition", () => {
    for (const c of CAPABILITIES) expect(c.needs, `${c.id} should depend on the model`).toContain("ai-model");
  });

  it("carries both an honest promise and an honest absence", () => {
    for (const c of CAPABILITIES) {
      expect(c.gives.length).toBeGreaterThan(20);
      expect(c.without.length).toBeGreaterThan(20);
      // The dark line must describe a missing ABILITY, never a broken product.
      expect(c.without).not.toMatch(/\b(broken|error|failed|crash)\b/i);
    }
  });

  it("has no em-dashes, like every other customer-facing string here", () => {
    for (const c of CAPABILITIES) {
      expect(`${c.gives} ${c.without}`).not.toMatch(/—/);
    }
  });
});

describe("capability resolution", () => {
  it("lights a capability only when every connection it needs is present", () => {
    const partial = capabilityStatus(["ai-model", "github"]);
    expect(partial.live.map((c) => c.id)).toEqual(expect.arrayContaining(["think", "commit"]));
    expect(partial.dark.map((c) => c.id)).toContain("deploy"); // needs hosting too
  });

  it("reports exactly what is missing rather than a bare no", () => {
    const r = capabilityStatus(["ai-model", "github"]);
    const deploy = r.dark.find((c) => c.id === "deploy")!;
    expect(deploy.missing).toEqual(["hosting"]);
    expect(deploy.line).toBe(deploy.without);
  });

  it("prints the promise once a capability is live", () => {
    const r = capabilityStatus(["ai-model"]);
    const think = r.live.find((c) => c.id === "think")!;
    expect(think.line).toBe(think.gives);
    expect(think.missing).toHaveLength(0);
  });

  it("says so plainly when everything is connected", () => {
    const all = new Set(CAPABILITIES.flatMap((c) => c.needs));
    const r = capabilityStatus(all);
    expect(r.dark).toHaveLength(0);
    expect(r.headline).toBe("Every capability is live.");
  });
});

describe("the next connection to make is derived, not asserted", () => {
  it("suggests the key that finishes the most capabilities outright", () => {
    const next = nextBestConnection(["ai-model"]);
    expect(next).not.toBeNull();
    // From the model alone, github/database/object-storage/social/email/payments each complete exactly
    // one capability, so any is defensible; what matters is it never suggests one that leaves the
    // capability still dark.
    const r = capabilityStatus(["ai-model", next!.id]);
    for (const capId of next!.unlocks) {
      expect(r.live.map((c) => c.id), `${next!.id} was supposed to unlock ${capId}`).toContain(capId);
    }
  });

  it("never suggests a connection that leaves its capability still dark", () => {
    // Deploy needs github AND hosting. From the model alone, hosting must not be suggested for deploy.
    const next = nextBestConnection(["ai-model"]);
    expect(next!.unlocks).not.toContain("deploy");
  });

  it("returns nothing when there is nothing useful left to connect", () => {
    const all = new Set(CAPABILITIES.flatMap((c) => c.needs));
    expect(nextBestConnection(all)).toBeNull();
  });
});
