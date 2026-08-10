import { describe, it, expect } from "vitest";
import { emptyQueue, enqueue } from "./decision-queue";
import {
  churnSavePlay,
  customerHealth,
  renewalCheckpoints,
  retentionTick,
  weeklyReceiptReview,
  type CustomerSignal,
  type RetentionCustomer,
} from "./retention-desk";

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_800_000_000_000;
const daysAgo = (d: number) => NOW - d * DAY;

const sig = (kind: CustomerSignal["kind"], atDaysAgo: number, customerId = "cust-1"): CustomerSignal => ({
  customerId,
  at: daysAgo(atDaysAgo),
  kind,
});

const EM_DASH = /[—–]/;

describe("customerHealth — deterministic score from real signals, never a fabricated number", () => {
  it("no signals ⇒ score null + band unknown (health is unknown, not assumed)", () => {
    const h = customerHealth([], { now: NOW });
    expect(h.score).toBeNull();
    expect(h.band).toBe("unknown");
    expect(h.components).toBeNull();
    expect(h.reasons.join(" ")).toContain("unknown, not assumed");
  });

  it("green: active this week, paying, no support load", () => {
    const h = customerHealth(
      [sig("login", 1), sig("build", 2), sig("build", 3), sig("approval", 5), sig("payment-ok", 10)],
      { now: NOW },
    );
    // recency 40 (1 day) + frequency 12 (4 engagement in 30d) + payment 25 + support 10 = 87
    expect(h.score).toBe(87);
    expect(h.band).toBe("green");
    expect(h.components).toEqual({ recency: 40, frequency: 12, payment: 25, support: 10 });
  });

  it("red: long silence + failed payment, with plain-sentence reasons naming the signals", () => {
    const h = customerHealth([sig("login", 21), sig("payment-failed", 8), sig("silence", 3)], { now: NOW });
    // recency 12 (21d) + frequency 6 (1 in window) + payment 0 + support 10 = 28
    expect(h.score).toBe(28);
    expect(h.band).toBe("red");
    expect(h.reasons).toContain("No logins in 21 days.");
    expect(h.reasons.some((r) => r.includes("payment failed"))).toBe(true);
    expect(h.reasons.some((r) => r.includes("silence signal"))).toBe(true);
  });

  it("the LATEST payment signal decides: a recovered card is not held red", () => {
    const failedThenOk = customerHealth([sig("login", 1), sig("payment-failed", 10), sig("payment-ok", 2)], { now: NOW });
    const okThenFailed = customerHealth([sig("login", 1), sig("payment-ok", 10), sig("payment-failed", 2)], { now: NOW });
    expect(failedThenOk.components!.payment).toBe(25);
    expect(okThenFailed.components!.payment).toBe(0);
  });

  it("support load drags the score without ever touching abuse (health ≠ freeze)", () => {
    const calm = customerHealth([sig("login", 1), sig("payment-ok", 5)], { now: NOW });
    const loaded = customerHealth(
      [sig("login", 1), sig("payment-ok", 5), sig("support-ticket", 2), sig("support-ticket", 3), sig("support-ticket", 4), sig("support-ticket", 5), sig("support-ticket", 6)],
      { now: NOW },
    );
    expect(calm.components!.support).toBe(10);
    expect(loaded.components!.support).toBe(0);
    expect(loaded.reasons).toContain("5 support tickets in the last 30 days.");
  });
});

describe("weeklyReceiptReview — receipt-backed digest, honest when empty", () => {
  const customer = { id: "cust-1", name: "Rivera Lab" };

  it("cites every receipt by id, chronologically, and never mints one", () => {
    const review = weeklyReceiptReview(customer, [
      { id: "rcpt-2", title: "Deployed the grading dashboard", at: daysAgo(2) },
      { id: "rcpt-1", title: "Shipped the intake form", at: daysAgo(5) },
    ]);
    expect(review.empty).toBe(false);
    expect(review.receiptIds).toEqual(["rcpt-1", "rcpt-2"]); // ordered oldest first
    expect(review.text).toContain("(receipt rcpt-1)");
    expect(review.text).toContain("(receipt rcpt-2)");
    expect(review.text).toContain("Rivera Lab");
  });

  it("empty week ⇒ the honest conversation-starter, no invented work", () => {
    const review = weeklyReceiptReview(customer, []);
    expect(review.empty).toBe(true);
    expect(review.receiptIds).toEqual([]);
    expect(review.text).toContain("No agent work was receipted for you this week. That is worth a conversation, reply and tell us why.");
  });
});

describe("renewalCheckpoints — the 90/60/30/14 clock, past checkpoints filtered", () => {
  it("far from renewal: all four, in chronological order, with concrete actions", () => {
    const end = NOW + 120 * DAY;
    const cps = renewalCheckpoints(end, NOW);
    expect(cps.map((c) => c.daysOut)).toEqual([90, 60, 30, 14]);
    expect(cps[0].action).toContain("value review");
    expect(cps[1].action).toContain("expansion conversation");
    expect(cps[2].action).toContain("renewal paperwork");
    expect(cps[3].action).toContain("founder call");
    expect(cps.every((c) => c.at === end - c.daysOut * DAY)).toBe(true);
  });

  it("50 days out: the 90 and 60 day checkpoints are past and gone", () => {
    const cps = renewalCheckpoints(NOW + 50 * DAY, NOW);
    expect(cps.map((c) => c.daysOut)).toEqual([30, 14]);
  });

  it("contract already ended ⇒ empty list, nothing invented", () => {
    expect(renewalCheckpoints(NOW - DAY, NOW)).toEqual([]);
  });
});

describe("churnSavePlay — red band escalates to the founder as a real EnqueueInput", () => {
  const customer = { id: "cust-1", name: "Rivera Lab" };

  it("red band ⇒ EnqueueInput with reasons + a proposed play; enqueue() accepts it as-is", () => {
    const health = customerHealth([sig("login", 40), sig("payment-failed", 8)], { now: NOW });
    expect(health.band).toBe("red");
    const save = churnSavePlay(health, customer);
    expect(save).not.toBeNull();
    // shape matches EnqueueInput exactly
    expect(save!.kind).toBe("other");
    expect(typeof save!.title).toBe("string");
    expect(typeof save!.summary).toBe("string");
    expect(typeof save!.artifact).toBe("string");
    expect(save!.preparedBy).toBe("retention-desk");
    expect(save!.summary).toContain("Rivera Lab");
    expect(save!.artifact).toContain("failed payment");
    expect(save!.artifact).toContain("Nothing above executes automatically.");
    // the real decision queue accepts it — the integration is proven, not assumed
    const q = enqueue(emptyQueue(), save!, { now: NOW, id: "d1" });
    expect(q.items[0].status).toBe("pending");
    expect(q.items[0].title).toContain("Churn risk");
  });

  it("green, yellow, and unknown bands ⇒ null (no escalation noise)", () => {
    const green = customerHealth([sig("login", 1), sig("build", 2), sig("build", 3), sig("approval", 4), sig("payment-ok", 5)], { now: NOW });
    expect(green.band).toBe("green");
    expect(churnSavePlay(green, customer)).toBeNull();
    const unknown = customerHealth([], { now: NOW });
    expect(churnSavePlay(unknown, customer)).toBeNull();
  });
});

describe("retentionTick — one call for the daily cron", () => {
  it("zero customers ⇒ armed-and-waiting note, nothing fabricated", () => {
    const tick = retentionTick([], { now: NOW });
    expect(tick.reviews).toEqual([]);
    expect(tick.escalations).toEqual([]);
    expect(tick.checkpointsDue).toEqual([]);
    expect(tick.note).toBe("No customers yet. The retention desk is armed and waiting for customer number one.");
  });

  it("full pass: reviews for everyone, escalations only for red, checkpoints only inside the window", () => {
    const healthy: RetentionCustomer = {
      id: "cust-1",
      name: "Rivera Lab",
      signals: [sig("login", 1), sig("build", 2), sig("build", 3), sig("approval", 4), sig("payment-ok", 5)],
      contractEndMs: NOW + 30 * DAY + 60 * 60 * 1000, // the 30-day checkpoint lands within this tick's day
      weekReceipts: [{ id: "rcpt-9", title: "Weekly ops run", at: daysAgo(1) }],
    };
    const atRisk: RetentionCustomer = {
      id: "cust-2",
      name: "Quiet Co",
      signals: [sig("login", 45, "cust-2"), sig("payment-failed", 9, "cust-2")],
      contractEndMs: NOW + 120 * DAY, // nothing due for weeks
    };
    const tick = retentionTick([healthy, atRisk], { now: NOW });

    expect(tick.reviews).toHaveLength(2);
    expect(tick.reviews[0].receiptIds).toEqual(["rcpt-9"]);
    expect(tick.reviews[1].empty).toBe(true);

    expect(tick.escalations).toHaveLength(1);
    expect(tick.escalations[0].title).toContain("Quiet Co");

    expect(tick.checkpointsDue).toHaveLength(1);
    expect(tick.checkpointsDue[0]).toMatchObject({ customerId: "cust-1", checkpoint: { daysOut: 30 } });

    expect(tick.note).toContain("2 customers");
    expect(tick.note).toContain("1 red-band escalation");
  });
});

describe("honesty rails — no em-dashes in any rendered string", () => {
  it("every string this desk renders is em-dash free", () => {
    const rendered: string[] = [];
    const push = (s: string) => rendered.push(s);

    const health = customerHealth([sig("login", 21), sig("payment-failed", 8), sig("silence", 3), sig("support-ticket", 2)], { now: NOW });
    health.reasons.forEach(push);
    customerHealth([], { now: NOW }).reasons.forEach(push);

    push(weeklyReceiptReview({ id: "c", name: "Rivera Lab" }, [{ id: "r1", title: "Shipped a thing", at: NOW }]).text);
    push(weeklyReceiptReview({ id: "c", name: "Rivera Lab" }, []).text);

    renewalCheckpoints(NOW + 120 * DAY, NOW).forEach((c) => push(c.action));

    const save = churnSavePlay(health, { id: "c", name: "Rivera Lab" })!;
    push(save.title);
    push(save.summary);
    push(save.artifact);

    push(retentionTick([], { now: NOW }).note);
    push(retentionTick([{ id: "c", name: "Rivera Lab", signals: [] }], { now: NOW }).note);

    expect(rendered.length).toBeGreaterThan(10);
    for (const s of rendered) expect(s).not.toMatch(EM_DASH);
  });
});
