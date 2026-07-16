import { describe, it, expect, vi } from "vitest";
import { escalateIfNeeded, shouldEscalate } from "./support-escalation";
import { AuditLog } from "@/lib/core/audit";
import { killSwitch } from "@/lib/core/killswitch";

describe("shouldEscalate — the human floor as explicit triggers", () => {
  it("legal mention always escalates (legal is human-only)", () => {
    const d = shouldEscalate({ mentionsLegal: true });
    expect(d.escalate).toBe(true);
    expect(d.triggers[0]).toMatch(/legal/);
  });

  it("refund mention escalates (money movement is the human's)", () => {
    const d = shouldEscalate({ mentionsRefund: true });
    expect(d.escalate).toBe(true);
    expect(d.triggers[0]).toMatch(/refund/);
  });

  it("3+ contacts on the same issue escalates", () => {
    expect(shouldEscalate({ repeatCount: 3 }).escalate).toBe(true);
    expect(shouldEscalate({ repeatCount: 2 }).escalate).toBe(false);
  });

  it("negative sentiment escalates only when it compounds (2+ contacts)", () => {
    expect(shouldEscalate({ sentiment: "negative", repeatCount: 2 }).escalate).toBe(true);
    expect(shouldEscalate({ sentiment: "negative", repeatCount: 1 }).escalate).toBe(false);
    expect(shouldEscalate({ sentiment: "negative" }).escalate).toBe(false);
  });

  it("a routine ticket stays with the grounded agent — no escalation, honest reason", () => {
    const d = shouldEscalate({ sentiment: "neutral", repeatCount: 1 });
    expect(d).toMatchObject({ escalate: false, triggers: [] });
    expect(d.reason).toMatch(/grounded support agent/);
  });

  it("multiple triggers all surface (the human sees the full why)", () => {
    const d = shouldEscalate({ mentionsLegal: true, mentionsRefund: true, repeatCount: 4 });
    expect(d.triggers).toHaveLength(3);
  });
});

describe("escalateIfNeeded — governed #support ping, only when owed", () => {
  const env = { SLACK_BOT_TOKEN: "tok", SLACK_CH_SUPPORT: "C-SUP", SLACK_FOUNDER_MEMBER_ID: "U9" };

  it("escalation posts to #support with the @-mention and every fired trigger", async () => {
    const post = vi.fn(async (_c: string, _t: string) => {});
    const log = new AuditLog();
    const r = await escalateIfNeeded(
      { id: "tkt-7", subject: "Where is my refund?", mentionsRefund: true, repeatCount: 3 },
      { env, post, govern: { log } },
    );
    expect(r.posted).toMatchObject({ delivered: true, channel: "C-SUP" });
    const [, text] = post.mock.calls[0];
    expect(text).toContain("<@U9>");
    expect(text).toContain("tkt-7");
    expect(text).toContain("refund");
    expect(log.all()[0]).toMatchObject({ actor: "support", action: "slack_post", verdict: "AUTO" });
  });

  it("non-escalation posts NOTHING (the grounded agent is already answering — no noise)", async () => {
    const post = vi.fn();
    const r = await escalateIfNeeded({ subject: "how do I export?", sentiment: "neutral" }, { env, post });
    expect(r.posted).toBeUndefined();
    expect(post).not.toHaveBeenCalled();
  });

  it("the kill switch blocks the escalation post before any network", async () => {
    killSwitch.engageGlobal();
    try {
      const post = vi.fn();
      const r = await escalateIfNeeded({ mentionsLegal: true }, { env, post, govern: { log: new AuditLog() } });
      expect(r.decision.escalate).toBe(true); // the POLICY still speaks the truth
      expect(r.posted?.delivered).toBe(false); // but nothing fires
      expect(post).not.toHaveBeenCalled();
    } finally {
      killSwitch.disengageGlobal();
    }
  });
});
