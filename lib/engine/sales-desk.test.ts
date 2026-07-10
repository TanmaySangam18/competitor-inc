import { describe, it, expect } from "vitest";
import { processLead } from "./sales-desk";
import { defaultMandate } from "@/lib/org/customer-mandate";
import type { Lead } from "@/lib/org/outreach";

const mandate = defaultMandate(1000);
const warmLead: Lead = {
  id: "l1", name: "Sam Rivera", title: "Founder", company: "Riverbuild Studio", companySize: 6,
  signals: ["client work", "hiring backlog"], source: "referral",
  triggerReason: "posted about turning down two clients for capacity",
};

describe("sales desk — consent-railed outreach (Block 6c)", () => {
  it("a warm, qualified lead drafts an honest first touch that QUEUES (never sends)", () => {
    const r = processLead(warmLead, mandate);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.qualification.tier === "hot" || r.qualification.tier === "warm").toBe(true);
    expect(r.gate.allowed).toBe(true);
    expect(r.approval.kind).toBe("outreach"); // the desk, not a send
    expect(r.draft.body).toContain("15-minute call");
    expect(r.draft.body).not.toMatch(/\d+%|guarantee/i); // no fabricated stats in the deterministic drafter
    expect(r.approval.detail).toContain("send governed:");
  });

  it("THE HARD RAIL: a cold scraped-list lead with no trigger/consent never even drafts", () => {
    const cold: Lead = { id: "l2", company: "Scraped Co", source: "list" };
    const r = processLead(cold, mandate);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.stage).toBe("gate");
    expect(r.reason).toContain("blocked");
  });

  it("disqualified leads are declined with the honest reason, before the gate", () => {
    const enterprise: Lead = { ...warmLead, id: "l3", companySize: 900 };
    const r = processLead(enterprise, mandate);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.stage).toBe("disqualified");
    expect(r.reason).toContain("team size");
  });

  it("the kill switch outranks everything — a halted company doesn't even draft", () => {
    const r = processLead(warmLead, { ...mandate, killSwitch: true });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.stage).toBe("kill-switch");
  });

  it("an unsigned mandate still drafts to the desk but the send is honestly marked needs-you", () => {
    const r = processLead(warmLead, { ...mandate, signedAt: null });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.mandate.decision).toBe("needs-you");
    expect(r.approval.detail).toContain("send governed: needs-you");
  });
});
