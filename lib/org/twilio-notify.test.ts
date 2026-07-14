import { describe, it, expect, afterEach } from "vitest";
import { waAddress, withAgentPrefix, composeFounderText, twilioConfig, notifyFounder } from "./twilio-notify";

const clearEnv = () => {
  for (const k of ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_NUMBER", "TWILIO_WHATSAPP_FROM", "TWILIO_FOUNDER_NUMBER"]) delete process.env[k];
};
afterEach(clearEnv);

describe("twilio-notify — the founder's phone line", () => {
  it("formats WhatsApp addresses idempotently", () => {
    expect(waAddress("+16175550123")).toBe("whatsapp:+16175550123");
    expect(waAddress("whatsapp:+16175550123")).toBe("whatsapp:+16175550123");
  });

  it("prefixes the agent's TITLE (identity in-body, since SMS has no sender name)", () => {
    expect(withAgentPrefix("chief-of-staff", "night 5 wrapped")).toBe("Chief of Staff: night 5 wrapped");
    expect(withAgentPrefix(undefined, "hi")).toBe("competitor.inc: hi");
    expect(withAgentPrefix("not-a-role", "hi")).toBe("competitor.inc: hi");
  });

  it("composes a phone-sized founder briefing", () => {
    expect(composeFounderText("PilotWorks", 5, 4, 2)).toBe("PilotWorks · night 5: 4 shipped, 2 need your OK. Reply in Slack or tap the approval.");
    expect(composeFounderText("PilotWorks", 6, 3, 0)).toContain("nothing needs you");
  });

  it("is inert without creds (fail-soft) — never throws", async () => {
    clearEnv();
    expect(twilioConfig()).toBeNull();
    const r = await notifyFounder("chief-of-staff", "test");
    expect(r.ok).toBe(false);
    expect(r.error).toContain("not configured");
  });

  it("reads creds when set, and refuses cleanly when a destination is missing", async () => {
    process.env.TWILIO_ACCOUNT_SID = "ACxxx";
    process.env.TWILIO_AUTH_TOKEN = "tok";
    const cfg = twilioConfig();
    expect(cfg?.sid).toBe("ACxxx");
    // configured, but no founder destination + no from-number → refuses, doesn't throw or send
    const r = await notifyFounder("legal-compliance-analyst", "test");
    expect(r.ok).toBe(false);
    expect(r.error).toContain("destination");
  });
});
