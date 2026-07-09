import { describe, it, expect } from "vitest";
import { mobilize } from "./kickoff";
import { ROLES, DEPARTMENTS } from "./organization";

describe("kickoff — company-wide mobilization from one brief", () => {
  const k = mobilize("A body-doubling focus room for Northeastern students");

  it("mobilizes EVERY agent — one day-1 task per role, no one idle", () => {
    const assigned = k.plans.flatMap((p) => p.tasks);
    expect(assigned.length).toBe(ROLES.length); // all 56 (or however many) get a task
    expect(k.totalAgents).toBe(ROLES.length);
    expect(new Set(assigned.map((t) => t.roleId)).size).toBe(ROLES.length); // no duplicates, no gaps
  });

  it("every task references the actual project", () => {
    for (const t of k.plans.flatMap((p) => p.tasks)) {
      expect(t.task.length).toBeGreaterThan(10);
    }
    expect(k.headline).toContain("Northeastern");
  });

  it("groups the work by department, each with its head + Slack channel", () => {
    expect(k.plans.length).toBe(DEPARTMENTS.length);
    const eng = k.plans.find((p) => p.deptId === "engineering")!;
    expect(eng.channel).toBe("engineering");
    expect(eng.headTitle).toBe("Chief Technology Officer");
    // the 56th agent shows up on the roster, on day 1
    expect(eng.tasks.some((t) => t.title === "Reliability & Prompt Engineer")).toBe(true);
  });

  it("produces a standup post per active department (ready for Slack)", () => {
    expect(k.standupPosts.length).toBe(DEPARTMENTS.length);
    const exec = k.standupPosts.find((p) => p.channel === "exec")!;
    expect(exec.text).toContain("Kickoff");
    expect(exec.headRoleId).toBe("chief-executive-officer");
  });

  it("gives the founder a single plain-English briefing", () => {
    expect(k.founderBriefing).toContain("Chief Executive Officer");
    expect(k.founderBriefing).toContain(String(ROLES.length));
  });
});
