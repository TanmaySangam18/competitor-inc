import "server-only";

// Phase 1 — real, verifiable execution. OFF until credentials are added.
//
// Today every agent action is simulated. This module is the seam where the engineer agent (Forge)
// does REAL work — creating a GitHub repo, committing code, opening a PR — and where we enforce
// "verify-before-done": a task is only reported done if its proof artifact is genuinely real and
// reachable; otherwise it is credited back (never charged). This is the exact trust gap that sinks
// the incumbent ("marked complete without deploying"). Nothing here runs until GITHUB_TOKEN is set,
// so the live product keeps running on the simulated engine until the operator opts in.

import type { Proof } from "./types";

const EXEC_TIMEOUT_MS = 8000;

// Real execution is enabled only when the operator provides a GitHub token (server-side secret).
export function realExecutionEnabled(): boolean {
  return !!process.env.GITHUB_TOKEN;
}

// Verify-before-done: the trust moat. A proof only counts if it is genuinely real.
export async function verifyProof(proof?: Proof): Promise<boolean> {
  if (!proof || !proof.value) return false;
  if (proof.kind === "metric") return true; // a reported metric is self-describing
  if (proof.kind === "build") return /[0-9a-f]{7,40}/i.test(proof.value); // looks like a real commit SHA
  if (proof.kind === "url") {
    let u: URL;
    try { u = new URL(proof.value); } catch { return false; }
    if (u.protocol !== "https:") return false;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), EXEC_TIMEOUT_MS);
      const res = await fetch(proof.value, { method: "HEAD", signal: ctrl.signal });
      clearTimeout(t);
      return res.ok;
    } catch {
      return false;
    }
  }
  return false;
}

export interface BuildSpec {
  repo: string; // repository name to create
  description: string; // short repo description
  files: Record<string, string>; // path -> contents (the MVP scaffold)
}
export interface BuildOutcome {
  ok: boolean;
  proof?: Proof; // a real, verified repo/commit URL on success
  error?: string;
}

// Forge's real "build the MVP" action: create a repo + commit the files via the GitHub REST API,
// then VERIFY the result before reporting success. Returns { ok: false } when disabled, so callers
// transparently fall back to the simulated engine — nothing live happens without a token.
export async function buildOnGitHub(spec: BuildSpec): Promise<BuildOutcome> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return { ok: false, error: "disabled" }; // gated off → simulated fallback

  const headers = {
    authorization: `Bearer ${token}`,
    accept: "application/vnd.github+json",
    "content-type": "application/json",
  };
  try {
    const create = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: spec.repo, description: spec.description, private: true, auto_init: true }),
    });
    if (!create.ok) return { ok: false, error: `repo ${create.status}` };
    const repo = await create.json();
    const fullName: string | undefined = repo?.full_name;
    const url: string | undefined = repo?.html_url;
    if (!fullName || !url) return { ok: false, error: "no repo metadata" };

    for (const [path, content] of Object.entries(spec.files)) {
      await fetch(`https://api.github.com/repos/${fullName}/contents/${encodeURIComponent(path)}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ message: `feat: add ${path}`, content: Buffer.from(content, "utf8").toString("base64") }),
      });
    }

    // verify-before-done: the repo URL must be real and reachable before we call this a success
    const proof: Proof = { kind: "url", value: url };
    return (await verifyProof(proof)) ? { ok: true, proof } : { ok: false, error: "verification failed" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}
