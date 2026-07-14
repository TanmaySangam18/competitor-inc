import { describe, it, expect } from "vitest";
import { buildOrgPlan, renderOrgChain } from "./org-plan";
import { orderTasks } from "./task-queue";
import { AGENTS, type AgentRole } from "./types";
import { getRole, validateOrg } from "@/lib/org/organization";

const byId = (tasks: ReturnType<typeof buildOrgPlan>) => Object.fromEntries(tasks.map((t) => [t.id, t]));

describe("org-plan — hierarchical DAG from the real org chart", () => {
  it("the org chart it reads from is structurally sound", () => {
    expect(validateOrg()).toEqual([]);
  });

  it("core plan is a valid, acyclic DAG (orderTasks does not throw)", () => {
    const tasks = buildOrgPlan("a tutoring marketplace");
    expect(() => orderTasks(tasks)).not.toThrow();
    expect(tasks.length).toBeGreaterThan(0);
  });

  it("every task maps to a real engine role AND a real org position", () => {
    const tasks = buildOrgPlan("x", { operate: true });
    for (const t of tasks) {
      expect(t.role in AGENTS, `role ${t.role}`).toBe(true);
      expect(getRole(t.orgRoleId!), `org role ${t.orgRoleId}`).toBeDefined();
      // the engine role a task runs as MUST equal the org position's declared execFn (no drift)
      expect(t.role).toBe(getRole(t.orgRoleId!)!.execFn);
    }
  });

  it("the build rolls up the visible IC → lead → manager chain", () => {
    const t = byId(buildOrgPlan("x"));
    expect(t["build-ic"].orgTitle).toBe("Backend Engineer");
    expect(t["build-ic"].orgLevel).toBe("ic");
    expect(t["build-review"].orgTitle).toBe("Engineering Lead");
    expect(t["build-review"].orgLevel).toBe("director");
    expect(t["build-signoff"].orgTitle).toBe("Chief of Staff");
    // the chain is wired by dependencies: ic → review → signoff
    expect(t["build-review"].blockingOn).toContain("build-ic");
    expect(t["build-signoff"].blockingOn).toContain("build-review");
    // and each names who it rolls up to
    expect(t["build-ic"].reportsToTitle).toBe("Engineering Lead");
  });

  it("every task is independently verified — never self-graded by the same position", () => {
    for (const t of buildOrgPlan("x", { operate: true })) {
      expect(t.verifierOrgRoleId, `verifier for ${t.id}`).toBeTruthy();
      expect(t.verifierOrgRoleId).not.toBe(t.orgRoleId);
      expect(getRole(t.verifierOrgRoleId!), `verifier ${t.verifierOrgRoleId} exists`).toBeDefined();
    }
  });

  it("the build review is checked cross-department by Quality (real independence)", () => {
    const t = byId(buildOrgPlan("x"));
    expect(t["build-review"].verifierOrgRoleId).toBe("qa-lead");
    expect(getRole("qa-lead")!.department).not.toBe(getRole("engineering-lead")!.department);
  });

  it("operate adds launch/support/monetize/comply, each gated on a verified product", () => {
    const core = buildOrgPlan("x");
    const full = buildOrgPlan("x", { operate: true });
    expect(full.length).toBeGreaterThan(core.length);
    const t = byId(full);
    const tail = "build-signoff"; // core ends at the sign-off → quality → operate
    // operate stages depend (transitively) on the completed core; none run before there's a product
    for (const id of ["launch", "care", "monetize", "comply"]) {
      expect(t[id], id).toBeDefined();
      expect(t[id].blockingOn.length).toBeGreaterThan(0);
    }
    // sanity: the core still topo-sorts with operate appended
    expect(() => orderTasks(full)).not.toThrow();
    expect(t["quality"].blockingOn).toContain(tail);
  });

  it("founder-gated acts escalate — never auto-fire", () => {
    const t = byId(buildOrgPlan("x", { operate: true }));
    expect(t["launch"].deskAct?.kind).toBe("approve_publish");
    expect(t["monetize"].deskAct?.kind).toBe("move_money");
    expect(t["comply"].deskAct?.kind).toBe("sign_contract");
    // core build/spec steps do NOT carry a founder gate (they're internal work)
    expect(t["build-ic"].deskAct).toBeUndefined();
    expect(t["spec"].deskAct).toBeUndefined();
  });

  it("renders the chain as human-readable Glass Box lines", () => {
    const lines = renderOrgChain(buildOrgPlan("a CRM", { operate: true }));
    expect(lines.some((l) => l.includes("Backend Engineer"))).toBe(true);
    expect(lines.some((l) => l.includes("escalates to founder"))).toBe(true);
  });
});
