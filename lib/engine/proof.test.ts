import { describe, it, expect } from "vitest";
import { classifyProof } from "./proof";

describe("classifyProof — proof-type tagging for the ledger", () => {
  it("tags a shipped build", () => {
    expect(classifyProof("build", "Built the landing site").label).toBe("Shipped build");
  });
  it("tags a verified metric", () => {
    expect(classifyProof("metric", "Demand test converted at 8%").label).toBe("Verified metric");
  });
  it("tags a plain receipted URL as a live link", () => {
    expect(classifyProof("url", "Deployed the marketing page").label).toBe("Live link");
  });
  it("tags an outreach/email URL as a delivered message", () => {
    expect(classifyProof("url", "Sent the launch email to the waitlist").label).toBe("Delivered message");
    expect(classifyProof("url", "Ran an outreach campaign").label).toBe("Delivered message");
  });
  it("falls back to a generic receipt when the kind is unknown", () => {
    expect(classifyProof(null, "something happened").label).toBe("Receipt");
  });
  it("defaults the ring to 'ours' (Ring-0 dogfood) and carries an explicit customer ring", () => {
    expect(classifyProof("build", "x").ring).toBe("ours");
    expect(classifyProof("url", "x", "customer").ring).toBe("customer");
  });
});
