import { describe, it, expect } from "vitest";
import { deptSelfApprove, CHANNEL_DAILY_CAP } from "./publishing-mandate";

const ok = {
  kind: "bluesky", author: "growth-writer", approver: "growth-lead", approverIsLead: true,
  honestyVerified: true, disclosed: true, postsTodayOnChannel: 0, audience: "own" as const,
};

describe("department publishing mandate (ADR-0012) — leads approve, rails hold", () => {
  it("a lead-signed, honest, disclosed, capped, own-audience post is APPROVED in-department", () => {
    expect(deptSelfApprove(ok).allow).toBe(true);
  });
  it("each rail failing alone denies: self-approval, no lead, dishonest, undisclosed, cap, scraped", () => {
    expect(deptSelfApprove({ ...ok, approver: ok.author }).allow).toBe(false);
    expect(deptSelfApprove({ ...ok, approverIsLead: false }).allow).toBe(false);
    expect(deptSelfApprove({ ...ok, honestyVerified: false }).reason).toContain("honesty floor");
    expect(deptSelfApprove({ ...ok, disclosed: false }).allow).toBe(false);
    expect(deptSelfApprove({ ...ok, postsTodayOnChannel: CHANNEL_DAILY_CAP }).allow).toBe(false);
    expect(deptSelfApprove({ ...ok, audience: "scraped" }).reason).toContain("forbidden");
    expect(deptSelfApprove({ ...ok, audience: "unknown" }).allow).toBe(false);
  });
  it("non-publish kinds are out of this mandate's lane (money/contracts stay founder-only)", () => {
    expect(deptSelfApprove({ ...ok, kind: "payments" }).allow).toBe(false);
    expect(deptSelfApprove({ ...ok, kind: "sign_contract" }).allow).toBe(false);
  });
});
