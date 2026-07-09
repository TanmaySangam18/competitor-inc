import { describe, it, expect } from "vitest";
import type { Activity } from "@/lib/engine/types";
import {
  DEPT_CHANNELS, channelForDepartment, departmentForExecFn,
  agentSlackIdentity, composeStandup, composeFounderBriefing,
} from "./slack-org";

const act = (agent: Activity["agent"], action: string, meta?: string): Activity => ({
  id: Math.random().toString(36).slice(2), night: 3, agent, action, cost: 0, status: "done", meta,
});

describe("slack-org — the team room", () => {
  it("has one channel per department, with #exec aliased", () => {
    expect(DEPT_CHANNELS.length).toBe(11);
    expect(channelForDepartment("executive")).toBe("exec");
    expect(channelForDepartment("engineering")).toBe("engineering");
    expect(channelForDepartment("revenue")).toBe("revenue");
  });

  it("routes each engine execFn to a department channel", () => {
    expect(departmentForExecFn("growth")).toBe("revenue");
    expect(departmentForExecFn("marketing")).toBe("revenue");
    expect(departmentForExecFn("support")).toBe("customer");
    expect(departmentForExecFn("ceo")).toBe("executive");
    expect(departmentForExecFn("legal")).toBe("legal");
  });

  it("posts AS the agent — title is the Slack sender name, not a bot name", () => {
    const sdr = agentSlackIdentity({ roleId: "sales-development-representative" });
    expect(sdr.username).toBe("Sales Development Representative");
    expect(sdr.icon_emoji).toBe(":moneybag:"); // revenue dept icon

    // A bare execFn falls back to that department's head title.
    const eng = agentSlackIdentity({ execFn: "engineering" });
    expect(eng.username).toBe("Chief Technology Officer");
    expect(eng.icon_emoji).toBe(":hammer_and_wrench:");
  });

  it("composes a per-department standup from a night's activities", () => {
    const activities = [
      act("engineering", "Shipped the checkout flow", "build passed"),
      act("growth", "Sent 15 warmed outreach notes"),
      act("growth", "Drafted the launch post"),
    ];
    const posts = composeStandup("BrewOps", 5, activities);
    const byDept = Object.fromEntries(posts.map((p) => [p.deptId, p]));
    // Only departments that did work appear.
    expect(Object.keys(byDept).sort()).toEqual(["engineering", "revenue"]);
    expect(byDept.engineering.channel).toBe("engineering");
    expect(byDept.engineering.title).toBe("Chief Technology Officer");
    expect(byDept.engineering.text).toContain("Shipped the checkout flow");
    expect(byDept.revenue.text).toContain("Sent 15 warmed outreach notes");
    expect(byDept.revenue.text).toContain("Drafted the launch post");
    // A silent department produces no post.
    expect(byDept.legal).toBeUndefined();
  });

  it("composes the CEO founder briefing with the counts that matter", () => {
    const b = composeFounderBriefing("BrewOps", 5, { shipped: 4, needsYou: 2, headline: "First 6 subs closed." });
    expect(b.title).toBe("Chief Executive Officer");
    expect(b.text).toContain("4 tasks shipped");
    expect(b.text).toContain("2");
    expect(b.text).toContain("sign-off");
    expect(b.text).toContain("First 6 subs closed.");
  });

  it("is inert without a token (fail-soft) — no throw", async () => {
    const { ensureDepartmentChannels, postAsAgent } = await import("./slack-org");
    delete process.env.SLACK_BOT_TOKEN;
    await expect(ensureDepartmentChannels()).resolves.toEqual({});
    await expect(postAsAgent("C123", { execFn: "ceo" }, "hi")).resolves.toBeUndefined();
  });
});
