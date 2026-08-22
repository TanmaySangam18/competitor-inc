import { describe, it, expect, vi } from "vitest";
import { captureLead, DIRECT_CONTACT } from "./lead-fallback";

describe("a lead the database refused still reaches a human", () => {
  it("posts to the configured channel and reports it got through", async () => {
    const post = vi.fn().mockResolvedValue(undefined);
    const r = await captureLead({ email: "a@b.com", why: "no database configured" }, { channel: "C123", post });
    expect(r).toEqual({ reached: true, via: "slack" });
    expect(post).toHaveBeenCalledOnce();
  });

  it("carries the email, the referrer and WHY the database failed", async () => {
    const post = vi.fn().mockResolvedValue(undefined);
    await captureLead({ email: "a@b.com", ref: "xy12", why: "insert failed: duplicate" }, { channel: "C1", post });
    const text = post.mock.calls[0][1] as string;
    expect(text).toContain("a@b.com");
    expect(text).toContain("xy12");
    expect(text).toContain("insert failed: duplicate");
    // And it says the lead is nowhere else, because a message that scrolls away IS the only copy.
    expect(text).toMatch(/ONLY in this message/i);
  });

  it("omits the referrer line when there is none rather than printing null", async () => {
    const post = vi.fn().mockResolvedValue(undefined);
    await captureLead({ email: "a@b.com", ref: null, why: "x" }, { channel: "C1", post });
    expect(post.mock.calls[0][1]).not.toMatch(/null|undefined/);
  });
});

describe("when nothing is working it says so instead of pretending", () => {
  it("reports failure when no channel is configured", async () => {
    const r = await captureLead({ email: "a@b.com", why: "x" }, { channel: "", post: vi.fn() });
    expect(r.reached).toBe(false);
    if (!r.reached) expect(r.why).toMatch(/SLACK_DIGEST_CHANNEL/);
  });

  it("reports failure when the channel rejects, and names the reason", async () => {
    const post = vi.fn().mockRejectedValue(new Error("channel_not_found"));
    const r = await captureLead({ email: "a@b.com", why: "x" }, { channel: "C1", post });
    expect(r.reached).toBe(false);
    if (!r.reached) expect(r.why).toMatch(/channel_not_found/);
  });

  it("never throws, because a failing fallback must not also break the request", async () => {
    const post = vi.fn().mockImplementation(() => { throw new Error("sync boom"); });
    await expect(captureLead({ email: "a@b.com", why: "x" }, { channel: "C1", post })).resolves.toMatchObject({ reached: false });
  });

  it("offers a real human address to fall back to", () => {
    expect(DIRECT_CONTACT).toContain("@");
  });
});
