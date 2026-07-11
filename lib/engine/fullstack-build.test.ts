import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { load as parseYaml } from "js-yaml";
import _sodium from "libsodium-wrappers";
import {
  dispatchFullstackBuild,
  buildFullstackWorkflowYaml,
  fullstackPromptFile,
  fullstackConfigured,
  fullstackBuildExecutor,
  fetchDeployedUrl,
  impliesAiFeature,
  aiFeatureBrief,
  impliesSaaS,
  saasBrief,
  impliesPlatform,
  platformBrief,
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
  // dispatch now fails fast without a model key (see the fail-fast test below). Give the happy-path tests one.
  let prevAnthropicKey: string | undefined;
  beforeEach(() => { prevAnthropicKey = process.env.FULLSTACK_ANTHROPIC_KEY; process.env.FULLSTACK_ANTHROPIC_KEY = "sk-ant-test-key"; });
  afterEach(() => { if (prevAnthropicKey === undefined) delete process.env.FULLSTACK_ANTHROPIC_KEY; else process.env.FULLSTACK_ANTHROPIC_KEY = prevAnthropicKey; });

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
    expect(yaml).toMatch(/ignoreBuildErrors/); // gate = "transpiles + runs", not "passes strict type-check"
    expect(yaml).toMatch(/if: always\(\)/); // build.log is committed even on failure → diagnosable
    expect(yaml).toMatch(/exit 1/); // self-repair exhausted → fail honestly (no swallowed deploy error)
    expect(yaml).toMatch(/secrets\.LLM_API_KEY/);
    expect(yaml).toMatch(/secrets\.VERCEL_TOKEN/);
    expect(yaml).toMatch(/ssoProtection/); // auto-disables Vercel Deployment Protection → app is public
  });

  it("generates VALID, parseable YAML with the expected steps (guards against inline `: ` breaking the file)", () => {
    const doc = parseYaml(buildFullstackWorkflowYaml()) as {
      jobs: { build: { steps: { name?: string; run?: string }[] } };
    };
    // parses at all (an inline `run: printf '...eslint: {...}'` scalar would throw here)
    const steps = doc.jobs.build.steps;
    const names = steps.map((s) => s.name).filter(Boolean);
    expect(names).toContain("Relax the build to transpile-only (agent code must RUN, not pass strict lint/types)");
    // the config step must be a multi-line block scalar (contains a newline), not a `: `-poisoned inline scalar
    const cfg = steps.find((s) => s.run?.includes("next.config.ts"));
    expect(cfg?.run).toContain("ignoreBuildErrors");
    expect(cfg?.run).toContain("\n"); // block scalar
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

  it("fails fast (no orphan repo) when no model key is available — Sensitive vars don't survive `vercel env pull`", async () => {
    const prevA = process.env.FULLSTACK_ANTHROPIC_KEY;
    const prevL = process.env.FULLSTACK_LLM_API_KEY;
    delete process.env.FULLSTACK_ANTHROPIC_KEY; // undo the beforeEach — simulate the empty-Sensitive-var case
    delete process.env.FULLSTACK_LLM_API_KEY;
    try {
      const gh = fakeGitHub();
      const out = await dispatchFullstackBuild({ goal: "x", token: "t", fetchImpl: gh.fetchImpl });
      expect((out as { error: string }).error).toMatch(/no build model key/i);
      expect(gh.calls.some((c) => c.url.endsWith("/user/repos"))).toBe(false); // never created a repo
    } finally {
      if (prevA === undefined) delete process.env.FULLSTACK_ANTHROPIC_KEY; else process.env.FULLSTACK_ANTHROPIC_KEY = prevA;
      if (prevL === undefined) delete process.env.FULLSTACK_LLM_API_KEY; else process.env.FULLSTACK_LLM_API_KEY = prevL;
    }
  });

  it("is inert when the FULLSTACK_BUILDS flag is off (default) — no executor, not configured", () => {
    // flag is unset in the test env → the path stays off and the caller uses the static build
    expect(fullstackConfigured({ githubToken: "ghp_x" } as never)).toBe(false);
    expect(fullstackBuildExecutor({ githubToken: "ghp_x" } as never)).toBeNull();
  });

  describe("R10 — grounded AI-feature builds ('a copilot for MY business', honestly scoped)", () => {
    it("detects assistant/chat/'answer questions about my data' intent — conservatively", () => {
      for (const g of [
        "a CRM with an assistant that answers questions about my customers",
        "a customer-support copilot for my docs",
        "a knowledge base I can chat with",
        "let me ask questions about my notes",
        "summarize my meeting notes",
      ]) expect(impliesAiFeature(g)).toBe(true);
      for (const g of ["a habit tracker with streaks", "a todo list", "an invoice generator", "a landing page for my bakery"])
        expect(impliesAiFeature(g)).toBe(false);
    });

    it("the AI-feature brief demands a GROUNDED, cited, abstaining chat route (the proving-ground contract)", () => {
      const p = fullstackPromptFile("a helpdesk copilot that answers questions about my tickets");
      expect(p).toMatch(/app\/api\/chat\/route\.ts/);
      expect(p.toLowerCase()).toContain("citations");
      expect(p.toLowerCase()).toContain("never fabricate");
      expect(p.toLowerCase()).toContain("another user's data"); // isolation
      // the standalone brief carries the same contract
      expect(aiFeatureBrief().toLowerCase()).toContain("retrieve");
    });

    it("a non-AI product gets NO chat route in its brief (detector is not trigger-happy)", () => {
      const p = fullstackPromptFile("a habit tracker with streaks");
      expect(p).not.toMatch(/app\/api\/chat\/route\.ts/);
    });

    it("the workflow adds the chat route to Aider's file set only when withChat is set", () => {
      expect(buildFullstackWorkflowYaml(undefined, undefined, { withChat: true })).toMatch(/app\/api\/chat\/route\.ts/);
      expect(buildFullstackWorkflowYaml()).not.toMatch(/app\/api\/chat\/route\.ts/); // default unchanged
    });

    it("P2: an Architect grounding-review step is added ONLY for AI-feature builds, and the YAML still parses", () => {
      const withChat = buildFullstackWorkflowYaml(undefined, undefined, { withChat: true });
      expect(withChat).toContain("Architect review — grounding correctness");
      expect(withChat).toContain("NEVER fabricate"); // the cite-or-abstain contract is enforced structurally
      expect(buildFullstackWorkflowYaml()).not.toContain("Architect review"); // default build unaffected
      // the conditional step didn't break YAML validity
      const doc = parseYaml(withChat) as { jobs: { build: { steps: { name?: string }[] } } };
      const names = doc.jobs.build.steps.map((s) => s.name).filter(Boolean);
      expect(names).toContain("Architect review — grounding correctness (P2; only when the product has an AI feature)");
    });

    it("an AI-feature goal wires the chat route THROUGH dispatch into the committed workflow", async () => {
      const gh = fakeGitHub();
      await dispatchFullstackBuild({ goal: "a copilot that answers questions about my inventory", token: "t", fetchImpl: gh.fetchImpl });
      const wfPut = gh.calls.find((c) => c.url.includes("build-fullstack.yml"));
      const yaml = Buffer.from(JSON.parse(wfPut!.body!).content, "base64").toString("utf8");
      expect(yaml).toMatch(/app\/api\/chat\/route\.ts/);
    });
  });

  describe("S3 — real SaaS builds (accounts + auth + per-user data, multi-page)", () => {
    it("detects account/auth/multi-page intent — conservatively", () => {
      for (const g of [
        "a project-management SaaS with team accounts and a dashboard",
        "a habit tracker where users sign up and log in",
        "an admin panel with roles and permissions",
        "a members portal with subscriptions",
      ]) expect(impliesSaaS(g)).toBe(true);
      for (const g of ["a single-page tip calculator", "a static landing page for my cafe", "a color palette generator"])
        expect(impliesSaaS(g)).toBe(false);
    });

    it("the SaaS brief demands auth + a protected multi-page product + per-user isolation", () => {
      const p = fullstackPromptFile("a CRM SaaS with accounts and a dashboard");
      expect(p).toMatch(/app\/login\/page\.tsx/);
      expect(p).toMatch(/app\/dashboard\/page\.tsx/);
      expect(p.toLowerCase()).toContain("never store plaintext");
      expect(p.toLowerCase()).toContain("another's rows"); // per-user isolation, graded
      expect(saasBrief().toLowerCase()).toContain("fails closed (401)");
    });

    it("a single-page product gets NO auth/pages in its brief (detector isn't trigger-happy)", () => {
      const p = fullstackPromptFile("a single-page tip calculator");
      expect(p).not.toMatch(/app\/login\/page\.tsx/);
    });

    it("the workflow adds auth + login/dashboard to Aider's file set only when withSaas is set", () => {
      const saas = buildFullstackWorkflowYaml(undefined, undefined, { withSaas: true });
      expect(saas).toMatch(/app\/login\/page\.tsx/);
      expect(saas).toMatch(/app\/dashboard\/page\.tsx/);
      expect(saas).toMatch(/app\/api\/auth\/route\.ts/);
      expect(buildFullstackWorkflowYaml()).not.toMatch(/app\/login\/page\.tsx/); // default unchanged
      // the file set stays valid YAML with both features on
      const both = buildFullstackWorkflowYaml(undefined, undefined, { withSaas: true, withChat: true });
      expect(both).toMatch(/app\/api\/chat\/route\.ts/);
      expect(both).toMatch(/app\/login\/page\.tsx/);
    });

    it("a SaaS goal wires the auth route THROUGH dispatch into the committed workflow", async () => {
      const gh = fakeGitHub();
      await dispatchFullstackBuild({ goal: "a SaaS with user accounts and a dashboard", token: "t", fetchImpl: gh.fetchImpl });
      const wfPut = gh.calls.find((c) => c.url.includes("build-fullstack.yml"));
      const yaml = Buffer.from(JSON.parse(wfPut!.body!).content, "base64").toString("utf8");
      expect(yaml).toMatch(/app\/api\/auth\/route\.ts/);
    });
  });

  describe("S5 — platform-class builds (versioned public API a third party integrates against)", () => {
    it("detects public-API / developer / integration intent — conservatively", () => {
      for (const g of [
        "a public API developers can build on",
        "a REST API with API keys for third-party integrations",
        "a platform with webhooks and an SDK",
        "an API-first inventory service",
      ]) expect(impliesPlatform(g)).toBe(true);
      for (const g of ["a personal journal app", "a wedding RSVP page", "a pomodoro timer"])
        expect(impliesPlatform(g)).toBe(false);
    });

    it("the platform brief demands a versioned API + API-key auth + OpenAPI + tenant isolation", () => {
      const p = fullstackPromptFile("a public API developers can build on");
      expect(p).toMatch(/app\/api\/v1\//);
      expect(p.toLowerCase()).toContain("api key");
      expect(p.toLowerCase()).toContain("openapi");
      expect(p.toLowerCase()).toContain("v1 must never"); // versioning discipline
      expect(p.toLowerCase()).toContain("hash of each key"); // never store plaintext keys
      expect(platformBrief().toLowerCase()).toContain("another tenant's data"); // isolation, graded
    });

    it("a non-platform product gets NO v1 API in its brief (detector isn't trigger-happy)", () => {
      expect(fullstackPromptFile("a pomodoro timer")).not.toMatch(/app\/api\/v1\//);
    });

    it("the workflow adds the v1 API + keys + openapi to Aider's file set only when withPlatform is set", () => {
      const plat = buildFullstackWorkflowYaml(undefined, undefined, { withPlatform: true });
      expect(plat).toMatch(/app\/api\/v1\/items\/route\.ts/);
      expect(plat).toMatch(/app\/api\/keys\/route\.ts/);
      expect(plat).toMatch(/app\/openapi\.json/);
      expect(buildFullstackWorkflowYaml()).not.toMatch(/app\/api\/v1\//); // default unchanged
    });

    it("a platform goal wires the v1 API THROUGH dispatch into the committed workflow", async () => {
      const gh = fakeGitHub();
      await dispatchFullstackBuild({ goal: "a public API for developers to build on", token: "t", fetchImpl: gh.fetchImpl });
      const wfPut = gh.calls.find((c) => c.url.includes("build-fullstack.yml"));
      const yaml = Buffer.from(JSON.parse(wfPut!.body!).content, "base64").toString("utf8");
      expect(yaml).toMatch(/app\/api\/v1\/items\/route\.ts/);
    });
  });

  describe("P1 — product-memory recall flows into a change build", () => {
    it("a first build (no recall) has no 'CONTINUING' framing", () => {
      expect(fullstackPromptFile("a notes app")).not.toContain("CONTINUING an existing product");
    });

    it("a recall brief is injected AHEAD of everything, so the agent continues the product", () => {
      const recall = 'PRODUCT MEMORY — you are CONTINUING an existing product ("notes-app"), NOT starting fresh.';
      const brief = fullstackPromptFile("add tags to notes", { recall });
      expect(brief).toContain(recall);
      expect(brief.indexOf(recall)).toBe(0); // first thing the agent reads
    });

    it("dispatch threads recall into the committed PROMPT.md", async () => {
      const gh = fakeGitHub();
      const recall = 'PRODUCT MEMORY — you are CONTINUING an existing product ("x"), NOT starting fresh.';
      await dispatchFullstackBuild({ goal: "add export", token: "t", fetchImpl: gh.fetchImpl, recall });
      const promptPut = gh.calls.find((c) => c.url.includes("PROMPT.md"));
      const body = Buffer.from(JSON.parse(promptPut!.body!).content, "base64").toString("utf8");
      expect(body).toContain(recall);
    });
  });

  describe("S4 — the suite recall threads into a build so a 2nd product joins, not stands alone", () => {
    it("dispatch threads suiteRecall into the committed PROMPT.md, ahead of the goal", async () => {
      const gh = fakeGitHub();
      const suiteRecall = 'PRODUCT SUITE — this customer ("your workspace") already runs 2 product(s), and this new one JOINS that suite.';
      await dispatchFullstackBuild({ goal: "a scheduling tool", token: "t", fetchImpl: gh.fetchImpl, suiteRecall });
      const promptPut = gh.calls.find((c) => c.url.includes("PROMPT.md"));
      const body = Buffer.from(JSON.parse(promptPut!.body!).content, "base64").toString("utf8");
      expect(body).toContain(suiteRecall);
      expect(body.indexOf(suiteRecall)).toBeLessThan(body.indexOf("a scheduling tool")); // frames the whole build
    });
  });

  describe("fetchDeployedUrl (Slice 2 — capture the live Vercel URL from the workflow)", () => {
    const withContent = (text: string): FetchLike => async () => ({
      ok: true, status: 200, json: async () => ({ content: Buffer.from(text, "utf8").toString("base64") }),
    });

    it("returns the live Vercel URL once the workflow has committed deploy-url.txt", async () => {
      const url = await fetchDeployedUrl({ repo: "octocat/app-x", token: "t", fetchImpl: withContent("https://app-x-abc123.vercel.app\n") });
      expect(url).toBe("https://app-x-abc123.vercel.app");
    });

    it("returns null while the build is still running (deploy-url.txt not committed → 404)", async () => {
      const notFound: FetchLike = async () => ({ ok: false, status: 404, json: async () => ({}) });
      expect(await fetchDeployedUrl({ repo: "octocat/app-x", token: "t", fetchImpl: notFound })).toBeNull();
    });

    it("never returns a non-Vercel or malformed URL (verify-before-done floor)", async () => {
      expect(await fetchDeployedUrl({ repo: "r", token: "t", fetchImpl: withContent("https://evil.com/app") })).toBeNull();
      expect(await fetchDeployedUrl({ repo: "r", token: "t", fetchImpl: withContent("not a url at all") })).toBeNull();
      expect(await fetchDeployedUrl({ repo: "r", token: "t", fetchImpl: withContent("") })).toBeNull();
    });

    it("fails soft (null) on a network error", async () => {
      const boom: FetchLike = async () => { throw new Error("network"); };
      expect(await fetchDeployedUrl({ repo: "r", token: "t", fetchImpl: boom })).toBeNull();
    });
  });
});
