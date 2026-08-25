import { describe, it, expect, vi } from "vitest";
import { placeCall, hasDisclosure, withDisclosure, validNumber, buildTwiml, type Consent } from "./voice";

const CONSENT: Consent = { basis: "Recipient agreed in person before the call", at: "2026-08-25T14:30:00Z", recordedBy: "founder" };
const ENV = { TWILIO_ACCOUNT_SID: "AC123", TWILIO_AUTH_TOKEN: "tok", TWILIO_NUMBER: "+15551230000" };
const SCRIPT = withDisclosure("We have written a guide to every Google tool.", "Amara", "Tanmay");
const ok = () => ({ ok: true, json: async () => ({ sid: "CA123" }) }) as unknown as Response;

describe("CONSENT IS NOT OPTIONAL", () => {
  it("refuses a call with no consent basis, naming the statute risk", async () => {
    const r = await placeCall({ to: "+15551234567", consent: { basis: "", at: "", recordedBy: "" }, script: SCRIPT, agentName: "Amara" }, { env: ENV, fetchImpl: vi.fn() });
    expect(r.placed).toBe(false);
    if (!r.placed) expect(r.reason).toMatch(/TCPA/);
  });

  it("has no parameter that disables the consent check", () => {
    // If a cold-call switch ever appears, this is the test that should have stopped it.
    const src = String(placeCall);
    expect(src).not.toMatch(/skipConsent|force|cold|ignoreConsent/i);
  });

  it("does not place the call when consent is missing", async () => {
    const fetchImpl = vi.fn();
    await placeCall({ to: "+15551234567", consent: { basis: "  ", at: "", recordedBy: "" }, script: SCRIPT, agentName: "A" }, { env: ENV, fetchImpl });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("the AI says it is an AI, before it sells anything", () => {
  it("detects a disclosure in the opening", () => {
    expect(hasDisclosure("Hi, this is Amara. I am an AI agent calling for Tanmay. Want a guide?")).toBe(true);
  });

  it("REFUSES a disclosure buried after the pitch", () => {
    const buried = "Buy our ebook today. It covers every Google tool. It is great. By the way I am an AI.";
    expect(hasDisclosure(buried)).toBe(false);
  });

  it("refuses to place a call whose script omits it", async () => {
    const r = await placeCall({ to: "+15551234567", consent: CONSENT, script: "Buy our ebook.", agentName: "A" }, { env: ENV, fetchImpl: vi.fn() });
    expect(r.placed).toBe(false);
    if (!r.placed) expect(r.reason).toMatch(/identify the caller as an AI/i);
  });

  it("adds it idempotently", () => {
    const once = withDisclosure("Hello.", "Amara", "Tanmay");
    expect(withDisclosure(once, "Amara", "Tanmay")).toBe(once);
  });
});

describe("numbers and TwiML", () => {
  it("accepts E.164 and rejects everything else", () => {
    expect(validNumber("+15551234567")).toBe(true);
    for (const bad of ["5551234567", "+0555", "", "+1 555 123 4567", "notanumber"]) {
      expect(validNumber(bad), bad).toBe(false);
    }
  });

  it("escapes the script so punctuation cannot inject TwiML verbs", () => {
    const t = buildTwiml('Say "hi" & <Hangup/>');
    expect(t).not.toMatch(/<Hangup\/>/);
    expect(t).toContain("&amp;");
    expect(t).toContain("&lt;Hangup");
  });
});

describe("it reports the provider's own refusal", () => {
  it("passes Twilio's message through, which is what makes a trial-account failure diagnosable", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ message: "The number +1555 is unverified. Trial accounts cannot call unverified numbers.", code: 21219 }) } as unknown as Response);
    const r = await placeCall({ to: "+15551234567", consent: CONSENT, script: SCRIPT, agentName: "A" }, { env: ENV, fetchImpl });
    expect(r.placed).toBe(false);
    if (!r.placed) {
      expect(r.reason).toMatch(/unverified/);
      expect(r.reason).toMatch(/21219/);
    }
  });

  it("places the call when every rail holds", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok());
    const r = await placeCall({ to: "+15551234567", consent: CONSENT, script: SCRIPT, agentName: "Amara" }, { env: ENV, fetchImpl });
    expect(r.placed).toBe(true);
    if (r.placed) expect(r.sid).toBe("CA123");
  });

  it("says what is missing when Twilio is unconfigured", async () => {
    const r = await placeCall({ to: "+15551234567", consent: CONSENT, script: SCRIPT, agentName: "A" }, { env: {}, fetchImpl: vi.fn() });
    expect(r.placed).toBe(false);
    if (!r.placed) expect(r.reason).toMatch(/TWILIO_ACCOUNT_SID/);
  });
});
