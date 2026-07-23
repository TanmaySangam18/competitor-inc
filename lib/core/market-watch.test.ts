import { describe, it, expect, vi } from "vitest";
import { normalizeHtml, robotsAllows, diffSnapshots, scanTarget, battlecard, WATCH_USER_AGENT } from "./market-watch";

const page = (body: string) => `<html><head><style>.x{}</style><script>evil()</script></head><body>${body}</body></html>`;
const fakeFetch = (routes: Record<string, { status: number; body: string }>) =>
  vi.fn(async (url: string | URL | Request) => {
    const key = String(url);
    const hit = Object.entries(routes).find(([k]) => key.includes(k))?.[1] ?? { status: 404, body: "" };
    return { ok: hit.status < 400, status: hit.status, text: async () => hit.body } as Response;
  }) as unknown as typeof fetch;

describe("market watch — normalize (ADR-0024)", () => {
  it("strips scripts/styles/tags, decodes entities, dedupes echoes", () => {
    const t = normalizeHtml(page("<h1>Acme &amp; Co</h1><p>Plans from $49/mo</p><p>Plans from $49/mo</p>"));
    expect(t).toContain("Acme & Co");
    expect(t).not.toContain("evil");
    expect(t.match(/Plans from \$49\/mo/g)).toHaveLength(1);
  });
});

describe("market watch — the robots gate (a disallow is honored)", () => {
  it("404 robots ⇒ allowed by convention; a matching Disallow ⇒ honored refusal", async () => {
    const open = await robotsAllows("https://acme.com/pricing", fakeFetch({}));
    expect(open.allowed).toBe(true);
    const blocked = await robotsAllows(
      "https://acme.com/pricing",
      fakeFetch({ "robots.txt": { status: 200, body: "User-agent: *\nDisallow: /pricing" } }),
    );
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toContain("honored");
  });

  it("unreachable robots ⇒ we don't crawl what we can't verify", async () => {
    const failing = vi.fn(async () => { throw new Error("net down"); }) as unknown as typeof fetch;
    expect((await robotsAllows("https://acme.com/", failing)).allowed).toBe(false);
  });
});

describe("market watch — diff + classify", () => {
  it("classifies pricing/features and orders pricing first", () => {
    const prev = "Welcome to Acme\nPlans from $49/mo";
    const next = "Welcome to Acme\nPlans from $99/mo\nNow available: AI agents beta";
    const deltas = diffSnapshots(prev, next);
    expect(deltas[0]).toMatchObject({ kind: "pricing", change: "added", line: "Plans from $99/mo" });
    expect(deltas.find((d) => d.change === "removed")?.line).toBe("Plans from $49/mo");
    expect(deltas.some((d) => d.kind === "features" && d.line.includes("beta"))).toBe(true);
  });
});

describe("market watch — the scan, end to end offline", () => {
  const routes = {
    "robots.txt": { status: 200, body: "User-agent: *\nDisallow: /private" },
    "acme.com/pricing": { status: 200, body: page("<p>Plans from $49/mo</p>") },
  };

  it("first scan is a baseline (no deltas); second scan diffs; UA is disclosed", async () => {
    const f = fakeFetch(routes);
    const first = await scanTarget({ name: "Acme", url: "https://acme.com/pricing" }, "", f);
    expect(first.ok && first.firstScan && first.deltas.length === 0).toBe(true);
    const second = await scanTarget(
      { name: "Acme", url: "https://acme.com/pricing" },
      "Plans from $29/mo",
      f,
    );
    expect(second.ok && second.deltas.some((d) => d.kind === "pricing")).toBe(true);
    const calls = (f as unknown as { mock: { calls: [string | URL, RequestInit][] } }).mock.calls;
    expect(calls.every(([, init]) => (init?.headers as Record<string, string>)["user-agent"] === WATCH_USER_AGENT)).toBe(true);
  });

  it("a robots-disallowed page is refused out loud, never fetched", async () => {
    const f = fakeFetch(routes);
    const r = await scanTarget({ name: "Acme", url: "https://acme.com/private/roadmap" }, "", f);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("robots");
  });
});

describe("market watch — the battlecard is honest about whose words are whose", () => {
  it("quotes deltas as theirs (dated), counters as ours, and carries the compliance note", () => {
    const card = battlecard(
      { name: "Acme", url: "https://acme.com/pricing" },
      [{ kind: "pricing", change: "added", line: "Plans from $99/mo" }],
      "2026-07-23T00:00:00Z",
    );
    expect(card).toContain("THEIR words");
    expect(card).toContain('"Plans from $99/mo"');
    expect(card).toContain("How we counter (verified, ours)");
    expect(card).toContain("robots.txt respected");
  });
});
