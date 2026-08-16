import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import {
  requestPublish, withDisclosure, hasDisclosure, publishRails,
  AI_DISCLOSURE, CHANNEL_LIMITS, type PublishAttempt,
} from "./publish-gate";
import { killSwitch } from "./killswitch";
import { auditLog } from "./audit";

const clean = (over: Partial<PublishAttempt> = {}): PublishAttempt => ({
  channel: "bluesky",
  text: withDisclosure("Shipped the migration tonight. Four days, one line."),
  author: "content-writer",
  approver: "marketing-lead",
  approverIsLead: true,
  honestyVerified: true,
  postsTodayOnChannel: 0,
  audience: "own",
  ...over,
});

beforeEach(() => killSwitch.disengageGlobal());

describe("the gate is the only way to get a permit", () => {
  it("grants one when every rail holds", () => {
    const d = requestPublish(clean());
    expect(d.granted).toBe(true);
    if (d.granted) expect(d.text).toContain("AI agent");
  });

  it("carries the cleared text on the permit, so a publisher cannot send something else", () => {
    // The publishers read permit.text rather than a caller argument. If the permit did not carry the
    // text, a caller could pass the gate with one body and send another.
    const d = requestPublish(clean({ text: withDisclosure("exact body") }));
    expect(d.granted).toBe(true);
    if (d.granted) expect(d.text).toBe(withDisclosure("exact body"));
  });
});

describe("rail 1: the kill switch outranks everything", () => {
  it("blocks a post that would otherwise pass every other rail", () => {
    killSwitch.engageGlobal();
    const d = requestPublish(clean());
    expect(d.granted).toBe(false);
    if (!d.granted) {
      expect(d.rail).toBe("kill-switch");
      expect(d.reason).toMatch(/kill switch/i);
    }
  });

  it("blocks a stopped agent specifically", () => {
    killSwitch.stopAgent("content-writer");
    const d = requestPublish(clean());
    expect(d.granted).toBe(false);
    if (!d.granted) expect(d.rail).toBe("kill-switch");
    killSwitch.resumeAgent("content-writer");
  });

  it("blocks a frozen customer", () => {
    killSwitch.freezeCustomer("acme");
    const d = requestPublish(clean({ customer: "acme" }));
    expect(d.granted).toBe(false);
    killSwitch.unfreezeCustomer("acme");
  });
});

describe("rail 2: disclosure is verified in the text, not asserted by the caller", () => {
  it("refuses a post without the named-AI disclosure", () => {
    const d = requestPublish(clean({ text: "Shipped the migration tonight." }));
    expect(d.granted).toBe(false);
    if (!d.granted) {
      expect(d.rail).toBe("disclosure");
      expect(d.reason).toMatch(/disclosure missing/i);
    }
  });

  it("cannot be satisfied by claiming it, only by carrying it", () => {
    // There is deliberately no `disclosed: true` input on PublishAttempt. The gate derives it.
    const attempt = clean({ text: "no disclosure here" }) as PublishAttempt & { disclosed?: boolean };
    attempt.disclosed = true; // a caller trying the obvious trick
    expect(requestPublish(attempt).granted).toBe(false);
  });

  it("adds the disclosure idempotently", () => {
    const once = withDisclosure("hello");
    expect(withDisclosure(once)).toBe(once);
    expect(hasDisclosure(once)).toBe(true);
    expect(once).toContain(AI_DISCLOSURE);
  });
});

describe("rail 3: the five mandate rails, composed not reimplemented", () => {
  it("refuses a scraped audience, which no mandate can clear", () => {
    const d = requestPublish(clean({ audience: "scraped" }));
    expect(d.granted).toBe(false);
    if (!d.granted) expect(d.reason).toMatch(/scraped/i);
  });

  it("refuses an unverified audience", () => {
    expect(requestPublish(clean({ audience: "unknown" })).granted).toBe(false);
  });

  it("refuses when the author signs off their own post", () => {
    const d = requestPublish(clean({ approver: "content-writer" }));
    expect(d.granted).toBe(false);
    if (!d.granted) expect(d.reason).toMatch(/separation of duties/i);
  });

  it("refuses when the approver is not a department lead", () => {
    expect(requestPublish(clean({ approverIsLead: false })).granted).toBe(false);
  });

  it("refuses unbacked claims, because the honesty floor outranks the mandate", () => {
    const d = requestPublish(clean({ honestyVerified: false }));
    expect(d.granted).toBe(false);
    if (!d.granted) expect(d.reason).toMatch(/honesty floor/i);
  });

  it("stops a runaway at the daily cap", () => {
    expect(requestPublish(clean({ postsTodayOnChannel: 5 })).granted).toBe(true);
    const d = requestPublish(clean({ postsTodayOnChannel: 6 }));
    expect(d.granted).toBe(false);
    if (!d.granted) expect(d.reason).toMatch(/cap/i);
  });
});

describe("rail 4: judgment routes to a human, and the mandate cannot override it", () => {
  it("blocks hostility aimed outward", () => {
    const d = requestPublish(clean({ text: withDisclosure("Our competitor is a laughable scam run by idiots.") }));
    expect(d.granted).toBe(false);
    if (!d.granted) expect(d.rail).toBe("content-gate");
  });

  it("blocks marketing next to someone's bad day", () => {
    const d = requestPublish(clean({ text: withDisclosure("With all the layoffs this week, try our product.") }));
    expect(d.granted).toBe(false);
    if (!d.granted) expect(d.rail).toBe("content-gate");
  });

  it("blocks engagement bait", () => {
    expect(requestPublish(clean({ text: withDisclosure("RT if you agree, you won't believe this") })).granted).toBe(false);
  });
});

describe("platform limits are checked before the send, not discovered as a 400", () => {
  it("refuses a post over the channel limit", () => {
    const long = withDisclosure("x".repeat(CHANNEL_LIMITS.bluesky));
    const d = requestPublish(clean({ text: long }));
    expect(d.granted).toBe(false);
    if (!d.granted) expect(d.reason).toMatch(/exceeds the bluesky limit/i);
  });

  it("allows the same body on a channel with room for it", () => {
    const body = withDisclosure("y".repeat(400));
    expect(requestPublish(clean({ channel: "bluesky", text: body })).granted).toBe(false);
    expect(requestPublish(clean({ channel: "linkedin", text: body })).granted).toBe(true);
  });

  it("refuses an empty post", () => {
    const d = requestPublish(clean({ text: "   " }));
    expect(d.granted).toBe(false);
    if (!d.granted) expect(d.rail).toBe("empty");
  });
});

describe("every decision lands in the audit ledger", () => {
  it("records a refusal, so a blocked post is a record rather than a silence", () => {
    const before = auditLog.all().length;
    const d = requestPublish(clean({ audience: "scraped" }));
    expect(auditLog.all().length).toBe(before + 1);
    const entry = auditLog.all()[auditLog.all().length - 1];
    expect(entry.action).toBe("publish:bluesky");
    expect(entry.verdict).toBe("QUEUE");
    expect(d.granted).toBe(false);
    if (!d.granted) expect(d.auditSeq).toBe(entry.seq);
  });

  it("records a grant too, and marks a post irreversible", () => {
    const d = requestPublish(clean());
    const entry = auditLog.all()[auditLog.all().length - 1];
    expect(entry.verdict).toBe("AUTO");
    expect(entry.reversible).toBe(false);
    if (d.granted) expect(d.auditSeq).toBe(entry.seq);
  });
});

describe("no publisher can be called without a permit", () => {
  it("types every publisher's parameter as PublishPermit", () => {
    // This is the structural guarantee. A publisher taking `{ text: string }` could be called from
    // anywhere; one taking a PublishPermit can only be called with a token this gate minted, so an
    // ungated publish is a compile error rather than something a reviewer has to notice.
    const src = readFileSync("lib/engine/execution.ts", "utf8");
    const publishers = [...src.matchAll(/(?:export )?async function (postTo(?:Bluesky|Mastodon|LinkedIn|X|Reddit))\s*\(([^)]*)\)/g)];
    expect(publishers.length, "expected five publishers").toBe(5);
    for (const [, name, params] of publishers) {
      expect(params, `${name} must take a PublishPermit`).toMatch(/PublishPermit/);
    }
  });

  it("leaves no caller passing raw text to a publisher", () => {
    for (const f of ["lib/engine/execution.ts", "app/api/cron/route.ts", "lib/engine/apply-decisions-db.ts"]) {
      const src = readFileSync(f, "utf8");
      expect(src, `${f} still calls a publisher with a raw text object`).not.toMatch(/postTo\w+\(\{\s*text:/);
    }
  });
});

describe("the rails are explainable to a customer", () => {
  it("lists every rail with a rule, in plain prose", () => {
    const rails = publishRails();
    expect(rails.length).toBeGreaterThanOrEqual(7);
    for (const r of rails) {
      expect(r.name.length).toBeGreaterThan(2);
      expect(r.rule.length).toBeGreaterThan(30);
      expect(r.rule, "no em-dashes in customer-facing prose").not.toMatch(/—/);
    }
  });
});
