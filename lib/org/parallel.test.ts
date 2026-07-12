import { describe, it, expect } from "vitest";
import { requiredReviews, assessBranch, processMergeQueue, type Branch } from "./parallel";

const T = 1_800_000_000_000;
const branch = (o: Partial<Branch> & Pick<Branch, "id" | "files">): Branch => ({
  task: o.id, ciGreen: true, reviews: {}, createdAt: T, ...o,
});
// a branch with all its required reviews passed + green CI
const clean = (id: string, files: string[], createdAt = T): Branch => {
  const reviews = Object.fromEntries(requiredReviews(files).map((k) => [k, "passed"])) as Branch["reviews"];
  return { id, task: id, files, ciGreen: true, reviews, createdAt };
};

describe("parallel engineering (P2) — merge queue, CI arbiter, reviewer gates", () => {
  it("requiredReviews scales with what a branch touches", () => {
    expect(requiredReviews(["app/page.tsx"])).toEqual(["design"]);
    expect(requiredReviews(["app/api/items/route.ts"])).toEqual(["design", "architect"]);
    expect(requiredReviews(["app/api/auth/route.ts", "app/login/page.tsx"])).toEqual(["design", "architect", "security"]);
    expect(requiredReviews(["supabase/migrations/0031_x.sql"])).toEqual(["design", "architect"]);
  });

  it("CI is the arbiter: a red branch never merges, however clean its reviews", () => {
    const b = branch({ id: "b1", files: ["app/page.tsx"], ciGreen: false, reviews: { design: "passed" } });
    expect(assessBranch(b).mergeable).toBe(false);
    expect(assessBranch(b).blockers[0]).toMatch(/CI is not green/);
  });

  it("HONESTY: a required review that is PENDING (or missing) blocks — pending is not a pass", () => {
    const missing = branch({ id: "b2", files: ["app/api/auth/route.ts"], reviews: { design: "passed", architect: "passed" } }); // security missing
    const a = assessBranch(missing);
    expect(a.mergeable).toBe(false);
    expect(a.blockers.some((x) => /security review not done/.test(x))).toBe(true);
    // a failed review names itself
    const failed = branch({ id: "b3", files: ["app/page.tsx"], reviews: { design: "failed" } });
    expect(assessBranch(failed).blockers[0]).toMatch(/design review failed/);
  });

  it("a fully-cleared branch is mergeable", () => {
    expect(assessBranch(clean("b4", ["app/api/auth/route.ts"])).mergeable).toBe(true);
  });

  it("merge queue: non-conflicting clean branches all merge, oldest-first", () => {
    const plan = processMergeQueue([
      clean("late", ["app/c.tsx"], T + 100),
      clean("early", ["app/a.tsx"], T),
      clean("mid", ["app/b.tsx"], T + 50),
    ]);
    expect(plan.merged).toEqual(["early", "mid", "late"]); // serialized, oldest-first
    expect(plan.escalations).toHaveLength(0);
  });

  it("CONFLICT escalates (never force-merges): two branches on the same file — first merges, second → lead", () => {
    const plan = processMergeQueue([
      clean("first", ["app/shared.tsx"], T),
      clean("second", ["app/shared.tsx"], T + 10),
    ]);
    expect(plan.merged).toEqual(["first"]);
    expect(plan.escalations[0]).toMatchObject({ branchId: "second" });
    expect(plan.escalations[0].reason).toMatch(/conflict on app\/shared\.tsx/);
  });

  it("respects a base that already moved (alreadyMergedFiles)", () => {
    const plan = processMergeQueue([clean("b", ["app/x.tsx"])], ["app/x.tsx"]);
    expect(plan.merged).toHaveLength(0);
    expect(plan.escalations).toHaveLength(1);
  });

  it("a blocked (red/unreviewed) branch never counts as merged and doesn't reserve its files", () => {
    const plan = processMergeQueue([
      branch({ id: "red", files: ["app/y.tsx"], ciGreen: false, reviews: { design: "passed" } }),
      clean("green", ["app/y.tsx"], T + 1), // same file, but the red one didn't merge → this one is free
    ]);
    expect(plan.blocked.map((x) => x.branchId)).toEqual(["red"]);
    expect(plan.merged).toEqual(["green"]); // not escalated — the red branch reserved nothing
  });
});
