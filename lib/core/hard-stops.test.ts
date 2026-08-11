import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  FLOOR,
  FLOOR_REASON,
  HANDOFF_MODES,
  DEFAULT_HANDOFF,
  effectiveStops,
  handoffFor,
  inspectTarget,
  escalationText,
  type CustomerPolicy,
} from "./hard-stops";
import { inspect as guardInspect, FLOOR as GUARD_FLOOR, PATTERNS as GUARD_PATTERNS } from "../../scripts/hands-guard.mjs";

describe("the floor is a ratchet, not a dial", () => {
  it("is exactly the six, in a frozen list", () => {
    expect([...FLOOR]).toEqual([
      "account-create", "accept-terms", "authenticate", "captcha", "grant-consent", "pay",
    ]);
    expect(Object.isFrozen(FLOOR)).toBe(true);
  });

  it("keeps all six no matter what a customer policy says", () => {
    // The adversarial case: a policy that TRIES to look like it removes stops.
    const hostile = {
      handoff: { pay: "skip" },
      additionalStops: [],
      // fields that do not exist on the type, simulating a tampered payload
      disable: ["pay", "authenticate"],
      allowPayments: true,
      floor: [],
    } as unknown as CustomerPolicy;
    expect([...effectiveStops(hostile).floor]).toEqual([...FLOOR]);
    // and a payment target is still stopped
    expect(inspectTarget({ text: "Pay now" }, hostile).stopped).toBe(true);
  });

  it("lets a customer ADD stops (tighten only)", () => {
    const policy: CustomerPolicy = { additionalStops: ["payroll", "internal wiki"] };
    expect(effectiveStops(policy).added).toEqual(["payroll", "internal wiki"]);
    const v = inspectTarget({ text: "Open payroll settings" }, policy);
    expect(v.stopped).toBe(true);
    expect(v.kind).toBe("custom");
    expect(v.matched).toBe("payroll");
  });

  it("ignores blank additions rather than stopping on everything", () => {
    const policy: CustomerPolicy = { additionalStops: ["  ", ""] };
    expect(effectiveStops(policy).added).toEqual([]);
    expect(inspectTarget({ text: "Save settings" }, policy).stopped).toBe(false);
  });

  it("every floor stop has a reason a human can read", () => {
    for (const k of FLOOR) {
      expect(FLOOR_REASON[k].length).toBeGreaterThan(20);
      expect(FLOOR_REASON[k]).not.toMatch(/[—–]/);
    }
  });
});

describe("detection: each of the six, at the last inch", () => {
  const cases: Array<[string, Record<string, string>, string]> = [
    ["account-create", { text: "Sign up" }, "account-create"],
    ["account-create", { text: "Create an account" }, "account-create"],
    ["accept-terms", { text: "I agree" }, "accept-terms"],
    ["accept-terms", { text: "Accept the Terms and Conditions" }, "accept-terms"],
    ["authenticate", { text: "Log in" }, "authenticate"],
    ["authenticate", { name: "otp", placeholder: "Enter verification code" }, "authenticate"],
    ["captcha", { text: "I'm not a robot" }, "captcha"],
    ["captcha", { ariaLabel: "reCAPTCHA challenge" }, "captcha"],
    ["grant-consent", { text: "Authorize" }, "grant-consent"],
    ["grant-consent", { text: "Allow access to your account" }, "grant-consent"],
    ["pay", { placeholder: "Card number" }, "pay"],
    ["pay", { text: "Subscribe" }, "pay"],
    ["pay", { autocomplete: "cc-number" }, "pay"],
  ];

  for (const [label, target, expected] of cases) {
    it(`stops ${label}: ${JSON.stringify(target)}`, () => {
      const v = inspectTarget(target);
      expect(v.stopped).toBe(true);
      expect(v.kind).toBe(expected);
      expect(v.matched).toBeTruthy();
    });
  }

  it("stops a password input on its TYPE even when the label is innocent", () => {
    const v = inspectTarget({ text: "Continue", type: "password" });
    expect(v.stopped).toBe(true);
    expect(v.kind).toBe("authenticate");
    expect(v.matched).toBe('input[type="password"]');
  });

  it("does NOT stop ordinary work (no false-positive paralysis)", () => {
    for (const t of [
      { text: "Create App" },              // the Slack manifest button: creating an APP, not an account
      { text: "Save changes" },
      { name: "app_name", placeholder: "My workspace bot" },
      { text: "Copy to clipboard" },
      { url: "https://api.slack.com/apps" },
    ]) {
      expect(inspectTarget(t).stopped, JSON.stringify(t)).toBe(false);
    }
  });
});

describe("handoff mode: the customer's real choice", () => {
  it("defaults to pause", () => {
    expect(DEFAULT_HANDOFF).toBe("pause");
    expect(inspectTarget({ text: "Pay now" }).handoff).toBe("pause");
  });

  it("honours a per-stop choice", () => {
    const policy: CustomerPolicy = { handoff: { pay: "queue", authenticate: "takeover" } };
    expect(inspectTarget({ text: "Pay now" }, policy).handoff).toBe("queue");
    expect(inspectTarget({ text: "Log in" }, policy).handoff).toBe("takeover");
    // a stop with no choice still pauses
    expect(inspectTarget({ text: "I agree" }, policy).handoff).toBe("pause");
  });

  it("falls back to pause on a garbage mode rather than trusting it", () => {
    const policy = { handoff: { pay: "just-do-it" } } as unknown as CustomerPolicy;
    expect(handoffFor("pay", policy)).toBe("pause");
  });

  it("offers exactly four modes, none of which is 'proceed'", () => {
    expect([...HANDOFF_MODES]).toEqual(["pause", "takeover", "queue", "skip"]);
    expect(HANDOFF_MODES).not.toContain("proceed");
    expect(HANDOFF_MODES).not.toContain("allow");
  });
});

describe("escalation text", () => {
  it("names what was touched, why, and how the human gets it back", () => {
    const t = { text: "Accept the Terms of Service" };
    const v = inspectTarget(t, { handoff: { "accept-terms": "takeover" } });
    const text = escalationText(t, v);
    expect(text).toContain("Accept the Terms of Service");
    expect(text).toContain("signing a contract");
    expect(text).toContain("live screen");
    expect(text).not.toMatch(/[—–]/);
  });

  it("says nothing dramatic when there is no stop", () => {
    expect(escalationText({ text: "Save" }, inspectTarget({ text: "Save" }))).toContain("No hard-stop");
  });
});

describe("the local runner's guard cannot drift from the floor", () => {
  it("scripts/hands-guard.mjs lists the same six", () => {
    expect([...GUARD_FLOOR]).toEqual([...FLOOR]);
  });

  it("scripts/hands-guard.mjs patterns are character-identical to hard-stops.ts", () => {
    const ts = readFileSync(join(process.cwd(), "lib/core/hard-stops.ts"), "utf8");
    const mjs = readFileSync(join(process.cwd(), "scripts/hands-guard.mjs"), "utf8");
    const block = (src: string) => {
      const start = src.indexOf('"account-create": [');
      const end = src.indexOf("});", start);
      expect(start, "pattern block not found").toBeGreaterThan(-1);
      return src
        .slice(start, end)
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith("/") || l.endsWith("["))
        .join("\n");
    };
    expect(block(mjs)).toBe(block(ts));
  });

  it("the two implementations agree on every detection case", () => {
    const targets = [
      { text: "Sign up" }, { text: "I agree" }, { text: "Log in" }, { text: "captcha" },
      { text: "Authorize" }, { text: "Pay now" }, { type: "password", text: "Continue" },
      { text: "Save changes" }, { text: "Create App" }, { autocomplete: "cc-number" },
    ];
    for (const t of targets) {
      const a = inspectTarget(t);
      const b = guardInspect(t, []);
      expect(b.stopped, JSON.stringify(t)).toBe(a.stopped);
      if (a.stopped) expect(b.kind, JSON.stringify(t)).toBe(a.kind);
    }
  });

  it("the runner's guard also honours customer additions", () => {
    expect(guardInspect({ text: "open payroll" }, ["payroll"]).stopped).toBe(true);
    expect(guardInspect({ text: "open payroll" }, []).stopped).toBe(false);
  });
});
