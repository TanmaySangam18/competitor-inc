import { describe, it, expect } from "vitest";
import { explain, summarise } from "./explain";
import { AuditLog, MemoryAuditSink, type AuditEntry } from "./audit";

/** Build a real chained ledger, so these tests exercise the hashing path rather than a fake shape. */
function ledger(rows: Array<Partial<AuditEntry> & { actor: string; action: string }>) {
  const log = new AuditLog(new MemoryAuditSink());
  for (const r of rows) log.record(r);
  return log;
}

describe("the question it exists to answer: why did the company spend that?", () => {
  const log = ledger([
    { actor: "founder", action: "policy:approve-ad-budget", rationale: "capped at $500/mo", verdict: "AUTO" },
    { actor: "growth-lead", action: "campaign:launch", because: 0, costUsd: 312, rationale: "acquire 100 visitors" },
    { actor: "analytics", action: "campaign:result", because: 1, costUsd: 0, output: "143 visitors, 11 signups" },
  ]);
  const all = log.all();

  it("walks up to the authorising decision", () => {
    const x = explain(1, all, true)!;
    expect(x.authorisedBy.map((l) => l.seq)).toEqual([0]);
    expect(x.authorisedBy[0].actor).toBe("founder");
  });

  it("reports what the action cost and what it caused", () => {
    const x = explain(1, all, true)!;
    expect(x.directCostUsd).toBe(312);
    expect(x.ledTo.map((l) => l.seq)).toEqual([2]);
  });

  it("sums the whole subtree, not just the one row", () => {
    const deep = ledger([
      { actor: "founder", action: "approve" },
      { actor: "a", action: "spend", because: 0, costUsd: 10 },
      { actor: "b", action: "spend", because: 1, costUsd: 5.005 },
      { actor: "c", action: "spend", because: 2, costUsd: 1 },
    ]);
    // And it rounds to cents, because a money figure shown to a customer must not drift.
    expect(explain(1, deep.all(), true)!.totalCostUsd).toBe(16.01);
  });

  it("summarises in one line a human can read", () => {
    const s = summarise(explain(1, all, true)!);
    expect(s).toContain("growth-lead");
    expect(s).toContain("$312.00");
    expect(s).toMatch(/Authorised by founder \(entry 0\)/);
  });
});

describe("IT REFUSES TO INVENT THE WHY", () => {
  it("says the reason was never recorded rather than guessing from timestamps", () => {
    const log = ledger([
      { actor: "founder", action: "something-earlier" },
      { actor: "growth-lead", action: "campaign:launch", costUsd: 312 }, // no `because`
    ]);
    const x = explain(1, log.all(), true)!;
    expect(x.authorisedBy).toEqual([]);
    // The entry directly above it in time is NOT presented as the cause.
    expect(x.gaps).toContain("No authorising decision was recorded for this action.");
  });

  it("names a spend with no recorded outcome, which is the most common real question", () => {
    const log = ledger([{ actor: "growth-lead", action: "campaign:launch", costUsd: 312, rationale: "why" }]);
    const x = explain(0, log.all(), true)!;
    expect(x.gaps.join(" ")).toMatch(/no resulting outcome was recorded/i);
  });

  it("names a missing rationale", () => {
    const log = ledger([{ actor: "a", action: "x" }]);
    expect(explain(0, log.all(), true)!.gaps.join(" ")).toMatch(/No rationale was written/);
  });

  it("names a dangling authorisation instead of silently dropping it", () => {
    const log = ledger([{ actor: "a", action: "x", because: 99 }]);
    const x = explain(0, log.all(), true)!;
    expect(x.gaps.join(" ")).toMatch(/cites entry 99 .* not in the ledger/);
  });
});

describe("a broken chain invalidates the whole explanation", () => {
  it("says so first and refuses to stand behind anything else", () => {
    const log = ledger([{ actor: "founder", action: "approve" }, { actor: "a", action: "spend", because: 0, costUsd: 9 }]);
    const x = explain(1, log.all(), false)!;
    expect(x.chainVerified).toBe(false);
    expect(x.gaps.join(" ")).toMatch(/hash chain does not verify/);
    expect(summarise(x)).toMatch(/cannot be explained/i);
  });

  it("really does break when a past entry is edited, so chainVerified is not decorative", () => {
    const log = ledger([{ actor: "founder", action: "approve", costUsd: 1 }, { actor: "a", action: "spend", because: 0 }]);
    expect(log.verifyIntegrity().ok).toBe(true);
    // Tamper with the causal link itself — it is inside the hash precisely so this is detectable.
    (log.all()[0] as { because?: number }).because = 5;
    expect(log.verifyIntegrity().ok).toBe(false);
  });
});

describe("it terminates on a corrupted ledger instead of hanging a request", () => {
  it("survives a two-node authorisation cycle", () => {
    const log = ledger([{ actor: "a", action: "x", because: 1 }, { actor: "b", action: "y", because: 0 }]);
    const x = explain(0, log.all(), true)!;
    expect(x.gaps.join(" ")).toMatch(/loops at entry/);
  });

  it("survives an entry citing itself", () => {
    const log = ledger([{ actor: "a", action: "x", because: 0 }]);
    expect(explain(0, log.all(), true)!.gaps.join(" ")).toMatch(/loops at entry 0/);
  });

  it("survives a cycle among descendants", () => {
    const log = ledger([
      { actor: "root", action: "approve" },
      { actor: "a", action: "x", because: 0, costUsd: 1 },
      { actor: "b", action: "y", because: 1, costUsd: 1 },
    ]);
    (log.all()[1] as { because?: number }).because = 2; // 1 → 2 → 1
    const x = explain(0, log.all(), true)!;
    expect(x.totalCostUsd).toBeLessThanOrEqual(2); // counted once each, not forever
  });

  it("returns null for an entry that does not exist", () => {
    expect(explain(42, ledger([{ actor: "a", action: "x" }]).all(), true)).toBeNull();
  });
});

describe("house style holds in customer-facing strings", () => {
  it("has no em-dashes in any gap or summary", () => {
    const log = ledger([{ actor: "a", action: "x", costUsd: 5, because: 99 }]);
    const x = explain(0, log.all(), false)!;
    for (const s of [...x.gaps, summarise(x)]) expect(s, s).not.toMatch(/—/);
  });
});
