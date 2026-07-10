import { describe, it, expect } from "vitest";
import { pickMilestone, draftProgressPost, draftPersonaPost, receiptCardUrl, shouldShare } from "./buildinpublic";
import type { Activity, Company, Proof } from "./types";

const act = (over: Partial<Activity>): Activity => ({
  id: crypto.randomUUID(), night: 1, agent: "engineering", action: "did work", cost: 10, status: "done", ...over,
});
const company = (over: Partial<Company> = {}): Company => ({
  id: "c1", name: "Volt Works", slug: "volt", idea: "EV thing", createdAt: 0, status: "operating", night: 2,
  ledger: { spent: 0, credited: 0, tasksDone: 0, tasksFailed: 0 }, ...over,
});

describe("build-in-public", () => {
  it("picks a proof-bearing milestone over a plain one", () => {
    const m = pickMilestone([
      act({ action: "wrote notes", cost: 5 }),
      act({ action: "Shipped landing page", cost: 20, proof: { kind: "url", value: "https://volt.works" } as Proof }),
    ]);
    expect(m?.action).toBe("Shipped landing page");
  });

  it("returns null when nothing is verified/shareable (never invents progress)", () => {
    expect(pickMilestone([act({ action: "thought about strategy", cost: 0, proof: undefined })])).toBeNull();
  });

  it("ignores undone and non-done activities", () => {
    expect(pickMilestone([act({ action: "Shipped", undone: true, proof: { kind: "build", value: "x" } as Proof })])).toBeNull();
    expect(pickMilestone([act({ action: "Shipped", status: "failed-credited" })])).toBeNull();
  });

  it("drafts an honest post with the proof + platform attribution", () => {
    const post = draftProgressPost(company(), [act({ action: "Deployed the site", cost: 40, proof: { kind: "url", value: "https://volt.works" } as Proof })]);
    expect(post).toContain("Volt Works");
    expect(post).toContain("https://volt.works");
    expect(post).toContain("competitor.inc");
    expect(post!.length).toBeLessThanOrEqual(300);
  });

  it("only shares with consent + operating + a real milestone", () => {
    const acts = [act({ action: "Shipped", proof: { kind: "build", value: "sha" } as Proof })];
    expect(shouldShare(company({ shareInPublic: false }), acts)).toBe(false);
    expect(shouldShare(company({ shareInPublic: true, status: "validating" }), acts)).toBe(false);
    expect(shouldShare(company({ shareInPublic: true }), acts)).toBe(true);
    expect(shouldShare(company({ shareInPublic: true }), [act({ action: "mused", cost: 0 })])).toBe(false);
  });
});

describe("receipts campaign — persona-authored posts (slice 2)", () => {
  it("a shipped build is signed by Vera · CTO, clearly AI, with the real URL — and overnight only when true", () => {
    const acts = [act({ action: "Shipped the booking app", cost: 30, proof: { kind: "url", value: "https://x-post-two.vercel.app" } as Proof })];
    const p = draftPersonaPost(company(), acts, { overnight: true })!;
    expect(p).toContain("Vera · Chief Technology Officer");
    expect(p).toContain("https://x-post-two.vercel.app");
    expect(p).toContain("while the founder slept");
    expect(p).toContain("I'm an AI employee");
    const day = draftPersonaPost(company(), acts)!;
    expect(day).not.toContain("while the founder slept"); // the line is only written when it is TRUE
  });

  it("a verified metric is signed by Kenji · Analytics; nothing verified ⇒ null (never invents)", () => {
    const metric = draftPersonaPost(company(), [act({ action: "Closed the experiment", proof: { kind: "metric", value: "6.1% conversion" } as Proof })])!;
    expect(metric).toContain("Kenji · Head of Analytics");
    expect(metric).toContain("6.1% conversion");
    expect(draftPersonaPost(company(), [act({ action: "wrote notes", status: "done" })])).toBeNull();
    expect(draftPersonaPost(company(), [])).toBeNull();
  });

  it("receiptCardUrl builds the slice-1 route URL (which re-verifies liveness itself)", () => {
    const u = receiptCardUrl("https://competitor.inc/", "Booking app", "https://x.vercel.app", "8px rhythm");
    expect(u).toBe("https://competitor.inc/api/receipt-card?title=Booking+app&url=https%3A%2F%2Fx.vercel.app&review=8px+rhythm");
  });
});
