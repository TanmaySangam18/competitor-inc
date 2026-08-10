import { describe, it, expect } from "vitest";
import type { IncidentPayload } from "@/lib/loop/incident";
import {
  BLAMELESS_LINE,
  draftPostmortem,
  formatDuration,
  openActionItems,
  postmortemSlug,
  requiresPostmortem,
  type ActionItem,
  type PostmortemInput,
} from "./postmortem";

const T0 = Date.UTC(2026, 7, 6, 1, 0); // 2026-08-06 01:00 UTC
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const incident: IncidentPayload = {
  source: "sentry",
  title: "Payment webhook outage",
  detail: "Polar webhook deliveries failed for 90 minutes; no revenue events were recorded during the window.",
  severity: "high",
};

const fullInput: PostmortemInput = {
  incident,
  detectedAt: T0,
  resolvedAt: T0 + 90 * MIN,
  timeline: [
    { at: T0 + 5 * MIN, entry: "Eng agents began triage in #eng" }, // deliberately out of order
    { at: T0, entry: "Sentry alert fired on webhook 500s" },
    { at: T0 + 88 * MIN, entry: "Fix deployed, deliveries confirmed green" },
  ],
  contributingFactors: [
    "The webhook route had no retry queue, so transient DB errors dropped deliveries",
    "No alert existed on webhook failure rate until the outage",
  ],
  whatWorked: ["The incident loop classified high severity and queued to the human within one tick"],
  actionItems: [
    { id: "a1", owner: "engineering", description: "Add a retry queue to the webhook route", dueBy: T0 + 7 * DAY },
    { id: "a2", owner: "ops", description: "Alert on webhook failure rate above 5 percent", dueBy: T0 + 3 * DAY, doneAt: T0 + 2 * DAY },
    { id: "a3", owner: "engineering", description: "Backfill the missed revenue events from Polar" },
  ],
};

describe("requiresPostmortem — severity thresholds", () => {
  it("is mandatory for high and critical, not for low and medium", () => {
    expect(requiresPostmortem("low")).toBe(false);
    expect(requiresPostmortem("medium")).toBe(false);
    expect(requiresPostmortem("high")).toBe(true);
    expect(requiresPostmortem("critical")).toBe(true);
  });
});

describe("draftPostmortem — the blameless doc", () => {
  const doc = draftPostmortem(fullInput);

  it("contains the standing blameless-by-policy line", () => {
    expect(doc).toContain(BLAMELESS_LINE);
    expect(doc).toContain("blameless by policy");
  });

  it("computes the duration from detectedAt/resolvedAt as Xh Ym", () => {
    expect(doc).toContain("Duration: 1h 30m");
  });

  it("renders the timeline table sorted by time, every entry present", () => {
    expect(doc).toContain("| Time (UTC) | Entry |");
    expect(doc).toContain("| 2026-08-06 01:00 | Sentry alert fired on webhook 500s |");
    expect(doc).toContain("| 2026-08-06 01:05 | Eng agents began triage in #eng |");
    expect(doc).toContain("| 2026-08-06 02:28 | Fix deployed, deliveries confirmed green |");
    // sorted: the 01:00 alert precedes the 01:05 triage even though the input listed triage first
    expect(doc.indexOf("Sentry alert fired")).toBeLessThan(doc.indexOf("Eng agents began triage"));
  });

  it("renders contributing factors, what worked, and the action items table with owners and status", () => {
    expect(doc).toContain("## Contributing factors (systems, not people)");
    expect(doc).toContain("- The webhook route had no retry queue");
    expect(doc).toContain("- The incident loop classified high severity");
    expect(doc).toContain("| ID | Owner (role) | Description | Due | Status |");
    expect(doc).toContain("| a1 | engineering | Add a retry queue to the webhook route | 2026-08-13 | open |");
    expect(doc).toContain("| a2 | ops | Alert on webhook failure rate above 5 percent | 2026-08-09 | done |");
    expect(doc).toContain("| a3 | engineering | Backfill the missed revenue events from Polar | none set | open |");
  });

  it("renders impact from the incident detail and the summary numbers", () => {
    expect(doc).toContain("Severity: high (source: sentry)");
    expect(doc).toContain("Polar webhook deliveries failed for 90 minutes");
  });

  it("honesty floor: empty inputs render honest none-yet lines, never invented content", () => {
    const empty = draftPostmortem({
      incident: { source: "manual", title: "Bare incident", severity: "high" },
      detectedAt: T0,
      resolvedAt: T0,
      timeline: [],
      contributingFactors: [],
      whatWorked: [],
      actionItems: [],
    });
    expect(empty).toContain("No timeline entries recorded yet.");
    expect(empty).toContain("No contributing factors recorded yet.");
    expect(empty).toContain("Nothing recorded yet.");
    expect(empty).toContain("No action items recorded yet.");
    expect(empty).toContain("No impact detail recorded yet.");
    expect(empty).toContain("Duration: 0h 0m");
  });

  it("no rendered string contains an em-dash or en-dash", () => {
    expect(doc).not.toMatch(/[—–]/);
    expect(BLAMELESS_LINE).not.toMatch(/[—–]/);
  });
});

describe("formatDuration", () => {
  it("renders Xh Ym and clamps negative spans to zero", () => {
    expect(formatDuration(90 * MIN)).toBe("1h 30m");
    expect(formatDuration(25 * HOUR + 5 * MIN)).toBe("25h 5m");
    expect(formatDuration(0)).toBe("0h 0m");
    expect(formatDuration(-HOUR)).toBe("0h 0m");
  });
});

describe("openActionItems — the tracker", () => {
  const now = T0 + 10 * DAY;
  const items: ActionItem[] = [
    { id: "a1", owner: "engineering", description: "overdue and open", dueBy: T0 + 7 * DAY },
    { id: "a2", owner: "ops", description: "done, drops out", dueBy: T0 + 3 * DAY, doneAt: T0 + 2 * DAY },
    { id: "a3", owner: "engineering", description: "open, no due date" },
    { id: "a4", owner: "growth", description: "open, due in the future", dueBy: now + DAY },
  ];

  it("returns only items not marked done, with overdue flagged", () => {
    const open = openActionItems(items, { now });
    expect(open.map((o) => o.item.id)).toEqual(["a1", "a3", "a4"]);
    expect(open.find((o) => o.item.id === "a1")!.overdue).toBe(true);
    expect(open.find((o) => o.item.id === "a3")!.overdue).toBe(false); // no due date is never overdue
    expect(open.find((o) => o.item.id === "a4")!.overdue).toBe(false);
  });

  it("accepts whole postmortem docs and flattens their action items", () => {
    const open = openActionItems([fullInput], { now });
    expect(open.map((o) => o.item.id)).toEqual(["a1", "a3"]); // a2 is done
    expect(open.find((o) => o.item.id === "a1")!.overdue).toBe(true);
  });

  it("honest empty: no docs means no items, not an error", () => {
    expect(openActionItems([], { now })).toEqual([]);
  });
});

describe("postmortemSlug — stable filenames", () => {
  it("builds date-title slugs", () => {
    expect(postmortemSlug(incident, T0)).toBe("2026-08-06-payment-webhook-outage");
    expect(postmortemSlug(incident, new Date(T0))).toBe("2026-08-06-payment-webhook-outage");
  });

  it("collapses punctuation and never returns an empty title part", () => {
    expect(postmortemSlug({ ...incident, title: "DB: 100% CPU!! (prod)" }, T0)).toBe("2026-08-06-db-100-cpu-prod");
    expect(postmortemSlug({ ...incident, title: "!!!" }, T0)).toBe("2026-08-06-incident");
  });
});
