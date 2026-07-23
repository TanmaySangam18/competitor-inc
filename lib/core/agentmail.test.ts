import { describe, it, expect, vi } from "vitest";
import { agentMailReady, withDisclosure, listInbound, sendMail } from "./agentmail";
import { killSwitch } from "@/lib/core/killswitch";

const env = { AGENTMAIL_API_KEY: "am_test" };
const okFetch = () => vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ messages: [] }) })) as unknown as typeof fetch;

describe("AgentMail — governed two-way email (ADR-0019)", () => {
  it("readiness is env-truth", () => {
    expect(agentMailReady({})).toBe(false);
    expect(agentMailReady(env)).toBe(true);
  });
  it("withDisclosure appends the named-AI + opt-out line, idempotently", () => {
    const once = withDisclosure("Fixed it.");
    expect(once).toContain("Fixed it.");
    expect(once).toContain("named AI team");
    expect(once).toContain("Reply STOP to opt out");
    expect(withDisclosure(once)).toBe(once); // never doubles
  });
  it("no key → honest error, no network (both directions)", async () => {
    const f = vi.fn();
    expect((await listInbound("support@x", "support", { env: {}, fetchImpl: f as unknown as typeof fetch })).ok).toBe(false);
    expect((await sendMail({ inbox: "support@x", to: "a@b.com", subject: "s", text: "t", dept: "support" }, { env: {}, fetchImpl: f as unknown as typeof fetch })).ok).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
  it("support READS its own inbox (mcp_read AUTO) — hits the messages endpoint", async () => {
    const f = okFetch();
    const r = await listInbound("support@x", "support", { env, fetchImpl: f });
    expect(r.ok).toBe(true);
    expect((f as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain("/messages");
  });
  it("SENDING is outbound → governed to QUEUE by default (no fire-hose), no network without approval", async () => {
    const f = vi.fn();
    const r = await sendMail({ inbox: "support@x", to: "a@b.com", subject: "Re: ticket", text: "Fixed it.", dept: "support" }, { env, fetchImpl: f as unknown as typeof fetch });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.governed).toBe("QUEUE");
    expect(f).not.toHaveBeenCalled();
  });
  it("kill switch blocks reads BEFORE any network I/O", async () => {
    killSwitch.engageGlobal();
    try {
      const f = vi.fn();
      const r = await listInbound("support@x", "support", { env, fetchImpl: f as unknown as typeof fetch });
      expect(r.ok).toBe(false);
      expect(f).not.toHaveBeenCalled();
    } finally { killSwitch.disengageGlobal(); }
  });
});
