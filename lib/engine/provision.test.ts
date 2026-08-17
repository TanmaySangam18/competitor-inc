import { describe, it, expect, vi } from "vitest";
import { studentSchemaSql, studentSlug, graduateStudent } from "./provision";

describe("the schema statement that isolates one student from another", () => {
  it("revokes public and grants only authenticated", () => {
    // This is the statement that enforces one student cannot read another's rows, so it is asserted rather
    // than trusted. Exported pure precisely so it is reviewable without a database.
    const sql = studentSchemaSql("s_ada_lovelace");
    expect(sql).toContain('create schema if not exists "s_ada_lovelace"');
    expect(sql).toContain('revoke all on schema "s_ada_lovelace" from public');
    expect(sql).toContain('grant usage on schema "s_ada_lovelace" to authenticated');
  });

  it("refuses any name that could carry an injection", () => {
    // PostgreSQL will not bind an identifier, so the name is interpolated and the VALIDATION is the whole
    // defence. It has to be strict and it has to be tested with real attack shapes.
    for (const bad of [
      'x"; drop schema public cascade; --',
      "s_a; select 1",
      "S_Upper",
      "1leading_digit",
      "has-hyphen",
      "has space",
      "ab",
      "",
      "s_" + "x".repeat(80),
      "sch$ma",
    ]) {
      expect(() => studentSchemaSql(bad), `should refuse ${JSON.stringify(bad)}`).toThrow(/unsafe schema name/);
    }
  });

  it("accepts ordinary generated names", () => {
    expect(() => studentSchemaSql("s_ada_1a2b3c4d")).not.toThrow();
    expect(() => studentSchemaSql("abc")).not.toThrow();
  });
});

describe("resource naming", () => {
  it("is stable for the same student", () => {
    const id = "11111111-2222-3333-4444-555555555555";
    expect(studentSlug(id, "Ada Lovelace")).toBe(studentSlug(id, "Ada Lovelace"));
  });

  it("differs between students who share a handle", () => {
    const a = studentSlug("aaaaaaaa-0000-0000-0000-000000000000", "Ada");
    const b = studentSlug("bbbbbbbb-0000-0000-0000-000000000000", "Ada");
    expect(a).not.toBe(b);
  });

  it("produces a URL-safe name from an awkward handle", () => {
    const s = studentSlug("11111111-2222-3333-4444-555555555555", "Ada  L@velace!! 之");
    expect(s).toMatch(/^[a-z0-9-]+$/);
  });

  it("survives an empty handle", () => {
    expect(studentSlug("11111111-2222-3333-4444-555555555555")).toMatch(/^student-/);
  });
});

describe("provisioning respects the licence and never invents success", () => {
  const campus = { id: "nu", name: "Northeastern", connections: ["ai-model", "github", "hosting", "database"], seats: 2 };

  /** Minimal Supabase stub: no org token stored, so every vendor step must report skipped honestly. */
  const stubSb = () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: async () => ({ data: null, error: null }) })) })) })),
      insert: vi.fn(async () => ({ error: null })),
    })),
    rpc: vi.fn(async () => ({ error: { message: "exec_sql not installed" } })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

  it("refuses to provision past the seat count, and says a licence change is needed", async () => {
    const { provisionStudent } = await import("./provision");
    const r = await provisionStudent(stubSb(), { campus, userId: "u1", currentMembers: 2, now: () => 0 });
    expect(r.ready).toBe(false);
    expect(r.line).toMatch(/Not provisioned/);
    expect(r.line).toMatch(/seats are in use/i);
    expect(r.results).toEqual([]);
  });

  it("reports skipped with a reason rather than pretending, when no campus token exists", async () => {
    const { provisionStudent } = await import("./provision");
    const r = await provisionStudent(stubSb(), { campus, userId: "u1", currentMembers: 0, now: () => 0 });
    expect(r.ready).toBe(false);
    // Every unfinished item must name why. A student told their repo exists must have a repo.
    for (const item of r.results) {
      if (item.status === "created" || item.status === "existed") continue;
      expect(item.reason, `${item.kind} must explain itself`).toBeTruthy();
    }
    expect(r.results.find((x) => x.kind === "repo")?.reason).toMatch(/has not authorised GitHub/i);
    expect(r.line).toMatch(/Partly ready/);
  });

  it("measures elapsed time, because step 3 is a promise about seconds", async () => {
    const { provisionStudent } = await import("./provision");
    let t = 1000;
    const r = await provisionStudent(stubSb(), { campus, userId: "u1", currentMembers: 0, now: () => (t += 250) });
    expect(r.elapsedMs).toBeGreaterThan(0);
  });

  it("plans nothing for a campus that has authorised nothing", async () => {
    const { provisionStudent } = await import("./provision");
    const bare = { ...campus, connections: [] };
    const r = await provisionStudent(stubSb(), { campus: bare, userId: "u1", currentMembers: 0, now: () => 0 });
    expect(r.results).toEqual([]);
    expect(r.ready).toBe(false); // nothing planned is not the same as ready
  });
});

describe("graduation is honest about not existing", () => {
  it("says so plainly instead of failing silently", () => {
    const g = graduateStudent();
    expect(g.supported).toBe(false);
    expect(g.reason).toMatch(/designed but not built/i);
    expect(g.reason).toMatch(/own schema/i); // and explains why the move is possible later
  });
});
