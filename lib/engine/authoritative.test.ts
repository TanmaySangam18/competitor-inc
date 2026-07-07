import { describe, it, expect } from "vitest";
import fc from "fast-check";
import type { SupabaseClient } from "@supabase/supabase-js";
import { shouldUploadMigrate, uploadLocalToDb, reconcileRealtime, applyOptimisticThenPersist } from "./authoritative";
import { diffStore, EMPTY_STATE, type SyncState } from "./sync";
import type { Company, Activity, ApprovalItem } from "./types";

const co = (id: string, night = 0): Company => ({ id, night } as unknown as Company);
const act = (id: string): Activity => ({ id } as unknown as Activity);
const appr = (id: string): ApprovalItem => ({ id } as unknown as ApprovalItem);
const empty: SyncState = { companies: [], activities: {}, approvals: {}, operate: {}, experiments: {} };

describe("shouldUploadMigrate — one-time no-loss upload trigger", () => {
  it("true only when the DB is empty and local has companies", () => {
    expect(shouldUploadMigrate(empty, { ...empty, companies: [co("a")] })).toBe(true);
    expect(shouldUploadMigrate({ ...empty, companies: [co("x")] }, { ...empty, companies: [co("a")] })).toBe(false);
    expect(shouldUploadMigrate(empty, empty)).toBe(false);
    expect(shouldUploadMigrate({ ...empty, companies: [co("x")] }, empty)).toBe(false);
  });
  it("property: triggers iff cloud has 0 companies AND local has ≥1", () => {
    fc.assert(
      fc.property(fc.nat({ max: 5 }), fc.nat({ max: 5 }), (nCloud, nLocal) => {
        const cloud: SyncState = { ...empty, companies: Array.from({ length: nCloud }, (_, i) => co("c" + i)) };
        const local: SyncState = { ...empty, companies: Array.from({ length: nLocal }, (_, i) => co("l" + i)) };
        expect(shouldUploadMigrate(cloud, local)).toBe(nCloud === 0 && nLocal > 0);
      }),
    );
  });
});

describe("uploadLocalToDb — no data loss (every local entity becomes a write op)", () => {
  // uploadLocalToDb = applyOps(diffStore(EMPTY_STATE, local)). The no-loss guarantee is that diffing against
  // an empty DB creates every company and inserts every activity/approval — asserted on that diff.
  it("diff against empty DB covers every company + activity + approval id", () => {
    const local: SyncState = {
      ...empty,
      companies: [co("c1"), co("c2")],
      activities: { c1: [act("a1"), act("a2")], c2: [act("a3")] },
      approvals: { c1: [appr("p1")], c2: [appr("p2"), appr("p3")] },
    };
    const ops = diffStore(EMPTY_STATE, local);
    expect(ops.createCompanies.map((c) => c.id).sort()).toEqual(["c1", "c2"]);
    expect(ops.insertActivities.flatMap((g) => g.items.map((a) => a.id)).sort()).toEqual(["a1", "a2", "a3"]);
    expect(ops.insertApprovals.flatMap((g) => g.items.map((a) => a.id)).sort()).toEqual(["p1", "p2", "p3"]);
  });
  it("property: ∀ local, the set of company ids uploaded == the set in local", () => {
    // Ids are UUID-shaped in-app (rid()); generate realistic ids rather than adversarial prototype keys
    // like "valueOf" (plain-object maps in diffStore are only ever keyed by real UUIDs).
    fc.assert(
      fc.property(fc.uniqueArray(fc.uuid(), { maxLength: 6 }), (ids) => {
        const ops = diffStore(EMPTY_STATE, { ...empty, companies: ids.map((id) => co(id)) });
        expect(new Set(ops.createCompanies.map((c) => c.id))).toEqual(new Set(ids));
      }),
    );
  });
  it("resolves (never throws) even if the underlying writes fail — applyOps guards each op", async () => {
    const sb = { from: () => { throw new Error("stub-write-fail"); } } as unknown as SupabaseClient;
    await expect(uploadLocalToDb(sb, "u1", { ...empty, companies: [co("c1")], activities: { c1: [act("a1")] } })).resolves.toBeUndefined();
  });
});

describe("reconcileRealtime — cron/realtime events merge without loss", () => {
  it("a cron-shaped event (higher night + new activities) wins on night and unions activities", () => {
    const current: SyncState = { ...empty, companies: [co("c", 3)], activities: { c: [act("day-1")] } };
    const incoming: SyncState = { ...empty, companies: [co("c", 4)], activities: { c: [act("night-4")] } };
    const m = reconcileRealtime(current, incoming);
    expect(m.companies.find((c) => c.id === "c")!.night).toBe(4);
    expect(m.activities["c"].map((a) => a.id).sort()).toEqual(["day-1", "night-4"]);
  });
  it("a self-echo (same ids, same night) is a no-op", () => {
    const s: SyncState = { ...empty, companies: [co("c", 2)], activities: { c: [act("a1")] } };
    const m = reconcileRealtime(s, s);
    expect(m.companies).toHaveLength(1);
    expect(m.activities["c"].map((a) => a.id)).toEqual(["a1"]);
  });
  it("honors tombstones (a deleted company isn't resurrected by an incoming event)", () => {
    const m = reconcileRealtime({ ...empty, companies: [] }, { ...empty, companies: [co("gone")] }, ["gone"]);
    expect(m.companies).toHaveLength(0);
  });
});

describe("applyOptimisticThenPersist — optimistic apply + rollback on failure", () => {
  it("on persist success, keeps the optimistic value (applied once)", async () => {
    const applied: number[] = [];
    const r = await applyOptimisticThenPersist(1, (n) => n + 1, async () => {}, (n) => applied.push(n));
    expect(r.ok).toBe(true);
    expect(applied).toEqual([2]); // optimistic only, no rollback
  });
  it("on persist failure, reverts to the EXACT pre-mutation snapshot + returns the error", async () => {
    const applied: number[] = [];
    const err = new Error("write failed");
    const r = await applyOptimisticThenPersist(1, (n) => n + 1, async () => { throw err; }, (n) => applied.push(n));
    expect(r.ok).toBe(false);
    expect(r.error).toBe(err);
    expect(applied).toEqual([2, 1]); // optimistic, then rolled back to the snapshot
  });
});
