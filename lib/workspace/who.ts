// ─────────────────────────────────────────────────────────────────────────────
// WHO IS ASKING — the gate in front of anything the founder signs.
//
// /api/workspace had no caller authentication. That is fine while every founder-signed tool refuses
// anyway, and it is not fine the moment build.start can spend CI minutes and write to a real repo.
// So this exists BEFORE the first real build rather than after the first surprise.
//
// FAIL CLOSED. Three proofs are accepted and nothing else. If none is present the answer is no, with
// a reason naming what to configure, because a refusal that does not tell you what to do is the thing
// this company exists not to ship.
// ─────────────────────────────────────────────────────────────────────────────

import { getServerSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

/** Just the shape these functions read. Matches model-providers.ts so call sites need no casts. */
export type Env = Record<string, string | undefined>;

export type Caller =
  | { ok: true; who: string; proof: "session" | "operator-secret" | "loopback" }
  | { ok: false; reason: string };

/** Is this process running on a deployment platform rather than someone's laptop? */
export function isDeployed(env: Env = process.env): boolean {
  return !!(env.VERCEL || env.VERCEL_ENV || env.AWS_LAMBDA_FUNCTION_NAME || env.FLY_APP_NAME || env.RENDER || env.K_SERVICE);
}

/**
 * Did this request arrive over the loopback interface of a NON-deployed process?
 *
 * On a laptop, a request from 127.0.0.1 is the machine's owner, and treating that as proof is how
 * local developer tools normally work. On a deployment platform it proves nothing at all: every
 * request arrives from the platform's own proxy and would look local. So the deployment check is not
 * belt-and-braces, it is the whole reason this is safe.
 */
export function isLocalOperator(req: Request, env: Env = process.env): boolean {
  if (isDeployed(env)) return false;
  let host: string;
  try {
    host = new URL(req.url).hostname;
  } catch {
    return false;
  }
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
}

/** Constant-time-ish comparison, so a wrong secret leaks nothing through timing. */
function sameSecret(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * The gate. Order matters: the strongest proof is checked first so a real signed-in founder is
 * always attributed to their own account rather than to "the local operator".
 */
export async function authoriseApproval(req: Request, env: Env = process.env): Promise<Caller> {
  // 1. A real session. The only proof that survives deployment.
  if (isSupabaseConfigured()) {
    try {
      const sb = await getServerSupabase();
      const { data } = (await sb?.auth.getUser()) ?? { data: null };
      if (data?.user) return { ok: true, who: data.user.email ?? data.user.id, proof: "session" };
    } catch {
      // Fall through to the other proofs rather than failing the whole request on an auth hiccup.
    }
  }

  // 2. An operator secret, for CI and remote operation where there is no browser session.
  const configured = env.WORKSPACE_APPROVAL_SECRET?.trim();
  if (configured) {
    const presented = req.headers.get("x-workspace-approval")?.trim();
    if (presented && sameSecret(presented, configured)) {
      return { ok: true, who: "operator", proof: "operator-secret" };
    }
  }

  // 3. Loopback on a machine that is not a deployment.
  if (isLocalOperator(req, env)) return { ok: true, who: "local operator", proof: "loopback" };

  return {
    ok: false,
    reason: isDeployed(env)
      ? "Sign in to approve this. On a deployment, loopback proves nothing, so a session or the WORKSPACE_APPROVAL_SECRET header is required."
      : "Nobody could be identified for this approval. Sign in, or set WORKSPACE_APPROVAL_SECRET and send it as the x-workspace-approval header.",
  };
}
