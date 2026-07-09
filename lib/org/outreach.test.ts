import { describe, it, expect } from "vitest";
import { qualifyLead, outreachGate, outreachFallback, buildOutreachPrompt, AGENCY_ICP, type Lead } from "./outreach";

const lead = (over: Partial<Lead>): Lead => ({ id: "l1", company: "Acme Studio", source: "list", ...over });

describe("outreach — targeting the agency beachhead", () => {
  it("scores an ideal agency HOT when there's a real trigger", () => {
    const q = qualifyLead(lead({
      title: "Founder",
      companySize: 8,
      signals: ["builds custom software for clients", "actively hiring developers"],
      triggerReason: "posted 'we're at capacity, waitlisting new clients'",
    }));
    expect(q.tier).toBe("hot");
    expect(q.fit).toBeGreaterThanOrEqual(70);
    expect(q.reasons.some((r) => r.includes("trigger"))).toBe(true);
  });

  it("hard-disqualifies out-of-ICP leads regardless of soft signals", () => {
    expect(qualifyLead(lead({ title: "CEO", signals: ["enterprise (50+ staff)", "builds custom software for clients"] })).tier).toBe("disqualified");
    expect(qualifyLead(lead({ title: "Founder", signals: ["design/marketing only (no software delivery)"] })).tier).toBe("disqualified");
    expect(qualifyLead(lead({ title: "Founder", companySize: 400 })).tier).toBe("disqualified");
  });

  it("a fit without a trigger is warm/cold, never hot", () => {
    const q = qualifyLead(lead({ title: "Principal", companySize: 6, signals: ["builds custom software for clients"] }));
    expect(["warm", "cold"]).toContain(q.tier);
    expect(q.tier).not.toBe("hot");
  });

  describe("the no-scraped-spam rail (outreachGate)", () => {
    it("blocks a cold sourced list with no trigger or consent", () => {
      const g = outreachGate(lead({ source: "list" }));
      expect(g.allowed).toBe(false);
      expect(g.reason).toContain("spam");
    });
    it("allows warm sources, permission, and trigger-backed contact", () => {
      expect(outreachGate(lead({ source: "referral" })).allowed).toBe(true);
      expect(outreachGate(lead({ source: "inbound" })).allowed).toBe(true);
      expect(outreachGate(lead({ source: "list", contactPermission: true })).allowed).toBe(true);
      expect(outreachGate(lead({ source: "list", triggerReason: "their 'hiring 2 devs' post" })).allowed).toBe(true);
      expect(outreachGate(lead({ source: "community", triggerReason: "asked about scaling delivery in a Slack" })).allowed).toBe(true);
    });
    it("blocks a community contact with NO trigger (warm channel alone isn't consent)", () => {
      expect(outreachGate(lead({ source: "community" })).allowed).toBe(false);
    });
  });

  it("the fallback draft anchors on the real trigger and fabricates no numbers", () => {
    const t = outreachFallback(lead({ name: "Dana Lee", triggerReason: "your 'waitlisting clients' tweet" }));
    expect(t.body).toContain("Dana");
    expect(t.body).toContain("waitlisting clients");
    expect(t.body.toLowerCase()).toContain("15-minute");
    expect(t.body).toMatch(/receipt/i); // our proof/honesty hook
    expect(t.body).not.toMatch(/\d+%|\$\d|\d+x\b/); // no fabricated stats
  });

  it("the model prompt hard-wires the honesty guardrail + the trigger-first rule", () => {
    const p = buildOutreachPrompt(lead({ name: "Sam", triggerReason: "a launch post" }));
    expect(p).toContain("a launch post");
    expect(p).toContain("No fabricated stats");
    expect(p).toContain("ONLY JSON");
  });

  it("the ICP is the single knob (agency beachhead by default)", () => {
    expect(AGENCY_ICP.name).toMatch(/agency|consultanc/i);
    expect(AGENCY_ICP.buyerTitles).toContain("founder");
  });
});
