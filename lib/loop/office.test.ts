import { describe, it, expect, vi } from "vitest";
import { channelFor, founderMention, mentionNeeded, mirrorDecision, postToDept, renderDecisionMirror, DEPT_CHANNELS } from "./office";
import { AuditLog } from "@/lib/core/audit";
import { killSwitch } from "@/lib/core/killswitch";
import { governedDecision } from "@/lib/core/policy";

const env = {
  SLACK_BOT_TOKEN: "xoxb-test",
  SLACK_CH_ENG: "C-ENG",
  SLACK_CH_FINANCE: "C-FIN",
  SLACK_CH_DECISIONS: "C-DEC",
  SLACK_LOOP_CHANNEL: "C-LOOP",
};

const fakePost = () => vi.fn(async (_channel: string, _text: string) => {});

describe("the office: dept → channel routing (env, with the loop-channel fallback)", () => {
  it("routes a department to its own env channel", () => {
    expect(channelFor("engineering", env)).toBe("C-ENG");
    expect(channelFor("finance", env)).toBe("C-FIN");
  });

  it("falls back to SLACK_LOOP_CHANNEL when the department has no channel of its own", () => {
    expect(channelFor("support", env)).toBe("C-LOOP"); // no SLACK_CH_SUPPORT above
    expect(channelFor("growth", env)).toBe("C-LOOP");
  });

  it("no channel anywhere → undefined (never a made-up default)", () => {
    expect(channelFor("sales", { SLACK_BOT_TOKEN: "tok" })).toBeUndefined();
  });

  it("every department speaks as a real policy-matrix agent", () => {
    for (const spec of Object.values(DEPT_CHANNELS)) {
      const g = governedDecision({ type: "slack_post", agent: spec.agent, hasCredential: true, compliancePass: true, observable: true, reversible: true });
      expect(g.tier).toBe("T1"); // the BASE_TIER entry: their own opted-in workspace, reversible-ish
      expect(g.verdict).toBe("AUTO"); // the matrix AUTO cell (mcp_read/design_draft pattern)
    }
  });
});

describe("postToDept — governed BEFORE network, keyless-honest", () => {
  it("not connected → honest reason, NO governance, NO network", async () => {
    const post = fakePost();
    const log = new AuditLog();
    const r = await postToDept("engineering", "hi", { env: {}, post, govern: { log } });
    expect(r.delivered).toBe(false);
    expect(!r.delivered && r.reason).toMatch(/not connected/);
    expect(post).not.toHaveBeenCalled();
    expect(log.all()).toHaveLength(0); // nothing to govern when there is nothing to send through
  });

  it("connected → governAction runs (audited T1/AUTO), then the post fires on the routed channel", async () => {
    const post = fakePost();
    const log = new AuditLog();
    const r = await postToDept("engineering", "deploy fixed", { env, post, govern: { log } });
    expect(r).toMatchObject({ delivered: true, channel: "C-ENG", verdict: "AUTO" });
    expect(post).toHaveBeenCalledWith("C-ENG", "deploy fixed");
    const entry = log.all()[0];
    expect(entry).toMatchObject({ action: "slack_post", actor: "engineering", tier: "T1", verdict: "AUTO" });
  });

  it("the kill switch blocks BEFORE any network (the spine holds)", async () => {
    killSwitch.engageGlobal();
    try {
      const post = fakePost();
      const log = new AuditLog();
      const r = await postToDept("finance", "report", { env, post, govern: { log } });
      expect(r.delivered).toBe(false);
      expect(!r.delivered && r.verdict).toBe("BLOCK");
      expect(post).not.toHaveBeenCalled();
      expect(log.all()[0]).toMatchObject({ verdict: "BLOCK" }); // the refusal is itself audited
    } finally {
      killSwitch.disengageGlobal();
    }
  });

  it("a stopped agent (per-agent switch) is refused while other departments keep working", async () => {
    killSwitch.stopAgent("finance");
    try {
      const post = fakePost();
      const log = new AuditLog();
      const fin = await postToDept("finance", "x", { env, post, govern: { log } });
      expect(fin.delivered).toBe(false);
      const eng = await postToDept("engineering", "y", { env, post, govern: { log } });
      expect(eng.delivered).toBe(true);
      expect(post).toHaveBeenCalledTimes(1);
    } finally {
      killSwitch.resumeAgent("finance");
    }
  });
});

describe("the #decisions mirror — the human is @-mentioned ONLY for T2+/queued items", () => {
  it("mention policy: AUTO T1 → no; QUEUE → yes; AUTO T2 → yes (tier alone is enough)", () => {
    expect(mentionNeeded({ id: "d1", title: "t", tier: "T1", verdict: "AUTO" })).toBe(false);
    expect(mentionNeeded({ id: "d2", title: "t", tier: "T1", verdict: "QUEUE" })).toBe(true);
    expect(mentionNeeded({ id: "d3", title: "t", tier: "T2", verdict: "AUTO" })).toBe(true);
    expect(mentionNeeded({ id: "d4", title: "t", tier: "T3", verdict: "BLOCK" })).toBe(true);
  });

  it("renders the mention only when owed", () => {
    const routine = renderDecisionMirror({ id: "a", title: "routine", tier: "T1", verdict: "AUTO" }, "<@U1>");
    expect(routine).not.toContain("<@U1>");
    const gated = renderDecisionMirror({ id: "b", title: "spend $400", tier: "T2", verdict: "QUEUE" }, "<@U1>");
    expect(gated).toContain("<@U1>");
    expect(gated).toContain("[T2 · QUEUE]");
  });

  it("founderMention: real ping with the member id, honest plain '@founder' without", () => {
    expect(founderMention({ SLACK_FOUNDER_MEMBER_ID: "U777" })).toBe("<@U777>");
    expect(founderMention({})).toBe("@founder");
  });

  it("mirrorDecision posts to #decisions through the same governed path", async () => {
    const post = fakePost();
    const log = new AuditLog();
    const r = await mirrorDecision(
      { id: "q-1", title: "outreach batch", summary: "12 emails drafted", tier: "T2", verdict: "QUEUE" },
      { env: { ...env, SLACK_FOUNDER_MEMBER_ID: "U777" }, post, govern: { log } },
    );
    expect(r).toMatchObject({ delivered: true, channel: "C-DEC" });
    const [, text] = post.mock.calls[0];
    expect(text).toContain("<@U777>");
    expect(text).toContain("outreach batch");
    expect(log.all()[0]).toMatchObject({ actor: "ops", action: "slack_post" });
  });
});
