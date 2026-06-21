import { describe, it, expect } from "vitest";
import { diffStore, isEmptyOps, type SyncState } from "./sync";
import type { Activity, ApprovalItem, Company } from "./types";

function co(over: Partial<Company> = {}): Company {
  return {
    id: "c1",
    name: "Testly",
    slug: "testly",
    idea: "an idea",
    createdAt: 0,
    status: "validating",
    night: 0,
    ledger: { spent: 0, credited: 0, tasksDone: 0, tasksFailed: 0 },
    ...over,
  };
}
function act(over: Partial<Activity> = {}): Activity {
  return { id: "a1", night: 1, agent: "engineering", action: "Shipped", cost: 0.2, status: "done", ...over };
}
function appr(over: Partial<ApprovalItem> = {}): ApprovalItem {
  return { id: "p1", night: 1, agent: "marketing", kind: "spend", title: "Scale ads", detail: "", ...over };
}
const state = (over: Partial<SyncState> = {}): SyncState => ({ companies: [], activities: {}, approvals: {}, operate: {}, ...over });

describe("diffStore — centralized write-through delta", () => {
  it("no change → empty ops", () => {
    const s = state({ companies: [co()], activities: { c1: [act()] }, approvals: { c1: [appr()] } });
    expect(isEmptyOps(diffStore(s, s))).toBe(true);
  });

  it("detects a new company (and its activities as inserts)", () => {
    const next = state({ companies: [co()], activities: { c1: [act()] } });
    const ops = diffStore(state(), next);
    expect(ops.createCompanies.map((c) => c.id)).toEqual(["c1"]);
    expect(ops.insertActivities).toEqual([{ companyId: "c1", items: [act()] }]);
  });

  it("detects a changed company as an update, not a create", () => {
    const prev = state({ companies: [co({ status: "validating" })] });
    const next = state({ companies: [co({ status: "operating", night: 1 })] });
    const ops = diffStore(prev, next);
    expect(ops.createCompanies).toHaveLength(0);
    expect(ops.updateCompanies.map((c) => c.id)).toEqual(["c1"]);
  });

  it("appends only the new activities, not the existing ones", () => {
    const prev = state({ companies: [co()], activities: { c1: [act({ id: "a1" })] } });
    const next = state({ companies: [co()], activities: { c1: [act({ id: "a2" }), act({ id: "a1" })] } });
    const ops = diffStore(prev, next);
    expect(ops.insertActivities).toEqual([{ companyId: "c1", items: [act({ id: "a2" })] }]);
  });

  it("flags an undone activity (false → true) without re-inserting it", () => {
    const prev = state({ companies: [co()], activities: { c1: [act({ id: "a1", undone: false })] } });
    const next = state({ companies: [co()], activities: { c1: [act({ id: "a1", undone: true })] } });
    const ops = diffStore(prev, next);
    expect(ops.undoActivities).toEqual(["a1"]);
    expect(ops.insertActivities).toHaveLength(0);
  });

  it("flags a resolved approval once, and inserts brand-new approvals", () => {
    const prev = state({ companies: [co()], approvals: { c1: [appr({ id: "p1" })] } });
    const next = state({
      companies: [co()],
      approvals: { c1: [appr({ id: "p2" }), appr({ id: "p1", resolved: "approved" })] },
    });
    const ops = diffStore(prev, next);
    expect(ops.insertApprovals).toEqual([{ companyId: "c1", items: [appr({ id: "p2" })] }]);
    expect(ops.resolveApprovals).toEqual([{ id: "p1", resolved: "approved" }]);
  });

  it("does not re-resolve an approval already resolved in the snapshot", () => {
    const prev = state({ companies: [co()], approvals: { c1: [appr({ id: "p1", resolved: "approved" })] } });
    const next = state({ companies: [co()], approvals: { c1: [appr({ id: "p1", resolved: "approved" })] } });
    expect(diffStore(prev, next).resolveApprovals).toHaveLength(0);
  });

  it("upserts the rocks list when it changes (add + toggle), with no deletes", () => {
    const prev = state({ companies: [co()], operate: { c1: { rocks: [{ id: "r1", title: "Ship v1", done: false }], issues: [] } } });
    const next = state({
      companies: [co()],
      operate: { c1: { rocks: [{ id: "r1", title: "Ship v1", done: true }, { id: "r2", title: "150 members", done: false }], issues: [] } },
    });
    const ops = diffStore(prev, next);
    expect(ops.upsertRocks).toEqual([{ companyId: "c1", rocks: next.operate.c1.rocks }]);
    expect(ops.deleteRockIds).toHaveLength(0);
  });

  it("deletes a removed rock (and skips upsert when the list is now empty)", () => {
    const prev = state({ companies: [co()], operate: { c1: { rocks: [{ id: "r1", title: "Ship v1", done: false }], issues: [] } } });
    const next = state({ companies: [co()], operate: { c1: { rocks: [], issues: [] } } });
    const ops = diffStore(prev, next);
    expect(ops.deleteRockIds).toEqual(["r1"]);
    expect(ops.upsertRocks).toHaveLength(0);
  });

  it("upserts issues on a resolve flip; unchanged operate → empty ops", () => {
    const base = { rocks: [], issues: [{ id: "i1", title: "Churn high", resolved: false }] };
    const prev = state({ companies: [co()], operate: { c1: base } });
    const next = state({ companies: [co()], operate: { c1: { rocks: [], issues: [{ id: "i1", title: "Churn high", resolved: true }] } } });
    const ops = diffStore(prev, next);
    expect(ops.upsertIssues).toEqual([{ companyId: "c1", issues: next.operate.c1.issues }]);
    expect(isEmptyOps(diffStore(prev, prev))).toBe(true);
  });
});
