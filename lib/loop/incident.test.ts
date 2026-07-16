import { describe, it, expect, vi } from "vitest";
import { adaptIncidentPayload, classifyIncident, ingestIncident, severityFromSentryLevel } from "./incident";
import { AuditLog } from "@/lib/core/audit";
import { killSwitch } from "@/lib/core/killswitch";

const env = { SLACK_BOT_TOKEN: "xoxb-test", SLACK_CH_ENG: "C-ENG", SLACK_CH_DECISIONS: "C-DEC", SLACK_FOUNDER_MEMBER_ID: "U9" };
const office = () => {
  const post = vi.fn(async (_c: string, _t: string) => {});
  return { post, deps: { env, post, govern: { log: new AuditLog() } } };
};

describe("classifyIncident — severity IS the tier, deterministically", () => {
  it("low/medium → T1 auto-triage · high → T2 queue · critical → T3 halt", () => {
    expect(classifyIncident("low")).toEqual({ action: "auto-triage", tier: "T1" });
    expect(classifyIncident("medium")).toEqual({ action: "auto-triage", tier: "T1" });
    expect(classifyIncident("high")).toEqual({ action: "queue", tier: "T2" });
    expect(classifyIncident("critical")).toEqual({ action: "halt", tier: "T3" });
  });
});

describe("ingestIncident — post to #eng, then act within tier", () => {
  it("auto-triage: governed #eng post + enqueues the root-cause org-run via the injected inner-loop seam", async () => {
    const { post, deps } = office();
    const enqueueRun = vi.fn(async (_goal: string) => "run-42");
    const r = await ingestIncident(
      { source: "sentry", title: "TypeError in checkout", detail: "cart.total undefined", severity: "medium" },
      { office: deps, enqueueRun },
    );
    expect(r.action).toBe("auto-triage");
    expect(r.runId).toBe("run-42");
    expect(post).toHaveBeenCalledTimes(1); // #eng only — no decision mirror for within-tier work
    expect(post.mock.calls[0][0]).toBe("C-ENG");
    const goal = enqueueRun.mock.calls[0][0];
    expect(goal).toContain("root-cause and fix");
    expect(goal).toContain("TypeError in checkout");
  });

  it("high: queues — NO auto-run, one #decisions mirror with the @-mention", async () => {
    const { post, deps } = office();
    const enqueueRun = vi.fn(async () => "never");
    const r = await ingestIncident({ source: "monitor", title: "p95 latency 8s", severity: "high" }, { office: deps, enqueueRun });
    expect(r.action).toBe("queue");
    expect(r.runId).toBeUndefined();
    expect(enqueueRun).not.toHaveBeenCalled();
    expect(post).toHaveBeenCalledTimes(2); // #eng brief + #decisions mirror
    const mirror = post.mock.calls.find((c) => c[0] === "C-DEC");
    expect(mirror?.[1]).toContain("<@U9>");
    expect(mirror?.[1]).toContain("[T2 · QUEUE]");
  });

  it("critical: halts — nothing auto-runs, the mirror pages as a T3 BLOCK", async () => {
    const { post, deps } = office();
    const r = await ingestIncident({ source: "monitor", title: "site down", severity: "critical" }, { office: deps, enqueueRun: vi.fn(async () => "never") });
    expect(r.action).toBe("halt");
    expect(r.runId).toBeUndefined();
    const mirror = post.mock.calls.find((c) => c[0] === "C-DEC");
    expect(mirror?.[1]).toContain("[T3 · BLOCK]");
  });

  it("the kill switch stops EVERYTHING — no post, no enqueue, honest note", async () => {
    killSwitch.engageGlobal();
    try {
      const { post, deps } = office();
      const enqueueRun = vi.fn(async () => "never");
      const r = await ingestIncident({ source: "sentry", title: "warn", severity: "low" }, { office: deps, enqueueRun });
      expect(post).not.toHaveBeenCalled();
      expect(enqueueRun).not.toHaveBeenCalled();
      expect(r.runNote).toMatch(/kill switch/);
    } finally {
      killSwitch.disengageGlobal();
    }
  });

  it("no run driver wired (keyless) → classification + post still happen, with the honest 'not enqueued'", async () => {
    const { post, deps } = office();
    const r = await ingestIncident({ source: "manual", title: "flaky test", severity: "low" }, { office: deps });
    expect(post).toHaveBeenCalledTimes(1);
    expect(r.runId).toBeUndefined();
    expect(r.runNote).toMatch(/no org-run driver connected/);
  });

  it("Slack not connected → still classifies and reports honestly (delivered:false, reason)", async () => {
    const r = await ingestIncident({ source: "manual", title: "x", severity: "high" }, { office: { env: {}, post: vi.fn() } });
    expect(r.tier).toBe("T2");
    expect(r.posted.delivered).toBe(false);
  });
});

describe("payload adapters — normalize, never invent", () => {
  it("Sentry levels map monotonically; unknown reads LOW, never up", () => {
    expect(severityFromSentryLevel("fatal")).toBe("critical");
    expect(severityFromSentryLevel("error")).toBe("high");
    expect(severityFromSentryLevel("warning")).toBe("medium");
    expect(severityFromSentryLevel("info")).toBe("low");
    expect(severityFromSentryLevel(undefined)).toBe("low");
  });

  it("native shape passes through; junk severity is rejected (null), not guessed", () => {
    expect(adaptIncidentPayload({ source: "monitor", title: "down", severity: "critical" })).toMatchObject({ title: "down", severity: "critical" });
    expect(adaptIncidentPayload({ title: "down", severity: "apocalyptic" })).toBeNull();
  });

  it("Sentry legacy webhook ({level, message}) adapts", () => {
    const p = adaptIncidentPayload({ level: "error", message: "NullPointer in billing", culprit: "billing.ts" });
    expect(p).toMatchObject({ source: "sentry", title: "NullPointer in billing", detail: "billing.ts", severity: "high" });
  });

  it("Sentry issue-alert shape ({data:{issue:{title,level}}}) adapts", () => {
    const p = adaptIncidentPayload({ action: "created", data: { issue: { title: "boom", level: "fatal" } } });
    expect(p).toMatchObject({ source: "sentry", title: "boom", severity: "critical" });
  });

  it("unrecognizable bodies → null (the route answers 400 — an incident is never fabricated)", () => {
    expect(adaptIncidentPayload(null)).toBeNull();
    expect(adaptIncidentPayload("text")).toBeNull();
    expect(adaptIncidentPayload({ hello: "world" })).toBeNull();
  });
});
