// OpenHands adapter (Phase B, full-app builds) — the "one-line switch". OpenHands runs code in a Docker
// sandbox, so it lives OUTSIDE our serverless app: we call its API, poll for the live artifact URL, and
// plug the result into the SAME makeBuildExecute seam as the GitHub builder. Server-only, fail-soft.
//
// Gating: set OPENHANDS_API_URL + OPENHANDS_API_KEY (Cloud at app.all-hands.dev, or your self-hosted VM).
// Unset → openhandsConfigured() is false and the executor is null → caller falls back to the GitHub
// static builder / simulated path. Nothing changes until you provide an endpoint.
//
// ⚠️ TWO things to confirm when you wire a real endpoint:
//   1) The request/response SHAPE differs Cloud vs self-host — the two mapping spots are isolated below
//      (startBuild body + extractUrl) so it's a one-place change.
//   2) A real app build can take minutes; a synchronous poll only fits within the serverless function
//      timeout. For long builds, promote this to an async job (fire → status endpoint / Vercel Workflow).

import "server-only";
import { makeBuildExecute } from "./build-executor";
import { verifyProof } from "./execution";
import type { ExecuteFn } from "./supervisor";
import type { ByokConfig } from "@/lib/core/types";

const API_URL = process.env.OPENHANDS_API_URL;
const API_KEY = process.env.OPENHANDS_API_KEY;
const POLL_MS = 5000;
const MAX_WAIT_MS = 55_000; // serverless-safe; longer builds need the async pattern noted above

export function openhandsConfigured(): boolean {
  return !!(API_URL && API_KEY);
}

function buildPrompt(goal: string): string {
  return (
    `Build and deploy a working web app for: ${goal}. ` +
    `Ship it to a public URL (push to a GitHub repo and enable Pages, or deploy to a static host). ` +
    `When done, reply with the live URL.`
  );
}

// The one place to adjust for your OpenHands deployment's response shape.
function extractUrl(data: unknown): string | null {
  const d = (data ?? {}) as { result_url?: string; deploy_url?: string; url?: string };
  const u = d.result_url || d.deploy_url || d.url;
  return typeof u === "string" && /^https:\/\/\S+$/.test(u) ? u : null;
}

async function openhandsBuild(goal: string, byok?: ByokConfig): Promise<{ url: string } | null> {
  if (!API_URL || !API_KEY) return null;
  const base = API_URL.replace(/\/$/, "");
  const headers = { "content-type": "application/json", authorization: `Bearer ${API_KEY}` };
  try {
    // 1) start a build task (adjust body to your API)
    const start = await fetch(`${base}/api/conversations`, {
      method: "POST",
      headers,
      body: JSON.stringify({ initial_user_msg: buildPrompt(goal), ...(byok?.model ? { llm_model: byok.model } : {}) }),
    });
    if (!start.ok) return null;
    const conv = (await start.json().catch(() => ({}))) as { conversation_id?: string; id?: string };
    const id = conv.conversation_id || conv.id;
    if (!id) return null;
    // 2) poll for completion + an artifact URL
    const deadline = Date.now() + MAX_WAIT_MS;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      const st = await fetch(`${base}/api/conversations/${id}`, { headers });
      if (!st.ok) continue;
      const data = await st.json().catch(() => ({}));
      const url = extractUrl(data);
      if (url) return { url };
      if (typeof (data as { status?: string }).status === "string" && /error|failed|stopped/i.test((data as { status: string }).status)) return null;
    }
    return null; // timed out within the function window — promote to an async job for long builds
  } catch {
    return null;
  }
}

// Returns a build-capable ExecuteFn backed by OpenHands, or null when it isn't configured.
export function openhandsBuildExecutor(byok?: ByokConfig): ExecuteFn | null {
  if (!openhandsConfigured()) return null;
  return makeBuildExecute({
    build: (goal) => openhandsBuild(goal, byok),
    verifyUrl: (u) => verifyProof({ kind: "url", value: u }), // OpenHands deploys a live app → real HEAD check
  });
}
