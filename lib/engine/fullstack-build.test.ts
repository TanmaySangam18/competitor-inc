import { describe, it, expect } from "vitest";
import _sodium from "libsodium-wrappers";
import {
  dispatchFullstackBuild,
  buildFullstackWorkflowYaml,
  fullstackPromptFile,
  fullstackConfigured,
  fullstackBuildExecutor,
} from "./fullstack-build";
import type { FetchLike } from "./aider-build";

// Fake GitHub API that records calls + returns canned responses — the whole dispatch sequence is verified
// with zero network (mirrors aider-build.test.ts).
function fakeGitHub(overrides: Record<string, { ok: boolean; status: number; body?: unknown }> = {}) {
  const calls: { url: string; method?: string; body?: string }[] = [];
  const fetchImpl: FetchLike = async (url, init) => {
    calls.push({ url, method: init?.method, body: init?.body });
    const hit = Object.keys(overrides).find((k) => url.includes(k));
    if (hit) {
      const r = overrides[hit];
      return { ok: r.ok, status: r.status, json: async () => r.body ?? {} };
    }
    if (url.endsWith("/user/repos")) {
      return { ok: true, status: 201, json: async () => ({ full_name: "octocat/tutor-app-abcde", html_url: "https://github.com/octocat/tutor-app-abcde" }) };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };
  return { fetchImpl, calls };
}

describe("fullstack-build (free full-stack builds via Actions + Aider + Vercel)", () => {
  it("runs the full sequence and returns the repo url (honest 'building' artifact — never a guessed live URL)", async () => {
    const gh = fakeGitHub();
    const out = await dispatchFullstackBuild({ goal: "a tutoring marketplace", token: "t", fetchImpl: gh.fetchImpl });
    expect(out).toMatchObject({ url: "https://github.com/octocat/tutor-app-abcde", repo: "octocat/tutor-app-abcde" });
    const urls = gh.calls.map((c) => c.url);
    expect(urls.some((u) => u.endsWith("/user/repos"))).toBe(true);
    expect(urls.some((u) => u.includes("/contents/") && u.includes("build-fullstack.yml"))).toBe(true);
    expect(urls.some((u) => u.includes("/contents/") && u.includes("PROMPT.md"))).toBe(true);
    // Workflow committed BEFORE PROMPT.md, so the PROMPT push triggers the on:push build (no dispatch call).
    const wfIdx = urls.findIndex((u) => u.includes("build-fullstack.yml"));
    const promptIdx = urls.findIndex((u) => u.includes("PROMPT.md"));
    expect(wfIdx).toBeGreaterThanOrEqual(0);
    expect(wfIdx).toBeLessThan(promptIdx);
    expect(urls.some((u) => u.includes("/dispatches"))).toBe(false); // no fragile dispatch-by-filename call
  });

  it("workflow triggers on push (not dispatch), scaffolds Next.js + deploys to Vercel, and can't loop", () => {
    const yaml = buildFullstackWorkflowYaml();
    expect(yaml).toMatch(/on:\s*\n\s*push:/);
    expect(yaml).not.toMatch(/workflow_dispatch/);
    expect(yaml).toMatch(/\[skip ci\]/); // the bot's own commit is skipped → no infinite loop
    expect(yaml).toMatch(/create-next-app/);
    expect(yaml).toMatch(/vercel deploy --prod/);
    expect(yaml).toMatch(/aider .*--message-file \.\.\/PROMPT\.md/);
    expect(yaml).toMatch(/npm run build/); // build-gate: only deploy an app that actually compiles
    expect(yaml).toMatch(/exit 1/); // self-repair exhausted → fail honestly (no swallowed deploy error)
    expect(yaml).toMatch(/secrets\.LLM_API_KEY/);
    expect(yaml).toMatch(/secrets\.VERCEL_TOKEN/);
    expect(yaml).toMatch(/ssoProtection/); // auto-disables Vercel Deployment Protection → app is public
  });

  it("prompt asks for a REAL backend API route + persistence (not static)", () => {
    const p = fullstackPromptFile("a tutoring marketplace");
    expect(p).toMatch(/app\/api\/items\/route\.ts/);
    expect(p).toMatch(/Supabase|in-memory/);
    expect(p).toMatch(/next build/);
  });

  it("returns null when committing the workflow 403s (token lacks `workflow` scope) — caller falls back", async () => {
    const gh = fakeGitHub({ "build-fullstack.yml": { ok: false, status: 403 } });
    const out = await dispatchFullstackBuild({ goal: "x", token: "t", fetchImpl: gh.fetchImpl });
    expect(out).toHaveProperty("error");
    expect((out as { error: string }).error).toMatch(/403.*workflow/i);
  });

  it("returns a create-repo error (not a crash) when repo creation fails", async () => {
    const gh = fakeGitHub({ "/user/repos": { ok: false, status: 401 } });
    const out = await dispatchFullstackBuild({ goal: "x", token: "t", fetchImpl: gh.fetchImpl });
    expect((out as { error: string }).error).toMatch(/create-repo.*401/i);
  });

  it("injects LLM_API_KEY + VERCEL_TOKEN as repo secrets when the engine keys are set (no org needed)", async () => {
    const prevL = process.env.FULLSTACK_LLM_API_KEY;
    const prevV = process.env.FULLSTACK_VERCEL_TOKEN;
    process.env.FULLSTACK_LLM_API_KEY = "groq-xxx";
    process.env.FULLSTACK_VERCEL_TOKEN = "vc-xxx";
    await _sodium.ready;
    const pkB64 = _sodium.to_base64(_sodium.crypto_box_keypair().publicKey, _sodium.base64_variants.ORIGINAL);
    const calls: string[] = [];
    const fetchImpl: FetchLike = async (url, init) => {
      calls.push(`${init?.method ?? "GET"} ${url}`);
      if (url.endsWith("/user/repos")) return { ok: true, status: 201, json: async () => ({ full_name: "octo/app-x", html_url: "https://github.com/octo/app-x" }) };
      if (url.includes("/actions/secrets/public-key")) return { ok: true, status: 200, json: async () => ({ key: pkB64, key_id: "kid" }) };
      return { ok: true, status: 200, json: async () => ({}) };
    };
    try {
      const out = await dispatchFullstackBuild({ goal: "x", token: "t", fetchImpl });
      expect(out).toHaveProperty("url");
      expect(calls.some((c) => c.startsWith("PUT") && c.includes("/actions/secrets/LLM_API_KEY"))).toBe(true);
      expect(calls.some((c) => c.startsWith("PUT") && c.includes("/actions/secrets/VERCEL_TOKEN"))).toBe(true);
    } finally {
      if (prevL === undefined) delete process.env.FULLSTACK_LLM_API_KEY; else process.env.FULLSTACK_LLM_API_KEY = prevL;
      if (prevV === undefined) delete process.env.FULLSTACK_VERCEL_TOKEN; else process.env.FULLSTACK_VERCEL_TOKEN = prevV;
    }
  });

  it("is inert when the FULLSTACK_BUILDS flag is off (default) — no executor, not configured", () => {
    // flag is unset in the test env → the path stays off and the caller uses the static build
    expect(fullstackConfigured({ githubToken: "ghp_x" } as never)).toBe(false);
    expect(fullstackBuildExecutor({ githubToken: "ghp_x" } as never)).toBeNull();
  });
});
