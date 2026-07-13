import { describe, it, expect } from "vitest";
import { conversation, conversationFrom, conversationSlackText, initialsOf } from "./conversation";
import { deliberate } from "./deliberate";

describe("team room — the watchable conversation", () => {
  it("initialsOf builds clean avatar initials from any title", () => {
    expect(initialsOf("Chief Executive Officer")).toBe("CEO");
    expect(initialsOf("Product Manager")).toBe("PM");
    expect(initialsOf("Software Engineer")).toBe("SE");
    expect(initialsOf("")).toBe("?");
  });

  it("renders open → positions → decision, chair opens and closes", async () => {
    const record = await deliberate("build a booking tool for a dog groomer");
    const convo = conversationFrom(record);
    expect(convo.turns[0].kind).toBe("open");
    expect(convo.turns[convo.turns.length - 1].kind).toBe("decision");
    // chair frames and calls it — same speaker on the bookends
    expect(convo.turns[0].title).toBe(record.decidedBy);
    expect(convo.turns[convo.turns.length - 1].title).toBe(record.decidedBy);
    // every convened panelist speaks between the bookends
    const positions = convo.turns.filter((t) => t.kind === "position");
    expect(positions.length).toBe(record.positions.length - 1);
    // orders are contiguous
    expect(convo.turns.map((t) => t.order)).toEqual(convo.turns.map((_, i) => i));
  });

  it("a high-consequence task escalates to the founder — surfaced, not hidden", async () => {
    const convo = await conversation("wire a $5000 payment to a vendor");
    expect(convo.decision).toBe("escalate-to-founder");
    const decision = convo.turns[convo.turns.length - 1];
    expect(decision.text).toMatch(/founder/i);
  });

  it("carries the honest simulated flag (no model key in test env)", async () => {
    const convo = await conversation("plan the launch");
    expect(convo.simulated).toBe(true);
  });

  it("is deterministic — same task, same conversation", async () => {
    const a = await conversation("design an onboarding flow");
    const b = await conversation("design an onboarding flow");
    expect(a.turns.map((t) => t.text)).toEqual(b.turns.map((t) => t.text));
  });

  it("Slack rendering includes the task, each speaker, and the honesty note", async () => {
    const convo = await conversation("refactor the billing page");
    const text = conversationSlackText(convo);
    expect(text).toContain("Team room");
    expect(text).toContain(convo.decidedBy);
    expect(text).toMatch(/live reasoning wakes/i);
  });
});
