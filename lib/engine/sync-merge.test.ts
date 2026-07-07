import { describe, it, expect } from "vitest";
import { mergeSyncState, type SyncState } from "./sync";
import type { Company, Activity, ApprovalItem } from "./types";

const co = (id: string, night = 0): Company => ({ id, night } as unknown as Company);
const act = (id: string): Activity => ({ id } as unknown as Activity);
const appr = (id: string): ApprovalItem => ({ id } as unknown as ApprovalItem);
const empty: SyncState = { companies: [], activities: {}, approvals: {}, operate: {}, experiments: {} };

describe("mergeSyncState — reconcile never loses data (R5)", () => {
  it("keeps a LOCAL-only company the cloud doesn't have yet (no data loss)", () => {
    const local: SyncState = { ...empty, companies: [co("local-only")], activities: { "local-only": [act("a1")] } };
    const cloud: SyncState = { ...empty, companies: [co("cloud-1")] };
    const m = mergeSyncState(local, cloud);
    expect(m.companies.map((c) => c.id).sort()).toEqual(["cloud-1", "local-only"]);
    expect(m.activities["local-only"]).toHaveLength(1); // its activities survive too
  });

  it("adds cloud-only companies", () => {
    const m = mergeSyncState(empty, { ...empty, companies: [co("cloud-1")] });
    expect(m.companies.map((c) => c.id)).toEqual(["cloud-1"]);
  });

  it("excludes tombstoned ids even if the cloud still has them (delete stays deleted)", () => {
    const m = mergeSyncState({ ...empty, companies: [co("keep")] }, { ...empty, companies: [co("deleted"), co("keep")] }, ["deleted"]);
    expect(m.companies.map((c) => c.id)).toEqual(["keep"]);
  });

  it("on a conflict, the version with MORE progress (higher night) wins", () => {
    const localAhead = mergeSyncState({ ...empty, companies: [co("x", 5)] }, { ...empty, companies: [co("x", 2)] });
    expect(localAhead.companies.find((c) => c.id === "x")!.night).toBe(5);
    const cloudAhead = mergeSyncState({ ...empty, companies: [co("x", 2)] }, { ...empty, companies: [co("x", 9)] });
    expect(cloudAhead.companies.find((c) => c.id === "x")!.night).toBe(9);
  });

  it("unions + dedupes per-company activity/approval lists by id", () => {
    const local: SyncState = { ...empty, companies: [co("c")], activities: { c: [act("a1"), act("shared")] }, approvals: { c: [appr("p1")] } };
    const cloud: SyncState = { ...empty, companies: [co("c")], activities: { c: [act("shared"), act("a2")] }, approvals: { c: [appr("p2")] } };
    const m = mergeSyncState(local, cloud);
    expect(m.activities["c"].map((a) => a.id).sort()).toEqual(["a1", "a2", "shared"]); // dup "shared" once
    expect(m.approvals["c"].map((a) => a.id).sort()).toEqual(["p1", "p2"]);
  });
});
