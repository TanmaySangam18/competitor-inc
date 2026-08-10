import { describe, it, expect } from "vitest";
import {
  reconcile,
  closeArtifact,
  signedClose,
  verifySignedClose,
  isCloseDay,
  type MoneyRow,
  type ReconcileInputs,
} from "./monthly-close";

const EM_DASH = /[—–]/; // founder-facing prose rule: no em/en dashes, ever
const MONTH = "2026-07";

const POLAR: MoneyRow[] = [
  { id: "ord_1", amountUsd: 49, occurredAt: "2026-07-03T10:00:00Z", kind: "order.paid" },
  { id: "ord_2", amountUsd: 199, occurredAt: "2026-07-15T10:00:00Z", kind: "order.paid" },
];
const RECORDED: MoneyRow[] = [
  { id: "ord_1", amountUsd: 49, occurredAt: "2026-07-03T10:00:05Z" },
  { id: "ord_2", amountUsd: 199, occurredAt: "2026-07-15T10:00:05Z" },
];
const LEDGER: MoneyRow[] = [{ id: "bank_77", amountUsd: 248, occurredAt: "2026-07-31T00:00:00Z", kind: "deposit" }];

const inputs = (over: Partial<ReconcileInputs> = {}): ReconcileInputs => ({
  month: MONTH,
  polarEvents: POLAR,
  revenueEvents: RECORDED,
  treasuryLedger: LEDGER,
  ...over,
});

describe("reconcile — the three-way match", () => {
  it("happy path: Polar, revenue_events and treasury inflows agree → clean", () => {
    const r = reconcile(inputs());
    expect(r).toMatchObject({ month: MONTH, settledUsd: 248, recordedUsd: 248, ledgerUsd: 248, clean: true });
    expect(r.settledCount).toBe(2);
    expect(r.recordedCount).toBe(2);
    expect(r.ledgerCount).toBe(1);
    expect(r.discrepancies).toEqual([]);
  });

  it("empty inputs reconcile clean at $0.00 — an honest zero month, not an error", () => {
    const r = reconcile(inputs({ polarEvents: [], revenueEvents: [], treasuryLedger: [] }));
    expect(r).toMatchObject({ settledUsd: 0, recordedUsd: 0, ledgerUsd: 0, clean: true });
  });

  it("missing recorded event: Polar settled it, revenue_events has no row", () => {
    const r = reconcile(inputs({ revenueEvents: [RECORDED[0]], treasuryLedger: LEDGER }));
    expect(r.clean).toBe(false);
    const d = r.discrepancies.find((x) => x.kind === "missing-recorded");
    expect(d).toBeDefined();
    expect(d!.amountUsd).toBe(199);
    expect(d!.detail).toContain("ord_2");
  });

  it("missing settled order: revenue_events row with nothing behind it in Polar", () => {
    const r = reconcile(
      inputs({ revenueEvents: [...RECORDED, { id: "ghost_9", amountUsd: 20, occurredAt: "2026-07-20T00:00:00Z" }] }),
    );
    const d = r.discrepancies.find((x) => x.kind === "missing-settled");
    expect(d).toBeDefined();
    expect(d!.amountUsd).toBe(20);
    expect(d!.detail).toContain("ghost_9");
    expect(r.clean).toBe(false);
  });

  it("amount mismatch on the same id reports the absolute difference", () => {
    const r = reconcile(
      inputs({ revenueEvents: [{ id: "ord_1", amountUsd: 39, occurredAt: "2026-07-03T10:00:05Z" }, RECORDED[1]] }),
    );
    const d = r.discrepancies.find((x) => x.kind === "amount-mismatch");
    expect(d).toBeDefined();
    expect(d!.amountUsd).toBe(10);
    expect(d!.detail).toContain("ord_1");
  });

  it("ledger mismatch: treasury inflow total disagrees with the settled total", () => {
    const r = reconcile(inputs({ treasuryLedger: [{ id: "bank_77", amountUsd: 200, occurredAt: "2026-07-31T00:00:00Z" }] }));
    const d = r.discrepancies.find((x) => x.kind === "ledger-mismatch");
    expect(d).toBeDefined();
    expect(d!.amountUsd).toBe(48);
    expect(r.clean).toBe(false);
  });

  it("rows outside the close month are excluded before matching", () => {
    const r = reconcile(
      inputs({
        polarEvents: [...POLAR, { id: "ord_june", amountUsd: 500, occurredAt: "2026-06-30T23:59:00Z" }],
        revenueEvents: [...RECORDED, { id: "ord_aug", amountUsd: 500, occurredAt: "2026-08-01T00:01:00Z" }],
      }),
    );
    expect(r.settledUsd).toBe(248); // June order never entered July's books
    expect(r.recordedUsd).toBe(248);
    expect(r.clean).toBe(true); // and neither out-of-month row produced a phantom discrepancy
  });
});

describe("closeArtifact — the close document", () => {
  it("clean books render totals and the match line", () => {
    const doc = closeArtifact(reconcile(inputs()));
    expect(doc).toContain(`# Monthly close: ${MONTH}`);
    expect(doc).toContain("Settled per Polar (merchant of record): $248.00 across 2 orders");
    expect(doc).toContain("No discrepancies. Books match.");
    expect(doc).toContain("Settled revenue this month: $248.00.");
  });

  it("discrepant books render the discrepancy table, never smoothed over", () => {
    const doc = closeArtifact(reconcile(inputs({ revenueEvents: [RECORDED[0]] })));
    expect(doc).not.toContain("Books match");
    expect(doc).toContain("| missing-recorded |");
    expect(doc).toContain("$199.00");
  });

  it("HONESTY: a zero-revenue month is stated plainly", () => {
    const doc = closeArtifact(reconcile(inputs({ polarEvents: [], revenueEvents: [], treasuryLedger: [] })));
    expect(doc).toContain("No settled revenue this month. Zero is the real number, stated plainly.");
    expect(doc).toContain("$0.00");
  });

  it("STYLE: no em-dash or en-dash in any rendered artifact", () => {
    const clean = closeArtifact(reconcile(inputs()));
    const dirty = closeArtifact(reconcile(inputs({ revenueEvents: [], treasuryLedger: [] })));
    const zero = closeArtifact(reconcile(inputs({ polarEvents: [], revenueEvents: [], treasuryLedger: [] })));
    expect(clean).not.toMatch(EM_DASH);
    expect(dirty).not.toMatch(EM_DASH);
    expect(zero).not.toMatch(EM_DASH);
  });
});

describe("signedClose — the verifiable close receipt", () => {
  const SECRET = "test-close-secret";

  it("signs the exact artifact body and verifies round-trip", () => {
    const recon = reconcile(inputs());
    const signed = signedClose(recon, SECRET);
    expect(signed).not.toBeNull();
    expect(signed!.month).toBe(MONTH);
    expect(signed!.body).toBe(closeArtifact(recon));
    expect(signed!.signature).toMatch(/^[0-9a-f]{64}$/); // HMAC-SHA256 hex, receipt-sign scheme
    expect(verifySignedClose(signed!, SECRET)).toBe(true);
  });

  it("a tampered body or wrong secret fails verification", () => {
    const signed = signedClose(reconcile(inputs()), SECRET)!;
    expect(verifySignedClose({ body: signed.body + " edited", signature: signed.signature }, SECRET)).toBe(false);
    expect(verifySignedClose(signed, "some-other-secret")).toBe(false);
    expect(verifySignedClose({ body: signed.body, signature: "deadbeef" }, SECRET)).toBe(false);
  });

  it("FAIL-CLOSED: no secret means no signed close, never an unverifiable stamp", () => {
    expect(signedClose(reconcile(inputs()), "")).toBeNull();
    expect(signedClose(reconcile(inputs()), "   ")).toBeNull();
  });
});

describe("isCloseDay — monthly cadence, 1st of the month UTC", () => {
  it("true on the 1st, false otherwise", () => {
    expect(isCloseDay(new Date(Date.UTC(2026, 7, 1, 6)))).toBe(true); // 2026-08-01
    expect(isCloseDay(new Date(Date.UTC(2026, 7, 2)))).toBe(false);
    expect(isCloseDay(new Date(Date.UTC(2026, 7, 31)))).toBe(false);
    expect(isCloseDay(new Date(Date.UTC(2026, 8, 1)))).toBe(true); // 2026-09-01
  });
});
