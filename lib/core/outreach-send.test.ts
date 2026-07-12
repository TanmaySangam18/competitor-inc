import { describe, it, expect } from "vitest";
import { outreachConfigured, compliantMessage, sendFirstTouch } from "./outreach-send";
import type { Lead, FirstTouch } from "@/lib/org/outreach";

const draft: FirstTouch = { subject: "hi", body: "quick note about capacity." };

describe("outreach-send — the governed send seam", () => {
  it("is not configured without a send credential", () => {
    expect(outreachConfigured()).toBe(false);
  });

  it("appends the AI disclosure + opt-out to every message (CAN-SPAM)", () => {
    const m = compliantMessage(draft, { unsubscribe: "https://x/unsub" });
    expect(m.body).toMatch(/named AI/i);
    expect(m.body).toMatch(/opt out|STOP/i);
    expect(m.body).toContain("https://x/unsub");
  });

  it("NEVER sends to a gate-blocked lead (cold list, no trigger)", async () => {
    const cold: Lead = { id: "c", company: "Cold Co", source: "list" };
    const r = await sendFirstTouch({ lead: cold, draft, to: "x@cold.co" });
    expect(r.sent).toBe(false);
    expect(r.reason).toMatch(/no-spam rail/);
  });

  it("fails CLOSED (not sent) without a credential, but assembles the compliant message", async () => {
    const warm: Lead = { id: "w", company: "Warm Co", source: "referral" };
    const r = await sendFirstTouch({ lead: warm, draft, to: "x@warm.co" });
    expect(r.sent).toBe(false);
    expect(r.reason).toMatch(/not configured|not wired/);
    expect(r.message?.body).toMatch(/named AI/i);
  });
});
