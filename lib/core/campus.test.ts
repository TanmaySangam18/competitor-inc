import { describe, it, expect } from "vitest";
import {
  emptyCampus, effectiveConnections, memberCapabilities, studentBurden, adminSetup,
  mayAuthorise, seatCheck, provisionPlan, campusSummary,
  VENDOR_SETUP, totalStudentActs, stopsTouchedByStudentSetup,
  type Campus, type CampusMember,
} from "./campus";
import { FLOOR } from "./hard-stops";

const ready = (): Campus => ({
  id: "nu",
  name: "Northeastern",
  connections: ["ai-model", "github", "hosting", "database", "object-storage"],
  seats: 50,
});
const student = (over: Partial<CampusMember> = {}): CampusMember => ({
  userId: "u1", campusId: "nu", role: "student", own: [], ...over,
});

describe("THE PROMISE: a student connects nothing", () => {
  it("reports zero acts once the campus has authorised", () => {
    // This is the measurable form of step 3, and it is COMPUTED rather than asserted, so a regression
    // that quietly reintroduces a student setup step fails here instead of shipping.
    const b = studentBurden(ready());
    expect(b.acts).toBe(0);
    expect(b.accounts).toEqual([]);
    expect(b.line).toBe("Students connect nothing. They sign in and start.");
  });

  it("gives the student every capability the campus paid for, with no effort of their own", () => {
    const r = memberCapabilities(ready(), student());
    const live = r.live.map((c) => c.id);
    expect(live).toEqual(expect.arrayContaining(["think", "commit", "deploy", "persist", "store"]));
    expect(r.ready).toBe(true);
  });

  it("names exactly what is missing when the campus has NOT finished", () => {
    const half = { ...ready(), connections: ["ai-model", "github"] };
    const b = studentBurden(half);
    expect(b.acts).toBeGreaterThan(0);
    expect(b.line).toMatch(/campus should authorise/i);
    // It must name them, because a bare number gives an admin nothing to act on.
    expect(b.accounts.map((a) => a.name).join(" ")).toMatch(/Vercel|Supabase/);
  });

  it("does not mark a campus incomplete for capabilities it never wanted", () => {
    // A campus that never intends students to publish outbound is not "unfinished" for it.
    const thinkOnly = { ...ready(), connections: ["ai-model"] };
    expect(studentBurden(thinkOnly, ["think"]).acts).toBe(0);
    expect(studentBurden(thinkOnly, ["think", "commit"]).acts).toBe(1);
  });

  it("inherits without the student adding anything of their own", () => {
    const c = ready();
    expect(effectiveConnections(c, student())).toEqual([...c.connections].sort());
  });

  it("still lets an individual add their own connection on top", () => {
    const c = ready();
    const withOwn = effectiveConnections(c, student({ own: ["social"] }));
    expect(withOwn).toContain("social");
    expect(withOwn.length).toBe(c.connections.length + 1);
  });
});

describe("the admin does the human work, and only the admin", () => {
  it("counts down the admin's one-click-each setup", () => {
    const fresh = adminSetup(emptyCampus("x", "Test"));
    expect(fresh.remaining.length).toBeGreaterThan(0);
    expect(fresh.line).toMatch(/one authorise click each/i);
    expect(fresh.line).toMatch(/only human setup/i);

    const done = adminSetup(ready());
    expect(done.remaining).toEqual([]);
    expect(done.line).toMatch(/complete/i);
  });

  it("refuses to let a student authorise a campus account", () => {
    // A student authorising would put a personal account behind a university licence, which is the exact
    // failure this design exists to prevent.
    const v = mayAuthorise(student());
    expect(v.allowed).toBe(false);
    expect(v.reason).toMatch(/cannot authorise/i);
    expect(v.reason).toMatch(/one click for them/i); // and it points at the fix
  });

  it("refuses faculty too, and allows only admins", () => {
    expect(mayAuthorise(student({ role: "faculty" })).allowed).toBe(false);
    expect(mayAuthorise(student({ role: "admin" })).allowed).toBe(true);
  });
});

describe("the hard-stops are untouched by any of this", () => {
  it("still has all six, and this module adds no way around them", () => {
    // The whole design exists BECAUSE these cannot be automated. If this file ever needed the floor
    // changed, the design would be wrong. This test is the tripwire.
    expect([...FLOOR]).toEqual(["account-create", "accept-terms", "authenticate", "captcha", "grant-consent", "pay"]);
    expect(FLOOR).toHaveLength(6);
  });

  it("never claims to create an account or accept terms as part of provisioning", () => {
    // Every provisioning item must be an API call with an already-authorised token, never a human act.
    for (const item of provisionPlan(ready())) {
      expect(["repo", "hosting-project", "db-schema"]).toContain(item.kind);
      expect(item.why).not.toMatch(/sign ?up|create an account|accept|terms|pay/i);
    }
  });

  it("provisions no model key, because the student uses the campus's", () => {
    // A per-student model key would mean a per-student vendor account, which is the thing being removed.
    expect(provisionPlan(ready()).map((i) => i.kind)).not.toContain("model-key");
  });
});

describe("provisioning is derived from what the campus authorised", () => {
  it("plans nothing for a campus that authorised nothing", () => {
    expect(provisionPlan(emptyCampus("x", "Test"))).toEqual([]);
  });

  it("plans a repo, a hosting project and a schema for a fully set-up campus", () => {
    expect(provisionPlan(ready()).map((i) => i.kind)).toEqual(["repo", "hosting-project", "db-schema"]);
  });

  it("names the delegated connection each item is created through", () => {
    for (const item of provisionPlan(ready())) {
      expect(ready().connections).toContain(item.via);
    }
  });

  it("skips hosting when the campus has not authorised it", () => {
    const noHost = { ...ready(), connections: ["ai-model", "github", "database"] };
    expect(provisionPlan(noHost).map((i) => i.kind)).toEqual(["repo", "db-schema"]);
  });
});

describe("seats, because universities buy seats", () => {
  it("refuses a campus with no seats yet", () => {
    const v = seatCheck({ ...ready(), seats: 0 }, 0);
    expect(v.allowed).toBe(false);
    expect(v.reason).toMatch(/no seats/i);
  });

  it("allows a student while seats remain and reports what is left", () => {
    const v = seatCheck(ready(), 10);
    expect(v.allowed).toBe(true);
    expect(v.reason).toBe("40 of 50 seats free");
  });

  it("stops at the licence limit and says a licence change is required", () => {
    const v = seatCheck(ready(), 50);
    expect(v.allowed).toBe(false);
    expect(v.reason).toMatch(/all 50 seats are in use/i);
    expect(v.reason).toMatch(/not a settings toggle/i);
  });
});

describe("what the admin reads", () => {
  it("says ready only when it truly is", () => {
    expect(campusSummary(ready(), 10)).toMatch(/is ready/);
    expect(campusSummary(ready(), 10)).toMatch(/Students connect nothing/);
    expect(campusSummary(emptyCampus("x", "Test", 5), 0)).toMatch(/not ready yet/);
  });

  it("has no em-dashes, like every other customer-facing string", () => {
    const strings = [
      campusSummary(ready(), 10),
      studentBurden(ready()).line,
      studentBurden({ ...ready(), connections: [] }).line,
      adminSetup(ready()).line,
      mayAuthorise(student()).reason,
      seatCheck(ready(), 50).reason,
      ...provisionPlan(ready()).map((i) => i.why),
    ];
    for (const s of strings) expect(s, s).not.toMatch(/—/);
  });
});

describe("BLOCK G: the student's burden today, and it cannot drift from the code", () => {
  it("names only connections that really exist", async () => {
    // The inventory lives in code so this test can hold it to reality. A doc alone drifts silently.
    const { CONNECTION_MAP } = await import("./connections");
    const ids = new Set(CONNECTION_MAP.map((c) => c.id));
    for (const v of VENDOR_SETUP) {
      expect(ids.has(v.connectionId), `${v.vendor} claims connection "${v.connectionId}" which does not exist`).toBe(true);
    }
  });

  it("names only real hard-stops", () => {
    for (const v of VENDOR_SETUP) {
      for (const s of v.hardStops) {
        expect(FLOOR, `${v.vendor} names "${s}" which is not on the floor`).toContain(s);
      }
    }
  });

  it("covers every capability a student needs to build and ship", () => {
    // If a capability the goal depends on has no vendor row, the inventory is understating the burden.
    const covered = new Set(VENDOR_SETUP.map((v) => v.connectionId));
    for (const needed of ["ai-model", "github", "hosting", "database"]) {
      expect(covered.has(needed), `no vendor row explains how a student gets "${needed}"`).toBe(true);
    }
  });

  it("counts the real size of the problem", () => {
    // Four vendors, and roughly twenty acts. This is the number the campus tier deletes, and it is derived
    // rather than quoted so the doc and the code can never disagree.
    expect(VENDOR_SETUP).toHaveLength(4);
    expect(totalStudentActs()).toBeGreaterThanOrEqual(20);
  });

  it("shows that the student path touches nearly the whole hard-stop floor", () => {
    // This is the argument for why "automate it no matter what" cannot be done literally: doing it would
    // mean a machine performing these acts on a student's behalf.
    const touched = stopsTouchedByStudentSetup();
    expect(touched).toEqual(expect.arrayContaining(["account-create", "accept-terms", "authenticate", "pay"]));
    expect(touched.length).toBeGreaterThanOrEqual(4);
  });

  it("drops to zero acts once a campus takes it over", () => {
    // The before-and-after in one assertion: 20+ acts for a lone student, 0 for a campus student.
    expect(totalStudentActs()).toBeGreaterThanOrEqual(20);
    expect(studentBurden(ready()).acts).toBe(0);
  });

  it("explains each vendor in plain language, with no em-dashes", () => {
    for (const v of VENDOR_SETUP) {
      expect(v.forWhat.length).toBeGreaterThan(20);
      expect(v.acts.length).toBeGreaterThan(2);
      expect(`${v.forWhat} ${v.acts.join(" ")}`, v.vendor).not.toMatch(/—/);
    }
  });
});
