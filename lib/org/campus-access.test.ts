import { describe, it, expect } from "vitest";
import { isCampusEmail, campusAccessGate, mayFollowUp, withUnsubscribe, type CampusMember } from "./campus-access";

describe("campus access — the Northeastern dogfood gate", () => {
  it("accepts real NU addresses + subdomains, rejects look-alikes", () => {
    expect(isCampusEmail("sangam.d@northeastern.edu")).toBe(true);
    expect(isCampusEmail("x@husky.northeastern.edu")).toBe(true);
    expect(isCampusEmail("X@Northeastern.EDU")).toBe(true); // case-insensitive
    expect(isCampusEmail("x@northeastern.edu.evil.com")).toBe(false);
    expect(isCampusEmail("x@notnortheastern.edu")).toBe(false);
    expect(isCampusEmail("x@gmail.com")).toBe(false);
    expect(isCampusEmail("")).toBe(false);
    expect(isCampusEmail(undefined)).toBe(false);
  });

  it("access requires a VERIFIED NU email (unverified = pending, not allowed)", () => {
    expect(campusAccessGate({ email: "a@northeastern.edu", verifiedAt: Date.now() }).allowed).toBe(true);
    expect(campusAccessGate({ email: "a@northeastern.edu" }).allowed).toBe(false); // unverified
    expect(campusAccessGate({ email: "a@gmail.com", verifiedAt: Date.now() }).allowed).toBe(false); // wrong domain
  });

  describe("follow-ups are opt-in only (the anti-spam rail)", () => {
    const base: CampusMember = { email: "a@northeastern.edu", verifiedAt: Date.now(), consentedFollowups: true };
    it("allows a verified, opted-in member", () => {
      expect(mayFollowUp(base).allowed).toBe(true);
    });
    it("blocks without consent, without verification, and forever after unsubscribe", () => {
      expect(mayFollowUp({ ...base, consentedFollowups: false }).allowed).toBe(false);
      expect(mayFollowUp({ ...base, verifiedAt: undefined }).allowed).toBe(false);
      expect(mayFollowUp({ ...base, unsubscribedAt: Date.now() }).allowed).toBe(false);
    });
  });

  it("every message gets an unsubscribe footer (idempotent)", () => {
    const once = withUnsubscribe("Hey, your build shipped.", "https://x.co/u/abc");
    expect(once).toMatch(/unsubscribe/i);
    expect(once).toContain("https://x.co/u/abc");
    // already has one → unchanged
    expect(withUnsubscribe(once, "https://x.co/u/abc")).toBe(once);
  });
});
