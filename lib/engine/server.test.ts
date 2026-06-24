import { describe, it, expect } from "vitest";
import { runValidate, runShift, runChat, realModelConfigured, detectChatApproval, assertSafeBaseUrl, modelForAgent, streamChatReply } from "./server";
import type { Company } from "./types";

const company: Company = {
  id: "co1",
  name: "Testly",
  slug: "testly",
  idea: "an app for testing",
  createdAt: 0,
  status: "operating",
  night: 0,
  ledger: { spent: 0, credited: 0, tasksDone: 0, tasksFailed: 0 },
};

describe("server engine", () => {
  it("reports whether a real model is configured as a boolean", () => {
    expect(typeof realModelConfigured()).toBe("boolean");
  });

  it("runValidate returns a coherent validation", async () => {
    const v = await runValidate("a marketplace for plants");
    expect(["strong", "weak", "mixed"]).toContain(v.verdict);
    expect(v.waitlist).toBeGreaterThanOrEqual(0);
    expect(v.steps.length).toBeGreaterThan(0);
    expect(v.experiments).toHaveLength(4);
    expect(v.confidence).toBeGreaterThanOrEqual(0);
    expect(v.confidence).toBeLessThanOrEqual(100);
  });

  it("runShift returns activities + approvals arrays for the next night", async () => {
    const r = await runShift(company);
    expect(Array.isArray(r.activities)).toBe(true);
    expect(Array.isArray(r.approvals)).toBe(true);
    for (const a of r.activities) expect(a.night).toBe(1);
    for (const ap of r.approvals) expect(ap.resolved).toBeUndefined();
  });

  it("runChat returns a non-empty contextual reply (simulated when no key)", async () => {
    const reply = await runChat({ name: company.name, idea: company.idea }, "should we launch ads?");
    expect(typeof reply).toBe("string");
    expect(reply.length).toBeGreaterThan(0);
    expect(/approval|outbound|campaign/i.test(reply)).toBe(true);
  });

  it("streamChatReply returns null when no model is configured (caller falls back to simulated)", async () => {
    // With no BYOK key and no server model, real token-streaming isn't possible — the route must
    // detect this (null) and degrade to the fake-streamed simulated reply.
    const gen = await streamChatReply({ name: company.name, idea: company.idea }, "hello", undefined, undefined);
    if (realModelConfigured()) {
      expect(gen).not.toBeNull();
    } else {
      expect(gen).toBeNull();
    }
  });
});

describe("detectChatApproval — chat must DO what it says, not just say it", () => {
  it("queues a spend approval and parses the dollar amount", () => {
    const a = detectChatApproval("Please spend $300 on a Product Hunt push");
    expect(a?.kind).toBe("spend");
    expect(a?.amount).toBe(300);
  });
  it("classifies deploy, outreach, and delete intents", () => {
    expect(detectChatApproval("ship it to prod tonight")?.kind).toBe("deploy");
    expect(detectChatApproval("email the waitlist about the launch")?.kind).toBe("outreach");
    expect(detectChatApproval("delete the staging company")?.kind).toBe("delete");
  });
  it("treats a marketing ask as consequential (queues outreach), without false-firing on 'market fit'", () => {
    expect(detectChatApproval("market competitor.inc")?.kind).toBe("outreach");
    expect(detectChatApproval("run a marketing campaign for us")?.kind).toBe("outreach");
    expect(detectChatApproval("promote it on social")?.kind).toBe("outreach");
    expect(detectChatApproval("how's our market fit?")).toBeNull();
    expect(detectChatApproval("is the market big enough?")).toBeNull();
  });
  it("returns null for a harmless question (no false approval)", () => {
    expect(detectChatApproval("how is the company doing?")).toBeNull();
    expect(detectChatApproval("what's our churn looking like")).toBeNull();
  });
});

describe("assertSafeBaseUrl — SSRF guard on user-supplied BYOK URLs", () => {
  it("allows a normal public https endpoint", () => {
    expect(() => assertSafeBaseUrl("https://api.openai.com/v1")).not.toThrow();
    expect(() => assertSafeBaseUrl("https://openrouter.ai/api/v1")).not.toThrow();
  });
  it("blocks http, loopback, private ranges, metadata, and IPv6 internals", () => {
    expect(() => assertSafeBaseUrl("http://api.openai.com/v1")).toThrow(); // not https
    expect(() => assertSafeBaseUrl("https://localhost/v1")).toThrow();
    expect(() => assertSafeBaseUrl("https://127.0.0.1/v1")).toThrow();
    expect(() => assertSafeBaseUrl("https://10.0.0.5/v1")).toThrow();
    expect(() => assertSafeBaseUrl("https://172.16.0.1/v1")).toThrow();
    expect(() => assertSafeBaseUrl("https://192.168.1.1/v1")).toThrow();
    expect(() => assertSafeBaseUrl("https://169.254.169.254/latest/meta-data")).toThrow(); // cloud metadata
    expect(() => assertSafeBaseUrl("https://[::1]/v1")).toThrow();
    expect(() => assertSafeBaseUrl("https://[::ffff:169.254.169.254]/v1")).toThrow(); // IPv4-mapped
  });
});

describe("modelForAgent — per-agent model routing", () => {
  it("defaults every agent to Sonnet 4.6 (strong + cheap tiers, for now)", () => {
    for (const role of ["engineering", "ceo", "growth", "marketing", "support"] as const) {
      expect(modelForAgent(role)).toBe("claude-sonnet-4-6");
    }
  });
});
