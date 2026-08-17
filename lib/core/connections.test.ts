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
  isConfigured,
  envRequirement,
} from "./connections";

describe("the 17-service connection map (CONNECT-FIRST-RESET §1)", () => {
  it("has exactly the doc's 17 entries, in doc order", () => {
    expect(CONNECTION_MAP.map((c) => c.id)).toEqual([
      // T0 · the brain + hands
      "ai-model", "github", "hosting", "database", "object-storage",
      // T1 · the voice
      "slack", "email-sending", "agent-inbox", "registrar",
      // T2 · the money
      "payments", "banking",
      // T3 · the senses
      "analytics", "error-uptime", "support-inbox", "crm", "calendar", "social", "ads", "cloudflare",
    ]);
    expect(CONNECTION_MAP).toHaveLength(19);
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

  it("requires exactly ONE customer connection to start, and it is the model", () => {
    // This replaces "every T0 entry is required." That invariant encoded the category error A1 fixed:
    // it treated what a SHIPPED PRODUCT needs (a repo, a host, a database) as what the ORG needs in
    // order to run at all. Only cognition is genuinely unsubstitutable, so only the model key blocks
    // the front door. Everything else gates a named capability in lib/core/capabilities.ts.
    const required = CONNECTION_MAP.filter((c) => c.required);
    expect(required.map((c) => c.id)).toEqual(["ai-model"]);
  });

  it("keeps every non-required connection honest about what it gates", () => {
    for (const c of CONNECTION_MAP) {
      if (c.required) continue;
      expect(c.degraded.trim().length, `${c.id} must say what is lost while absent`).toBeGreaterThan(0);
    }
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
    expect(connectionStatus("customer", {})).toHaveLength(19);
  });

  it("goLiveReadiness still math-checks: required = configured + pending", () => {
    const r = goLiveReadiness();
    expect(r.required).toBe(FOUNDER_GO_LIVE.length);
    expect(r.configured + r.pending.length).toBe(r.required);
  });
});

describe("detection cannot report connected when it is only half connected", () => {
  it("refuses to call the database connected on the service key alone", () => {
    // THE BUG THIS CLOSES, found by reading production: /connect said the database was CONNECTED because
    // detection was env.some() and SUPABASE_SERVICE_ROLE_KEY was set. The browser had no public URL, so
    // nobody could sign in. A false positive on the page whose whole job is to be honest.
    const db = CONNECTION_MAP.find((c) => c.id === "database")!;
    expect(isConfigured(db, { SUPABASE_SERVICE_ROLE_KEY: "svc" })).toBe(false);
    expect(isConfigured(db, { NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" })).toBe(false);
    // The anon key is what the BROWSER authenticates with. Omitting it from detection was the same false
    // positive one layer down: server-side reads work, sign-in does not.
    expect(isConfigured(db, { NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "svc" })).toBe(false);
    expect(isConfigured(db, {
      NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "svc",
    })).toBe(true);
  });

  it("keeps any-of where alternatives really are alternatives", () => {
    const model = CONNECTION_MAP.find((c) => c.id === "ai-model")!;
    expect(isConfigured(model, { GROQ_API_KEY: "g" })).toBe(true);
    expect(isConfigured(model, { ANTHROPIC_API_KEY: "a" })).toBe(true);
  });

  it("requires a complete pair per platform for social, matching what the executors demand", () => {
    const social = CONNECTION_MAP.find((c) => c.id === "social")!;
    expect(isConfigured(social, { BLUESKY_HANDLE: "h" })).toBe(false);
    expect(isConfigured(social, { BLUESKY_HANDLE: "h", BLUESKY_APP_PASSWORD: "p" })).toBe(true);
    expect(isConfigured(social, { MASTODON_BASE_URL: "u", MASTODON_ACCESS_TOKEN: "t" })).toBe(true);
    // One half of each platform is still nothing, however many vars are set.
    expect(isConfigured(social, { BLUESKY_HANDLE: "h", MASTODON_BASE_URL: "u" })).toBe(false);
  });

  it("treats an empty string as absent, which is a real deployment foot-gun", () => {
    const model = CONNECTION_MAP.find((c) => c.id === "ai-model")!;
    expect(isConfigured(model, { GROQ_API_KEY: "" })).toBe(false);
  });

  it("never guesses for items with no env detection", () => {
    for (const c of CONNECTION_MAP.filter((x) => x.env.length === 0)) {
      expect(isConfigured(c, { ANYTHING: "set" })).toBe(false);
    }
  });

  it("labels a group of halves as all-of rather than any-of", () => {
    const db = CONNECTION_MAP.find((c) => c.id === "database")!;
    const model = CONNECTION_MAP.find((c) => c.id === "ai-model")!;
    const social = CONNECTION_MAP.find((c) => c.id === "social")!;
    expect(envRequirement(db).label).toBe("set all of");
    expect(envRequirement(model).label).toBe("set any of");
    expect(envRequirement(social).label).toBe("set any complete group");
  });

  it("declares only env vars it also lists, so the UI and detection cannot diverge", () => {
    for (const c of CONNECTION_MAP) {
      for (const g of c.envGroups ?? []) {
        for (const e of g) expect(c.env, `${c.id} detects on ${e} without listing it`).toContain(e);
      }
    }
  });
});
