import { describe, it, expect } from "vitest";
import { dispatchAiderBuild, buildWorkflowYaml, promptFile, aiderActionsConfigured, type FetchLike } from "./aider-build";

// A fake GitHub API that records calls and returns canned responses, so the whole dispatch sequence is
// verified with zero network. Each entry matches a URL substring → response.
function fakeGitHub(overrides: Record<string, { ok: boolean; status: number; body?: unknown }> = {}) {
  const calls: { url: string; method?: string; body?: string }[] = [];
  const fetchImpl: FetchLike = async (url, init) => {
    calls.push({ url, method: init?.method, body: init?.body });
    const hit = Object.keys(overrides).find((k) => url.includes(k));
    if (hit) {
      const r = overrides[hit];
      return { ok: r.ok, status: r.status, json: async () => r.body ?? {} };
    }
    // defaults: repo create returns metadata; everything else 200 ok
    if (url.endsWith("/user/repos")) {
      return { ok: true, status: 201, json: async () => ({ full_name: "octocat/study-timer-abcde" }) };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };
  return { fetchImpl, calls };
}

describe("aider-build (free full-app builds)", () => {
  it("runs the full sequence and returns the canonical Pages URL", async () => {
    const gh = fakeGitHub();
    const out = await dispatchAiderBuild({ goal: "a study timer app", token: "t", fetchImpl: gh.fetchImpl });
    expect(out).not.toBeNull();
    expect(out!.url).toMatch(/^https:\/\/octocat\.github\.io\/.+\/$/);
    // it created a repo, committed the workflow + prompt + placeholder, enabled pages, and dispatched
    const urls = gh.calls.map((c) => c.url);
    expect(urls.some((u) => u.endsWith("/user/repos"))).toBe(true);
    expect(urls.some((u) => u.includes("/contents/") && u.includes("build-app.yml"))).toBe(true);
    expect(urls.some((u) => u.includes("/contents/") && u.includes("PROMPT.md"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/pages"))).toBe(true);
    expect(urls.some((u) => u.includes("/actions/workflows/build-app.yml/dispatches"))).toBe(true);
  });

  it("returns null when repo creation fails (degrade honestly)", async () => {
    const gh = fakeGitHub({ "/user/repos": { ok: false, status: 403 } });
    const out = await dispatchAiderBuild({ goal: "x", token: "t", fetchImpl: gh.fetchImpl });
    expect(out).toBeNull();
  });

  it("returns null when committing the workflow file is forbidden (missing `workflow` scope)", async () => {
    // repo create ok, but the workflow-file PUT 403s
    const gh = fakeGitHub({ "build-app.yml": { ok: false, status: 403 } });
    const out = await dispatchAiderBuild({ goal: "x", token: "t", fetchImpl: gh.fetchImpl });
    expect(out).toBeNull();
    // never dispatched, since the workflow wasn't committed
    expect(gh.calls.some((c) => c.url.includes("/dispatches"))).toBe(false);
  });

  it("does NOT dispatch when workflow_dispatch itself fails", async () => {
    const gh = fakeGitHub({ "/dispatches": { ok: false, status: 422 } });
    const out = await dispatchAiderBuild({ goal: "x", token: "t", fetchImpl: gh.fetchImpl });
    expect(out).toBeNull();
  });

  it("workflow YAML is well-formed: dispatch trigger, free key secret, Aider run, push", () => {
    const yaml = buildWorkflowYaml("groq/llama-3.3-70b-versatile", "GROQ_API_KEY");
    expect(yaml).toContain("workflow_dispatch");
    expect(yaml).toContain("secrets.LLM_API_KEY");
    expect(yaml).toContain("GROQ_API_KEY:");
    expect(yaml).toContain("aider --yes --model groq/llama-3.3-70b-versatile");
    expect(yaml).toContain("git push");
    expect(yaml).toContain("permissions:");
  });

  it("prompt file carries the goal + the no-build-step constraints", () => {
    const p = promptFile("a habit tracker");
    expect(p).toContain("a habit tracker");
    expect(p).toContain("index.html, app.js, styles.css");
    expect(p).toContain("localStorage");
  });

  it("configured only when a token is available", () => {
    expect(aiderActionsConfigured({ githubToken: "t", resendApiKey: "", resendFrom: "", adsWebhookUrl: "" })).toBe(true);
    const prev = process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_TOKEN;
    expect(aiderActionsConfigured({ githubToken: "", resendApiKey: "", resendFrom: "", adsWebhookUrl: "" })).toBe(false);
    if (prev) process.env.GITHUB_TOKEN = prev;
  });
});
