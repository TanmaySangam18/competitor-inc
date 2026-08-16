import { describe, it, expect } from "vitest";
import { reversibility, canOfferUndo } from "./reversibility";
import type { Activity, Proof } from "@/lib/core/types";

const act = (action: string, over: Partial<Activity> = {}): Activity => ({
  id: "x",
  night: 1,
  agent: "engineering",
  action,
  cost: 100,
  status: "done",
  ...over,
});

describe("reversibility (honest undo)", () => {
  it("marks a sent email as irreversible", () => {
    const r = reversibility(act("Emailed 200 prospects the launch note"));
    expect(r.reversible).toBe(false);
    expect(r.method).toBe("none");
    expect(canOfferUndo(act("Emailed 200 prospects"))).toBe(false);
  });

  it("marks ad spend as irreversible", () => {
    const r = reversibility(act("Ran a paid ads campaign on Meta"));
    expect(r.reversible).toBe(false);
    expect(r.reason.toLowerCase()).toContain("returned");
  });

  it("marks a deploy as reversible via rollback", () => {
    const r = reversibility(act("Deployed the site", { proof: { kind: "build", value: "sha 9f2c" } as Proof }));
    expect(r.reversible).toBe(true);
    expect(r.method).toBe("rollback_deploy");
    expect(canOfferUndo(act("Deployed the site", { proof: { kind: "build", value: "sha" } as Proof }))).toBe(true);
  });

  it("marks a social post as deletable", () => {
    const r = reversibility(act("Posted the launch thread on X"));
    expect(r.reversible).toBe(true);
    expect(r.method).toBe("delete_post");
  });

  it("marks a zero-cost internal action as ledger-reversible (no undo button)", () => {
    const r = reversibility(act("Diagnosed the funnel constraint", { cost: 0 }));
    expect(r.reversible).toBe(true);
    expect(r.method).toBe("ledger");
    expect(canOfferUndo(act("Diagnosed the funnel constraint", { cost: 0 }))).toBe(false);
  });

  it("is conservative about unknown paid actions", () => {
    const r = reversibility(act("Did something with real money", { cost: 500 }));
    expect(r.reversible).toBe(false);
  });

  it("never offers undo on an already-undone or non-done action", () => {
    expect(canOfferUndo(act("Deployed the site", { undone: true, proof: { kind: "build", value: "x" } as Proof }))).toBe(false);
    expect(canOfferUndo(act("Deployed the site", { status: "failed-credited" }))).toBe(false);
  });
});
