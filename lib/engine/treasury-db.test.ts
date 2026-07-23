import { describe, it, expect, vi } from "vitest";
import { gateSpend } from "./treasury-db";
import { killSwitch } from "@/lib/core/killswitch";

// A tiny fake Supabase: envelope row is configurable; upsert is captured.
function fakeSb(row: { monthly_cap_usd: number; spent_this_month_usd: number; month_key: string } | null) {
  const upserts: Record<string, unknown>[] = [];
  const sb = {
    from() { return this; },
    select() { return this; },
    eq() { return this; },
    async maybeSingle() { return { data: row }; },
    async upsert(r: Record<string, unknown>) { upserts.push(r); return { error: null }; },
  } as unknown as import("@supabase/supabase-js").SupabaseClient;
  return { sb, upserts };
}

const NOW = Date.UTC(2026, 6, 23);

describe("treasury-db — the governed spend gate (ADR-0020)", () => {
  it("in-budget debit → allow + records the debit", async () => {
    const { sb, upserts } = fakeSb({ monthly_cap_usd: 100, spent_this_month_usd: 10, month_key: "2026-07" });
    const r = await gateSpend(sb, { userId: "u1", department: "growth", amountUsd: 20, memo: "ad" }, { now: NOW });
    expect(r.allow).toBe(true);
    expect(upserts).toHaveLength(1);
    expect(upserts[0].spent_this_month_usd).toBe(30);
  });
  it("over-budget debit → NOT allowed, nothing recorded", async () => {
    const { sb, upserts } = fakeSb({ monthly_cap_usd: 100, spent_this_month_usd: 95, month_key: "2026-07" });
    const r = await gateSpend(sb, { userId: "u1", department: "growth", amountUsd: 20, memo: "ad" }, { now: NOW });
    expect(r.allow).toBe(false);
    expect(upserts).toHaveLength(0);
  });
  it("no envelope row (cap 0) → nothing auto-spends", async () => {
    const { sb } = fakeSb(null);
    const r = await gateSpend(sb, { userId: "u1", department: "growth", amountUsd: 5, memo: "x" }, { now: NOW });
    expect(r.allow).toBe(false);
  });
  it("stale month key resets spend (so a fresh month's budget is available)", async () => {
    const { sb } = fakeSb({ monthly_cap_usd: 100, spent_this_month_usd: 99, month_key: "2026-06" });
    const r = await gateSpend(sb, { userId: "u1", department: "growth", amountUsd: 40, memo: "x" }, { now: NOW });
    expect(r.allow).toBe(true); // June spend doesn't count against July
  });
  it("kill switch → blocked before the envelope is even read", async () => {
    killSwitch.engageGlobal();
    try {
      const { sb, upserts } = fakeSb({ monthly_cap_usd: 100, spent_this_month_usd: 0, month_key: "2026-07" });
      const r = await gateSpend(sb, { userId: "u1", department: "growth", amountUsd: 5, memo: "x" }, { now: NOW });
      expect(r.allow).toBe(false);
      expect(upserts).toHaveLength(0);
    } finally { killSwitch.disengageGlobal(); }
  });
});
