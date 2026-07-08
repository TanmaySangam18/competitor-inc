import { describe, it, expect } from "vitest";
import { dueLifecycleEmails, lifecycleEmail, type LifecycleUser } from "./lifecycle-email";

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_000 * DAY; // arbitrary fixed clock

describe("lifecycle emails (Slice D — retention cadence)", () => {
  it("welcome is due immediately; day7 at 7d; day21 at 21d — each once", () => {
    const users: LifecycleUser[] = [
      { email: "new@x.com", signupAt: NOW }, // age 0
      { email: "wk1@x.com", signupAt: NOW - 8 * DAY }, // age 8d
      { email: "wk3@x.com", signupAt: NOW - 22 * DAY }, // age 22d
    ];
    const due = dueLifecycleEmails(users, NOW, new Set());
    const forNew = due.filter((d) => d.email === "new@x.com").map((d) => d.kind);
    const forWk1 = due.filter((d) => d.email === "wk1@x.com").map((d) => d.kind).sort();
    const forWk3 = due.filter((d) => d.email === "wk3@x.com").map((d) => d.kind).sort();
    expect(forNew).toEqual(["welcome"]);
    expect(forWk1).toEqual(["day7", "welcome"]);
    expect(forWk3).toEqual(["day21", "day7", "welcome"]);
  });

  it("never re-sends an email already in the sent log (dedup)", () => {
    const users: LifecycleUser[] = [{ email: "a@x.com", signupAt: NOW - 30 * DAY }];
    const sent = new Set(["a@x.com:welcome", "a@x.com:day7"]);
    const due = dueLifecycleEmails(users, NOW, sent).map((d) => d.kind);
    expect(due).toEqual(["day21"]);
  });

  it("skips rows with no email or an unparseable signup date", () => {
    const users = [
      { email: "", signupAt: NOW },
      { email: "b@x.com", signupAt: NaN },
    ] as LifecycleUser[];
    expect(dueLifecycleEmails(users, NOW, new Set())).toEqual([]);
  });

  it("templates carry a real CTA link and no invented metrics", () => {
    for (const kind of ["welcome", "day7", "day21"] as const) {
      const c = lifecycleEmail(kind);
      expect(c.subject.length).toBeGreaterThan(0);
      expect(c.html).toMatch(/https:\/\/[^"]+/); // has a link
      expect(c.html).toContain("Unsubscribe"); // CAN-SPAM opt-out
    }
    expect(lifecycleEmail("welcome").html).toContain("/score");
    expect(lifecycleEmail("day21").html).toContain("/join");
  });
});
