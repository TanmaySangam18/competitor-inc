import { describe, it, expect } from "vitest";
import { readIgnition, ignitionRoadmap, igniteCompanyZero, TENANT_ZERO } from "./ignition";
import type { RadarHit } from "./hackathon-radar";

const hit: RadarHit = {
  title: "AI Agents Challenge", url: "https://x.devpost.com", prizeUsd: 10000,
  online: true, openState: "open", submissionDates: "", source: "devpost",
};

// A fake Supabase covering exactly what ignition touches: the loops row + auth.admin.listUsers.
function fakeSb(opts: { loopRow?: unknown; users?: Array<{ id: string; email: string }> }) {
  const inserts: Record<string, unknown>[] = [];
  const sb = {
    from() { return this; },
    select() { return this; },
    eq() { return this; },
    async maybeSingle() { return { data: opts.loopRow ?? null, error: null }; },
    async insert(r: Record<string, unknown>) { inserts.push(r); return { error: null }; },
    auth: { admin: { async listUsers() { return { data: { users: opts.users ?? [] }, error: null }; } } },
  } as unknown as import("@supabase/supabase-js").SupabaseClient;
  return { sb, inserts };
}

const scanOk = async () => ({ ok: true as const, hits: [hit] });
const scanEmpty = async () => ({ ok: true as const, hits: [] as RadarHit[] });

describe("ignition (ADR-0021) — switches on → the company starts itself", () => {
  it("no model key → dark, nothing ignites", async () => {
    const { sb, inserts } = fakeSb({});
    const r = await igniteCompanyZero(sb, { env: {}, scan: scanEmpty, notify: async () => {} });
    expect(r.ignited).toBe(false);
    expect(r.detail).toMatch(/dark/);
    expect(inserts).toHaveLength(0);
  });

  it("reads the map honestly: model key arms cognition; social arms live marketing", () => {
    expect(readIgnition({}).ready).toBe(false);
    const r = readIgnition({ ANTHROPIC_API_KEY: "sk-x" });
    expect(r.ready).toBe(true);
    expect(r.armed).toContain("ai-model");
    expect(r.marketingLive).toBe(false);
    expect(readIgnition({ ANTHROPIC_API_KEY: "sk-x", BLUESKY_HANDLE: "a", BLUESKY_APP_PASSWORD: "b" }).marketingLive).toBe(true);
  });

  it("roadmap: marketing first always; a live hackathon becomes objective #2; degraded copy is honest", () => {
    const live = ignitionRoadmap({ ready: true, armed: [], dark: [], marketingLive: true }, hit);
    expect(live).toHaveLength(3);
    expect(live[0].goal).toMatch(/publish through the governed pipeline/);
    expect(live[1].goal).toMatch(/^WIN PLAN/);
    const degraded = ignitionRoadmap({ ready: true, armed: [], dark: [], marketingLive: false });
    expect(degraded).toHaveLength(2);
    expect(degraded[0].goal).toMatch(/queues for human approval/);
  });

  it("full ignition: founder found on the allow-list → the loop is born once, with the hackathon aboard", async () => {
    const { sb, inserts } = fakeSb({ users: [{ id: "f-1", email: "sangam.d@northeastern.edu" }] });
    let notified = "";
    const r = await igniteCompanyZero(sb, { env: { ANTHROPIC_API_KEY: "sk-x" }, scan: scanOk, notify: async (t) => { notified = t; } });
    expect(r.ignited).toBe(true);
    expect(inserts).toHaveLength(1);
    expect(inserts[0].tenant).toBe(TENANT_ZERO);
    expect(inserts[0].user_id).toBe("f-1");
    expect(notified).toMatch(/IGNITION/);
    expect(notified).toMatch(/degraded-but-honest/); // only the model key is armed — it says what's dark
  });

  it("idempotent: an existing loop means a cheap no-op, never a duplicate", async () => {
    const { sb, inserts } = fakeSb({ loopRow: { tenant: TENANT_ZERO, user_id: "f-1", state: {}, current_run_id: null }, users: [{ id: "f-1", email: "sangam.d@northeastern.edu" }] });
    const r = await igniteCompanyZero(sb, { env: { ANTHROPIC_API_KEY: "sk-x" }, scan: scanOk, notify: async () => {} });
    expect(r.ignited).toBe(false);
    expect(r.detail).toMatch(/already running/);
    expect(inserts).toHaveLength(0);
  });

  it("no founder account → no ignition (the loop must have an accountable owner)", async () => {
    const { sb, inserts } = fakeSb({ users: [{ id: "s-1", email: "stranger@example.com" }] });
    const r = await igniteCompanyZero(sb, { env: { ANTHROPIC_API_KEY: "sk-x" }, scan: scanEmpty, notify: async () => {} });
    expect(r.ignited).toBe(false);
    expect(inserts).toHaveLength(0);
  });
});
