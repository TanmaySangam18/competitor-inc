import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { TOOLS, toolsFor, toolPrompt, parseAction, stripAction, runTool, runApproved, contextFor } from "./tools";
import { getAgent } from "./agents";

const sheet = join(process.cwd(), "app", "globals.css");

describe("tool access is scoped to the role that owns the work", () => {
  it("gives the design tools to the Product Designer", () => {
    expect(toolsFor("product-designer").map((t) => t.id)).toContain("design.set");
  });

  it("does NOT give design.set to anyone else, including their own lead", () => {
    // head-of-product can READ the palette but cannot change it: reviewing and doing are different
    // jobs, and the responsibility for tokens sits with one role.
    expect(toolsFor("head-of-product").map((t) => t.id)).toContain("design.read");
    expect(toolsFor("head-of-product").map((t) => t.id)).not.toContain("design.set");
    expect(toolsFor("qa-lead").map((t) => t.id)).not.toContain("design.set");
    expect(toolsFor("engineering-lead").map((t) => t.id)).not.toContain("design.set");
  });

  it("REFUSES a scoped tool at execution, not just in the prompt", () => {
    // The prompt is advice. This is the enforcement, and it is the one that matters: a model can
    // always emit a block it was not told about.
    const r = runTool("qa-lead", { tool: "design.set", args: { changes: [{ name: "--color-bg", to: "#000" }] } })!;
    expect(r.ok).toBe(false);
    expect(r.summary).toMatch(/not allowed/i);
    expect(r.summary).toMatch(/Product Designer/); // and it names who to ask
  });

  it("does not let a hostile block change the stylesheet from an unauthorised role", () => {
    const before = readFileSync(sheet, "utf8");
    runTool("engineering-lead", { tool: "design.set", args: { changes: [{ name: "--color-bg", to: "#ff0000" }] } });
    expect(readFileSync(sheet, "utf8")).toBe(before);
  });

  it("gives the unscoped tools to everyone", () => {
    for (const id of ["qa-lead", "product-designer", "chief-of-staff"]) {
      expect(toolsFor(id).map((t) => t.id)).toContain("org.coverage");
    }
  });

  it("puts only the agent's own tools in its prompt", () => {
    expect(toolPrompt("product-designer")).toContain("design.set");
    expect(toolPrompt("qa-lead")).not.toContain("design.set");
    expect(toolPrompt("qa-lead")).toContain("org.coverage");
  });
});

describe("the parser refuses anything it cannot read exactly", () => {
  it("reads a well-formed block", () => {
    const r = parseAction('Sure, doing that now.\n```action\n{"tool":"design.read"}\n```')!;
    expect(r.tool).toBe("design.read");
  });

  it("returns null for prose with no block, so talking is never an action", () => {
    expect(parseAction("I could change the background to #1a1a1a if you like.")).toBeNull();
  });

  for (const bad of [
    '```action\nnot json\n```',
    '```action\n[1,2,3]\n```',
    '```action\n"a string"\n```',
    '```action\nnull\n```',
    '```action\n{"noTool":true}\n```',
    '```action\n{"tool":""}\n```',
    '```action\n{"tool":123}\n```',
    '```action\n{ unclosed\n```',
  ]) {
    it(`returns null for ${JSON.stringify(bad.slice(10, 40))}`, () => {
      expect(parseAction(bad)).toBeNull();
    });
  }

  it("strips the block so a person reads only the words", () => {
    const reply = 'Making the canvas a touch deeper.\n```action\n{"tool":"design.read"}\n```';
    expect(stripAction(reply)).toBe("Making the canvas a touch deeper.");
  });

  it("leaves a reply with no block untouched", () => {
    expect(stripAction("just talking")).toBe("just talking");
  });
});

describe("tools that refuse, with a reason a colleague could say out loud", () => {
  it("names an unknown tool instead of failing silently", () => {
    const r = runTool("product-designer", { tool: "rm.rf", args: {} })!;
    expect(r.ok).toBe(false);
    expect(r.summary).toMatch(/no tool called/i);
  });

  it("refuses design.set with no changes", () => {
    expect(runTool("product-designer", { tool: "design.set", args: {} })!.ok).toBe(false);
    expect(runTool("product-designer", { tool: "design.set", args: { changes: [] } })!.ok).toBe(false);
  });

  it("refuses malformed changes rather than coercing them", () => {
    const r = runTool("product-designer", { tool: "design.set", args: { changes: [{ name: "--color-bg" }] } })!;
    expect(r.ok).toBe(false);
    expect(r.summary).toMatch(/needs a string/i);
  });

  it("refuses a hostile value and explains why, changing nothing", () => {
    const before = readFileSync(sheet, "utf8");
    const r = runTool("product-designer", { tool: "design.set", args: { changes: [{ name: "--color-bg", to: "#000; } body { display:none" }] } })!;
    expect(r.ok).toBe(false);
    expect(r.summary).toMatch(/Nothing was changed/);
    expect(readFileSync(sheet, "utf8")).toBe(before);
  });

  it("returns null for a null call", () => {
    expect(runTool("product-designer", null)).toBeNull();
  });
});

describe("tools that work", () => {
  it("reads the palette", () => {
    const r = runTool("product-designer", { tool: "design.read", args: {} })!;
    expect(r.ok).toBe(true);
    expect(r.summary).toMatch(/--color-bg/);
  });

  it("reports the real measured coverage, not a made-up number", () => {
    const r = runTool("qa-lead", { tool: "org.coverage", args: {} })!;
    expect(r.ok).toBe(true);
    expect(r.summary).toMatch(/\d+(\.\d+)?% of automatable/);
  });

  it("looks up who owns something", () => {
    const r = runTool("chief-of-staff", { tool: "org.who", args: { roleId: "qa-lead" } })!;
    expect(r.ok).toBe(true);
    expect(r.summary).toMatch(/QA Lead/);
  });

  it("refuses an unknown colleague rather than inventing one", () => {
    expect(runTool("chief-of-staff", { tool: "org.who", args: { roleId: "nope" } })!.ok).toBe(false);
  });

  it("ACTUALLY changes the look, and marks it as a mutation", () => {
    const before = readFileSync(sheet, "utf8");
    try {
      const r = runTool("product-designer", { tool: "design.set", args: { changes: [{ name: "--color-bg", to: "#191919" }] } })!;
      expect(r.ok).toBe(true);
      expect(r.mutated).toBe(true);
      expect(r.summary).toMatch(/Changed 1/);
      expect(readFileSync(sheet, "utf8")).toContain("--color-bg: #191919");
    } finally {
      writeFileSync(sheet, before, "utf8");
    }
  });
});

describe("context handed to an agent contains only measured facts", () => {
  it("states the real revenue and zero users every time", () => {
    const c = contextFor(getAgent("chief-of-staff")!);
    expect(c).toMatch(/\$0 settled/);
    expect(c).toMatch(/Customers: zero/);
  });

  it("mentions design tokens only to the roles that can touch them", () => {
    expect(contextFor(getAgent("product-designer")!)).toMatch(/design tokens/i);
    expect(contextFor(getAgent("qa-lead")!)).not.toMatch(/design tokens/i);
  });

  it("every tool has a describe line, so none is invisible to its owner", () => {
    for (const t of TOOLS) expect(t.describe, t.id).toContain(t.id);
  });
});

describe("GOAL STEP 5: agents propose, the founder signs, and an agent cannot skip that", () => {
  it("returns a PROPOSAL for build.start instead of building", () => {
    const r = runTool("engineering-lead", { tool: "build.start", args: { goal: "a co-op posting checker" } })!;
    expect(r.ok).toBe(true);
    expect(r.proposal).toBeDefined();
    expect(r.proposal!.what).toMatch(/co-op posting checker/);
    expect(r.summary).toMatch(/Waiting on your approval/);
    expect(r.summary).toMatch(/Nothing has run/);
  });

  it("says WHY it needs a human, in the role's own words", () => {
    const r = runTool("engineering-lead", { tool: "build.start", args: { goal: "x" } })!;
    expect(r.proposal!.because.length).toBeGreaterThan(10);
  });

  it("has no argument that turns the gate off", () => {
    // Every plausible bypass an agent might emit. The gate is checked before the switch precisely so
    // none of these can reach an execution path.
    for (const args of [
      { goal: "x", approved: true },
      { goal: "x", needsFounder: false },
      { goal: "x", founderApproved: true },
      { goal: "x", force: true },
      { goal: "x", skipApproval: 1 },
    ]) {
      const r = runTool("engineering-lead", { tool: "build.start", args })!;
      expect(r.proposal, JSON.stringify(args)).toBeDefined();
    }
  });

  it("still refuses a role that does not own the tool, before any proposal is made", () => {
    const r = runTool("product-designer", { tool: "build.start", args: { goal: "x" } })!;
    expect(r.ok).toBe(false);
    expect(r.proposal).toBeUndefined();
    expect(r.summary).toMatch(/not allowed/i);
  });
});

describe("the approval door is separate from the agent door", () => {
  it("refuses a non-signed tool coming through it", () => {
    const r = runApproved("product-designer", "design.set", { changes: [{ name: "--color-bg", to: "#000" }] });
    expect(r.ok).toBe(false);
    expect(r.summary).toMatch(/does not need approval/i);
  });

  it("refuses an unknown tool", () => {
    expect(runApproved("engineering-lead", "rm.rf", {}).ok).toBe(false);
  });

  it("re-checks role scope even after approval, so a signature cannot widen permissions", () => {
    const r = runApproved("product-designer", "build.start", { goal: "x" });
    expect(r.ok).toBe(false);
    expect(r.summary).toMatch(/not allowed/i);
  });

  it("refuses an empty goal", () => {
    expect(runApproved("engineering-lead", "build.start", { goal: "  " }).ok).toBe(false);
  });

  it("names EXACTLY what is missing rather than saying 'not configured'", () => {
    // The environment has neither, which is the honest state tonight. A refusal that does not tell
    // you what to add is the thing this company exists not to ship.
    const r = runApproved("engineering-lead", "build.start", { goal: "a tutoring marketplace" });
    expect(r.ok).toBe(false);
    expect(r.summary).toMatch(/FULLSTACK_BUILDS=1/);
    expect(r.summary).toMatch(/GITHUB_TOKEN/);
    expect(r.summary).toMatch(/nothing was spent/i);
  });
});

describe("build.plan works with no keys at all, because planning is deterministic", () => {
  it("turns a goal into real tasks with named positions", () => {
    const r = runTool("engineering-lead", { tool: "build.plan", args: { goal: "a tool that checks if co-op postings are real" } })!;
    expect(r.ok).toBe(true);
    expect(r.summary).toMatch(/\d+ tasks, owners assigned/);
    expect(r.summary).toMatch(/Sign-off chain/);
    expect(r.mutated).toBeUndefined(); // planning changes nothing
  });

  it("is deterministic: the same goal plans the same way twice", () => {
    const a = runTool("engineering-lead", { tool: "build.plan", args: { goal: "a tutoring marketplace" } })!;
    const b = runTool("engineering-lead", { tool: "build.plan", args: { goal: "a tutoring marketplace" } })!;
    expect(a.summary).toBe(b.summary);
  });

  it("refuses an empty or oversized goal", () => {
    expect(runTool("engineering-lead", { tool: "build.plan", args: {} })!.ok).toBe(false);
    expect(runTool("engineering-lead", { tool: "build.plan", args: { goal: "x".repeat(501) } })!.ok).toBe(false);
  });

  it("is not available to every role", () => {
    expect(runTool("product-designer", { tool: "build.plan", args: { goal: "x" } })!.ok).toBe(false);
  });
});
