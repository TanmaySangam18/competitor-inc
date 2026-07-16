import { describe, it, expect } from "vitest";
import {
  CONNECTION_MAP,
  FOUNDER_GO_LIVE,
  CONNECTIONS,
  TIER_LABELS,
  TIER_ORDER,
  connectionStatus,
  connectionMapStatus,
  goLiveReadiness,
} from "./connections";

describe("the 17-service connection map (CONNECT-FIRST-RESET §1)", () => {
  it("has exactly the doc's 17 entries, in doc order", () => {
    expect(CONNECTION_MAP.map((c) => c.id)).toEqual([
      // T0 · the brain + hands
      "ai-model", "github", "hosting", "database",
      // T1 · the voice
      "slack", "email-sending", "registrar",
      // T2 · the money
      "payments", "banking",
      // T3 · the senses
      "analytics", "error-uptime", "support-inbox", "crm", "calendar", "social", "ads", "cloudflare",
    ]);
    expect(CONNECTION_MAP).toHaveLength(17);
  });

  it("ids are unique across the whole registry (map + founder go-live)", () => {
    const ids = CONNECTIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every entry carries the honest pair: non-empty unlocks + degraded", () => {
    for (const c of CONNECTIONS) {
      expect(c.unlocks.trim().length, `${c.id} unlocks`).toBeGreaterThan(0);
      expect(c.degraded.trim().length, `${c.id} degraded`).toBeGreaterThan(0);
    }
  });

  it("T0 map entries are required (day one); T1–T3 are optional", () => {
    for (const c of CONNECTION_MAP) expect(c.required, c.id).toBe(c.tier === "T0");
  });

  it("all four tiers are labeled and populated", () => {
    expect(TIER_ORDER).toEqual(["T0", "T1", "T2", "T3"]);
    for (const t of TIER_ORDER) {
      expect(TIER_LABELS[t].title.length).toBeGreaterThan(0);
      expect(TIER_LABELS[t].when.length).toBeGreaterThan(0);
      expect(CONNECTION_MAP.some((c) => c.tier === t), t).toBe(true);
    }
  });

  it("map entries are BYOK (owner: customer) with a consuming department", () => {
    expect(CONNECTION_MAP.every((c) => c.owner === "customer")).toBe(true);
    expect(CONNECTION_MAP.every((c) => c.department.length > 0)).toBe(true);
  });
});

describe("env-based detection — never faked", () => {
  it("nothing is connected in an empty environment", () => {
    expect(connectionMapStatus({}).every((c) => !c.configured)).toBe(true);
  });

  it("a present env var flips exactly its service to connected", () => {
    const s = connectionMapStatus({ GITHUB_TOKEN: "ghp_x" });
    expect(s.find((c) => c.id === "github")!.configured).toBe(true);
    expect(s.filter((c) => c.configured)).toHaveLength(1);
  });

  it("an empty-string env var does NOT count as connected", () => {
    expect(connectionMapStatus({ GITHUB_TOKEN: "" }).find((c) => c.id === "github")!.configured).toBe(false);
  });

  it("no-env entries are tracked-not-detected: configured false + a note, whatever the environment", () => {
    const s = connectionMapStatus({ ANYTHING: "set" });
    for (const id of ["registrar", "banking", "support-inbox", "cloudflare"]) {
      const c = s.find((x) => x.id === id)!;
      expect(c.configured, id).toBe(false);
      expect(c.note, id).toMatch(/tracked/i);
    }
  });

  it("detectable entries carry no tracked-note", () => {
    expect(connectionMapStatus({}).find((c) => c.id === "github")!.note).toBeUndefined();
  });
});

describe("founder go-live switch (kept API)", () => {
  it("connectionStatus splits owners; the founder switch is all-required; the customer set is the map", () => {
    const founder = connectionStatus("founder", {});
    expect(founder).toHaveLength(FOUNDER_GO_LIVE.length);
    expect(founder.every((c) => c.owner === "founder" && c.required)).toBe(true);
    expect(connectionStatus("customer", {})).toHaveLength(17);
  });

  it("goLiveReadiness still math-checks: required = configured + pending", () => {
    const r = goLiveReadiness();
    expect(r.required).toBe(FOUNDER_GO_LIVE.length);
    expect(r.configured + r.pending.length).toBe(r.required);
  });
});
