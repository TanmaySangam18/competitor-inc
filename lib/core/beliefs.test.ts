import { describe, it, expect } from "vitest";
import {
  emptyStore, assertBelief, believe, currentBeliefs, retract, history, entityView,
  contradictions, canBackAClaim, claimSupport, unciteable, beliefStats,
  type BeliefStore,
} from "./beliefs";

const T0 = Date.UTC(2026, 0, 1);
const DAY = 86_400_000;

/** Build a store by replaying asserts, so tests read as a timeline rather than a fixture. */
function timeline(steps: Array<[number, Parameters<typeof assertBelief>[1]]>): BeliefStore {
  return steps.reduce((s, [at, input]) => assertBelief(s, input, at).store, emptyStore());
}

describe("beliefs expire, which notes never do", () => {
  it("closes the old belief instead of leaving both retrievable", () => {
    // THE failure this fixes. In a flat note store, "acme is on builder" and "acme is on operator" both
    // survive and whichever embeds closer to the question wins.
    const store = timeline([
      [T0, { subject: "customer:acme", predicate: "plan", object: "builder", provenance: "observed", source: "receipt_1" }],
      [T0 + 30 * DAY, { subject: "customer:acme", predicate: "plan", object: "operator", provenance: "observed", source: "receipt_2" }],
    ]);
    expect(believe(store, "customer:acme", "plan", T0 + 40 * DAY)!.object).toBe("operator");
    expect(currentBeliefs(store, T0 + 40 * DAY)).toHaveLength(1);
  });

  it("still answers what we thought back then", () => {
    const store = timeline([
      [T0, { subject: "customer:acme", predicate: "plan", object: "builder", provenance: "observed", source: "receipt_1" }],
      [T0 + 30 * DAY, { subject: "customer:acme", predicate: "plan", object: "operator", provenance: "observed", source: "receipt_2" }],
    ]);
    expect(believe(store, "customer:acme", "plan", T0 + 10 * DAY)!.object).toBe("builder");
    expect(believe(store, "customer:acme", "plan", T0 - DAY)).toBeNull();
  });

  it("chains the history forward rather than piling it up", () => {
    const store = timeline([
      [T0, { subject: "c:1", predicate: "plan", object: "a", provenance: "observed", source: "s1" }],
      [T0 + DAY, { subject: "c:1", predicate: "plan", object: "b", provenance: "observed", source: "s2" }],
      [T0 + 2 * DAY, { subject: "c:1", predicate: "plan", object: "c", provenance: "observed", source: "s3" }],
    ]);
    const chain = history(store, "c:1", "plan");
    expect(chain.map((b) => b.object)).toEqual(["a", "b", "c"]);
    expect(chain[0].validTo).toBe(T0 + DAY);
    expect(chain[0].supersededBy).toBe(chain[1].id);
    expect(chain[2].validTo).toBeNull();
  });

  it("lets a fact be withdrawn without inventing a replacement", () => {
    const first = assertBelief(emptyStore(), { subject: "c:1", predicate: "contact", object: "sam", provenance: "asserted", source: "email" }, T0);
    const after = retract(first.store, first.belief.id, T0 + DAY);
    expect(believe(after, "c:1", "contact", T0 + 2 * DAY)).toBeNull();
    expect(believe(after, "c:1", "contact", T0)!.object).toBe("sam");
  });
});

describe("repeated observations consolidate rather than compete", () => {
  it("raises the count and confidence instead of storing a duplicate", () => {
    let s = emptyStore();
    for (let i = 0; i < 4; i++) {
      s = assertBelief(s, { subject: "c:1", predicate: "region", object: "eu", provenance: "observed", source: `probe_${i}` }, T0 + i * DAY).store;
    }
    const b = believe(s, "c:1", "region", T0 + 10 * DAY)!;
    expect(s.beliefs).toHaveLength(1);
    expect(b.observedCount).toBe(4);
    expect(b.confidence).toBeGreaterThan(0.9);
    expect(b.confidence).toBeLessThanOrEqual(1);
  });

  it("reports that nothing changed when a belief is merely corroborated", () => {
    const first = assertBelief(emptyStore(), { subject: "c:1", predicate: "region", object: "eu", provenance: "asserted", source: "form" }, T0);
    const again = assertBelief(first.store, { subject: "c:1", predicate: "region", object: "eu", provenance: "asserted", source: "call" }, T0 + DAY);
    expect(again.changed).toBe(false);
    expect(again.superseded).toBeNull();
  });

  it("upgrades provenance when evidence confirms what we were told, and carries the source with it", () => {
    // Getting this wrong would let an "observed" belief cite the assertion it replaced, which is exactly
    // the kind of quiet provenance laundering this module exists to prevent.
    const told = assertBelief(emptyStore(), { subject: "c:1", predicate: "plan", object: "operator", provenance: "asserted", source: "sales-call" }, T0);
    const seen = assertBelief(told.store, { subject: "c:1", predicate: "plan", object: "operator", provenance: "observed", source: "receipt_9" }, T0 + DAY);
    expect(seen.belief.provenance).toBe("observed");
    expect(seen.belief.source).toBe("receipt_9");
    expect(claimSupport(seen.store, "c:1", "plan", T0 + 2 * DAY).supported).toBe(true);
  });
});

describe("contradictions are surfaced, not resolved by guessing", () => {
  it("finds two current beliefs that disagree", () => {
    // Forced by asserting at the same instant, so neither supersedes the other in the valid window.
    const a = assertBelief(emptyStore(), { subject: "c:1", predicate: "plan", object: "builder", provenance: "asserted", source: "form" }, T0);
    const b = { ...a.store, beliefs: [...a.store.beliefs, { ...a.belief, id: "blf_rogue", object: "operator", source: "other-form" }] };
    const found = contradictions(b, T0 + DAY);
    expect(found).toHaveLength(1);
    expect(found[0].beliefs.map((x) => x.object).sort()).toEqual(["builder", "operator"]);
  });

  it("finds none when the store is coherent", () => {
    const store = timeline([
      [T0, { subject: "c:1", predicate: "plan", object: "builder", provenance: "observed", source: "r1" }],
      [T0 + DAY, { subject: "c:1", predicate: "plan", object: "operator", provenance: "observed", source: "r2" }],
      [T0, { subject: "c:2", predicate: "plan", object: "free", provenance: "observed", source: "r3" }],
    ]);
    expect(contradictions(store, T0 + 2 * DAY)).toEqual([]);
  });

  it("resolves a same-instant clash by provenance strength, deterministically", () => {
    const a = assertBelief(emptyStore(), { subject: "c:1", predicate: "plan", object: "guess", provenance: "inferred", source: "model" }, T0);
    const withObserved = {
      ...a.store,
      beliefs: [...a.store.beliefs, { ...a.belief, id: "blf_obs", object: "real", provenance: "observed" as const, source: "receipt" }],
    };
    // Evidence beats a guess, and the answer does not depend on array order or on how it was asked.
    expect(believe(withObserved, "c:1", "plan", T0 + DAY)!.object).toBe("real");
  });
});

describe("only evidence may back a public claim", () => {
  const store = timeline([
    [T0, { subject: "c:1", predicate: "plan", object: "operator", provenance: "observed", source: "receipt_1" }],
    [T0, { subject: "c:1", predicate: "mood", object: "happy", provenance: "asserted", source: "sam on a call" }],
    [T0, { subject: "c:1", predicate: "churn-risk", object: "low", provenance: "inferred", source: "model" }],
  ]);

  it("supports a claim that traces to a receipt", () => {
    const s = claimSupport(store, "c:1", "plan", T0 + DAY);
    expect(s.supported).toBe(true);
    expect(s.reason).toMatch(/observed, source: receipt_1/);
  });

  it("refuses an inferred belief no matter how confident it is", () => {
    // Refused BY GRADE, not by confidence. A confident guess is still a guess, and that distinction is
    // the thing no competitor governs.
    const s = claimSupport(store, "c:1", "churn-risk", T0 + DAY);
    expect(s.supported).toBe(false);
    expect(s.reason).toMatch(/inferred, not observed/i);
  });

  it("refuses something we were merely told, and names who told us", () => {
    const s = claimSupport(store, "c:1", "mood", T0 + DAY);
    expect(s.supported).toBe(false);
    expect(s.reason).toMatch(/told this by sam on a call/i);
    expect(s.reason).toMatch(/not evidence we can cite/i);
  });

  it("refuses a belief labelled observed that carries no source", () => {
    const sourceless = assertBelief(emptyStore(), { subject: "c:9", predicate: "x", object: "y", provenance: "observed", source: "  " }, T0);
    expect(canBackAClaim(sourceless.belief)).toBe(false);
    expect(claimSupport(sourceless.store, "c:9", "x", T0 + DAY).reason).toMatch(/no source/i);
  });

  it("says so plainly when nothing is known", () => {
    expect(claimSupport(store, "c:1", "never-recorded", T0 + DAY).reason).toMatch(/nothing known/i);
  });

  it("lists everything a human must not let the company repeat", () => {
    const flagged = unciteable(store, T0 + DAY);
    expect(flagged.map((b) => b.predicate).sort()).toEqual(["churn-risk", "mood"]);
  });
});

describe("briefing an agent without a search query", () => {
  it("returns everything currently believed about one entity", () => {
    const store = timeline([
      [T0, { subject: "c:1", predicate: "plan", object: "builder", provenance: "observed", source: "r1" }],
      [T0, { subject: "c:1", predicate: "region", object: "eu", provenance: "asserted", source: "form" }],
      [T0 + DAY, { subject: "c:1", predicate: "plan", object: "operator", provenance: "observed", source: "r2" }],
      [T0, { subject: "c:2", predicate: "plan", object: "free", provenance: "observed", source: "r3" }],
    ]);
    const view = entityView(store, "c:1", T0 + 2 * DAY);
    expect(Object.keys(view).sort()).toEqual(["plan", "region"]);
    expect(view.plan.object).toBe("operator"); // the current one, not the superseded one
  });
});

describe("the honesty ratio is measurable", () => {
  it("reports how much of what we believe could actually be said out loud", () => {
    const store = timeline([
      [T0, { subject: "c:1", predicate: "a", object: "1", provenance: "observed", source: "r1" }],
      [T0, { subject: "c:1", predicate: "b", object: "2", provenance: "asserted", source: "form" }],
      [T0, { subject: "c:1", predicate: "c", object: "3", provenance: "inferred", source: "model" }],
      [T0, { subject: "c:1", predicate: "d", object: "4", provenance: "observed", source: "r2" }],
    ]);
    const s = beliefStats(store, T0 + DAY);
    expect(s.current).toBe(4);
    expect(s.byProvenance).toEqual({ observed: 2, asserted: 1, inferred: 1 });
    expect(s.citeableShare).toBe(0.5);
    expect(s.contradictions).toBe(0);
  });

  it("counts superseded beliefs separately from current ones", () => {
    const store = timeline([
      [T0, { subject: "c:1", predicate: "plan", object: "a", provenance: "observed", source: "r1" }],
      [T0 + DAY, { subject: "c:1", predicate: "plan", object: "b", provenance: "observed", source: "r2" }],
    ]);
    const s = beliefStats(store, T0 + 2 * DAY);
    expect(s.total).toBe(2);
    expect(s.current).toBe(1);
    expect(s.superseded).toBe(1);
  });
});

describe("purity, so the store can live anywhere", () => {
  it("never mutates the store it is given", () => {
    const store = timeline([[T0, { subject: "c:1", predicate: "plan", object: "a", provenance: "observed", source: "r1" }]]);
    const snapshot = JSON.stringify(store);
    assertBelief(store, { subject: "c:1", predicate: "plan", object: "b", provenance: "observed", source: "r2" }, T0 + DAY);
    retract(store, "blf_0", T0 + DAY);
    expect(JSON.stringify(store)).toBe(snapshot);
  });

  it("produces identical stores from identical timelines", () => {
    const steps: Array<[number, Parameters<typeof assertBelief>[1]]> = [
      [T0, { subject: "c:1", predicate: "plan", object: "a", provenance: "observed", source: "r1" }],
      [T0 + DAY, { subject: "c:1", predicate: "plan", object: "b", provenance: "asserted", source: "r2" }],
    ];
    expect(JSON.stringify(timeline(steps))).toBe(JSON.stringify(timeline(steps)));
  });
});
