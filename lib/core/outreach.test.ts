import { describe, it, expect } from "vitest";
import { outreachFor } from "./outreach";
import type { Lead } from "@/lib/org/outreach";

const base = (over: Partial<Lead>): Lead => ({ id: "t", company: "Acme Studio", source: "list", ...over });

describe("outreach — qualify → no-spam gate → honest draft", () => {
  it("drafts for a warm, qualified lead", () => {
    const p = outreachFor(base({
      source: "referral", title: "Founder", companySize: 8,
      signals: ["builds custom software for clients", "actively hiring developers"],
      triggerReason: "your 'we're at capacity' post",
    }));
    expect(p.gate.allowed).toBe(true);
    expect(p.draft).not.toBeNull();
    expect(p.qualification.fit).toBeGreaterThan(0);
  });

  it("BLOCKS a cold list lead with no trigger or consent — and drafts nothing (no scraped-list spam)", () => {
    const p = outreachFor(base({ source: "list" }));
    expect(p.gate.allowed).toBe(false);
    expect(p.draft).toBeNull();
  });

  it("disqualifies an out-of-ICP lead (and never drafts)", () => {
    const p = outreachFor(base({ source: "referral", signals: ["staffing or recruiting agency"] }));
    expect(p.qualification.tier).toBe("disqualified");
    expect(p.draft).toBeNull();
  });

  it("is deterministic", () => {
    const lead = base({ source: "inbound", title: "CTO" });
    expect(outreachFor(lead)).toEqual(outreachFor(lead));
  });
});
