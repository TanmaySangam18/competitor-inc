import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST } from "./route";

// Edge tests that run BEFORE any Supabase/Slack call — no network, no keys (test env has neither).
// The loop mechanics themselves are covered in lib/loop/incident.test.ts with injected deps.

const post = (body: unknown, headers: Record<string, string> = {}) =>
  POST(
    new Request("http://test/api/hooks/incident", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

const ENV_KEYS = ["INCIDENT_HOOK_SECRET", "INCIDENT_RUN_USER_ID", "SLACK_BOT_TOKEN", "SLACK_CH_ENG", "SLACK_LOOP_CHANNEL"] as const;
let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const k of ENV_KEYS) delete process.env[k];
});
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("/api/hooks/incident — the armed-or-honest front door", () => {
  it("no INCIDENT_HOOK_SECRET → 503 'hook not armed' (never an open endpoint, never a fake success)", async () => {
    const r = await post({ source: "sentry", title: "x", severity: "low" });
    expect(r.status).toBe(503);
    const j = await r.json();
    expect(j.error).toMatch(/not armed/);
  });

  it("wrong or missing secret → 401", async () => {
    process.env.INCIDENT_HOOK_SECRET = "s3cret";
    expect((await post({ title: "x", severity: "low" })).status).toBe(401);
    expect((await post({ title: "x", severity: "low" }, { "x-incident-secret": "nope" })).status).toBe(401);
  });

  it("bad JSON → 400", async () => {
    process.env.INCIDENT_HOOK_SECRET = "s3cret";
    const r = await post("{not json", { "x-incident-secret": "s3cret" });
    expect(r.status).toBe(400);
  });

  it("unrecognizable payload → 400 (an incident is never fabricated from junk)", async () => {
    process.env.INCIDENT_HOOK_SECRET = "s3cret";
    const r = await post({ hello: "world" }, { "x-incident-secret": "s3cret" });
    expect(r.status).toBe(400);
  });

  it("armed + valid native payload → classified, with honest degraded-mode notes (no Slack, no DB here)", async () => {
    process.env.INCIDENT_HOOK_SECRET = "s3cret";
    const r = await post({ source: "monitor", title: "p95 spike", severity: "low" }, { "x-incident-secret": "s3cret" });
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j).toMatchObject({ ok: true, action: "auto-triage", tier: "T1", posted: false });
    expect(j.postNote).toMatch(/not connected/); // Slack honesty
    expect(j.runNote).toMatch(/no org-run driver/); // DB honesty
  });

  it("a Sentry fatal adapts to critical and HALTS (nothing auto-runs)", async () => {
    process.env.INCIDENT_HOOK_SECRET = "s3cret";
    const r = await post({ level: "fatal", message: "prod is down" }, { "x-incident-secret": "s3cret" });
    const j = await r.json();
    expect(j).toMatchObject({ ok: true, action: "halt", tier: "T3" });
    expect(j.runId).toBeUndefined();
  });
});
