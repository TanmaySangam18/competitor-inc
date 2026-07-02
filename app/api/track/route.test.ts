import { describe, it, expect } from "vitest";
import { POST, GET, OPTIONS } from "./route";

// Input-guard tests — all paths that fail BEFORE any Supabase call, so no network/db needed.
// (Supabase-dependent behavior — slug existence, dedup — is covered by the smoke sweep + e2e.)

const post = (body: unknown, headers: Record<string, string> = {}) =>
  POST(
    new Request("http://test/api/track", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );

describe("/api/track POST — the public pixel's hard edges", () => {
  it("rejects bad json", async () => {
    const r = await post("{not json");
    expect(r.status).toBe(400);
  });

  it("rejects a malformed slug", async () => {
    const r = await post({ slug: "NOT OK!!", type: "view" });
    expect(r.status).toBe(400);
  });

  it("rejects oversized bodies", async () => {
    const r = await post({ slug: "ok-slug", type: "view", source: "x".repeat(2000) });
    expect(r.status).toBe(400);
  });

  it("NEVER accepts purchase from the public path (revenue only via webhook)", async () => {
    const r = await post({ slug: "ok-slug", type: "purchase", value_cents: 99999 });
    expect(r.status).toBe(400);
    const j = await r.json();
    expect(j.error).toMatch(/view\|signup/);
  });

  it("fails soft without Supabase (ok:true, persisted:false)", async () => {
    // test env has no SUPABASE_SERVICE_ROLE_KEY
    const r = await post({ slug: "ok-slug", type: "view" });
    const j = await r.json();
    expect(j.ok).toBe(true);
    expect(j.persisted).toBe(false);
  });

  it("answers CORS preflight (customer-site snippet support)", () => {
    const r = OPTIONS();
    expect(r.status).toBe(204);
    expect(r.headers.get("access-control-allow-origin")).toBe("*");
  });
});

describe("/api/track GET — aggregates only", () => {
  it("rejects a bad slug", async () => {
    const r = await GET(new Request("http://test/api/track?slug=NOPE!!"));
    expect(r.status).toBe(400);
  });

  it("fails soft without Supabase", async () => {
    const r = await GET(new Request("http://test/api/track?slug=ok-slug"));
    const j = await r.json();
    expect(j.ok).toBe(true);
    expect(j.views).toBe(0);
  });
});
