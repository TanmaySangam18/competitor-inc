import { describe, it, expect } from "vitest";
import {
  decide, consecutiveFailures, incidentMessage,
  FAILURES_BEFORE_ACTING, REVERT_WINDOW_MINUTES,
  type Probe, type Deploy,
} from "./incident";

const NOW = new Date("2026-08-22T03:00:00Z");
const minsAgo = (m: number) => new Date(NOW.getTime() - m * 60000).toISOString();
const p = (health: Probe["health"], m = 0): Probe => ({ at: minsAgo(m), health });
const down = (n: number) => Array.from({ length: n }, (_, i) => p("down", n - i));
const deploys = (currentAgeMin: number, goodBefore = true): Deploy[] => [
  { id: "dep-new", at: minsAgo(currentAgeMin), provenHealthy: false },
  { id: "dep-old", at: minsAgo(currentAgeMin + 60), provenHealthy: goodBefore },
];

describe("it will not act on nothing", () => {
  it("does nothing with no probes at all", () => {
    const v = decide({ probes: [], deploys: deploys(5), now: NOW });
    expect(v.act.do).toBe("nothing");
    expect(v.reasoning.join(" ")).toMatch(/absence of data/i);
  });

  it("does nothing while the latest probe is healthy", () => {
    expect(decide({ probes: [p("down", 3), p("up", 0)], deploys: deploys(5), now: NOW }).act.do).toBe("nothing");
  });

  it("treats unknown as unknown rather than as a failure", () => {
    // Acting on an unknown state is how a monitor becomes the outage.
    const v = decide({ probes: [...down(5), p("unknown", 0)], deploys: deploys(5), now: NOW });
    expect(v.act.do).toBe("watch");
    expect(v.reasoning.join(" ")).toMatch(/not the same as a failure/i);
  });
});

describe("one bad probe is noise, three is an outage", () => {
  it("watches below the threshold", () => {
    for (let n = 1; n < FAILURES_BEFORE_ACTING; n++) {
      const v = decide({ probes: down(n), deploys: deploys(5), now: NOW });
      expect(v.act.do, `${n} failures`).toBe("watch");
    }
  });

  it("acts at the threshold", () => {
    expect(decide({ probes: down(FAILURES_BEFORE_ACTING), deploys: deploys(5), now: NOW }).act.do).toBe("revert");
  });

  it("counts only the trailing run, so an old blip does not accumulate", () => {
    expect(consecutiveFailures([p("down", 9), p("up", 8), p("down", 2), p("down", 1)])).toBe(2);
  });

  it("counts degraded as failing, because a slow site is a broken site", () => {
    expect(consecutiveFailures([p("degraded"), p("degraded"), p("degraded")])).toBe(3);
  });
});

describe("THE CENTRAL JUDGEMENT: revert without a human, patch never", () => {
  it("reverts on its own, and says it wrote no new code", () => {
    const v = decide({ probes: down(4), deploys: deploys(10), now: NOW });
    expect(v.act.do).toBe("revert");
    if (v.act.do === "revert") {
      expect(v.act.toDeploy).toBe("dep-old");
      expect(v.act.reversible).toBe(true);
    }
    expect(incidentMessage(v, "your site")).toMatch(/did not write any new code/i);
  });

  it("NEVER applies a patch unattended, only proposes one", () => {
    // No proven-good deploy to return to, which is the case that most tempts autonomous repair.
    const v = decide({ probes: down(4), deploys: deploys(10, false), now: NOW });
    expect(v.act.do).toBe("propose-patch");
    expect("needsHuman" in v.act && v.act.needsHuman).toBe(true);
    expect(incidentMessage(v, "your site")).toMatch(/without your approval/i);
  });

  it("decides by REVERSIBILITY, not by severity, so a worse outage never buys more autonomy", () => {
    const catastrophic = Array.from({ length: 200 }, () => p("down"));
    const v = decide({ probes: catastrophic, deploys: deploys(10, false), now: NOW });
    expect(v.act.do).not.toBe("revert");
    expect(v.act.do).toBe("propose-patch");
  });

  it("proposes rather than reverts when there is no deploy history at all", () => {
    expect(decide({ probes: down(4), deploys: [], now: NOW }).act.do).toBe("propose-patch");
  });
});

describe("it will not revert the wrong thing", () => {
  it("pages a human when the running deploy is too old to be the cause", () => {
    const v = decide({ probes: down(4), deploys: deploys(REVERT_WINDOW_MINUTES + 1), now: NOW });
    expect(v.act.do).toBe("page-human");
    expect(v.reasoning.join(" ")).toMatch(/unlikely to be what broke/i);
  });

  it("still reverts at the edge of the window", () => {
    expect(decide({ probes: down(4), deploys: deploys(REVERT_WINDOW_MINUTES - 1), now: NOW }).act.do).toBe("revert");
  });

  it("refuses to act on an unusable deploy timestamp instead of guessing", () => {
    const bad: Deploy[] = [{ id: "x", at: "not a date", provenHealthy: false }, { id: "y", at: minsAgo(90), provenHealthy: true }];
    const v = decide({ probes: down(4), deploys: bad, now: NOW });
    expect(v.act.do).toBe("page-human");
    expect(v.reasoning.join(" ")).toMatch(/cannot be established|cannot be trusted/i);
  });

  it("refuses when a deploy claims to be from the future", () => {
    const future: Deploy[] = [{ id: "x", at: minsAgo(-30), provenHealthy: false }, { id: "y", at: minsAgo(90), provenHealthy: true }];
    expect(decide({ probes: down(4), deploys: future, now: NOW }).act.do).toBe("page-human");
  });
});

describe("it does not thrash", () => {
  it("pages a human rather than reverting twice", () => {
    const v = decide({ probes: down(6), deploys: deploys(10), now: NOW, revertsAlready: 1 });
    expect(v.act.do).toBe("page-human");
    expect(v.reasoning.join(" ")).toMatch(/was not the cause/i);
  });
});

describe("what the human reads", () => {
  it("leads with plain words, then the reasoning", () => {
    const m = incidentMessage(decide({ probes: down(4), deploys: deploys(10), now: NOW }), "tutorfinder.app");
    expect(m).toContain("tutorfinder.app went down");
    expect(m).toMatch(/Rolling back to the last version that worked/);
    expect(m).toContain("- "); // the reasoning is shown, not just the verdict
  });

  it("has no em-dashes in anything a human sees", () => {
    const cases = [
      decide({ probes: [], deploys: [], now: NOW }),
      decide({ probes: down(1), deploys: deploys(5), now: NOW }),
      decide({ probes: down(4), deploys: deploys(10), now: NOW }),
      decide({ probes: down(4), deploys: deploys(10, false), now: NOW }),
      decide({ probes: down(4), deploys: deploys(999), now: NOW }),
      decide({ probes: down(4), deploys: deploys(10), now: NOW, revertsAlready: 2 }),
    ];
    for (const v of cases) {
      const m = incidentMessage(v, "site");
      expect(m, m).not.toMatch(/—/);
      expect(v.act.because, v.act.because).not.toMatch(/—/);
    }
  });
});
