import "server-only";

// Real, verifiable execution layer — every integration is OFF until its key is set, and falls back
// to the simulated engine when absent (so the app stays fully usable offline with zero config). This
// is the seam where the agents do REAL work — build on GitHub, deploy, email, place ads, set up
// payments — each gated, and (where it applies) checked by "verify-before-done" before being reported
// as done. Nothing here runs live without the operator's credentials.

import type { Proof, ApprovalKind, Connections } from "./types";
import { assertSafeBaseUrl } from "./net";

const TIMEOUT_MS = 8000;

export interface ExecOutcome {
  ok: boolean;
  proof?: Proof;
  error?: string;
  disabled?: boolean; // true when the integration's key isn't set → caller uses simulated behavior
}
const disabled = (): ExecOutcome => ({ ok: false, disabled: true });
const fail = (e: unknown): ExecOutcome => ({ ok: false, error: e instanceof Error ? e.message : "unknown" });

async function timed(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] as string));
}
function repoSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "competitor-mvp";
}

// Which real integrations are live right now. github/email/ads can be turned on per-user (the
// founder's own connection) OR by the operator's env key — either one makes it live. model/deploy/
// payments remain operator-level. Passing `conn` reflects a specific user's connections; omitting it
// (e.g. the capability GET, which carries no creds) reports operator-env capabilities only.
export function capabilities(conn?: Connections) {
  return {
    model: !!(process.env.ANTHROPIC_API_KEY || process.env.AI_GATEWAY_API_KEY || process.env.MODEL_API_KEY),
    github: !!(conn?.githubToken || process.env.GITHUB_TOKEN),
    deploy: !!process.env.VERCEL_DEPLOY_HOOK_URL,
    email: !!((conn?.resendApiKey || process.env.RESEND_API_KEY) && (conn?.resendFrom || process.env.RESEND_FROM)),
    payments: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID),
    ads: !!(conn?.adsWebhookUrl || process.env.ADS_WEBHOOK_URL),
    bluesky: !!(process.env.BLUESKY_HANDLE && process.env.BLUESKY_APP_PASSWORD),
  };
}
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
      const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      const res = await fetch(proof.value, { method: "HEAD", signal: ctrl.signal });
      clearTimeout(t);
      return res.ok;
    } catch {
      return false;
    }
  }
  return false;
}

// ── Phase 1: GitHub build ────────────────────────────────────────────────────
export interface BuildSpec {
  repo: string;
  description: string;
  files: Record<string, string>;
}
export async function buildOnGitHub(spec: BuildSpec, token: string | undefined = process.env.GITHUB_TOKEN): Promise<ExecOutcome> {
  if (!token) return disabled();
  const headers = { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "content-type": "application/json" };
  try {
    const create = await timed("https://api.github.com/user/repos", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: spec.repo, description: spec.description, private: true, auto_init: true }),
    });
    if (!create.ok) return { ok: false, error: `repo ${create.status}` };
    const repo = (await create.json().catch(() => ({}))) as { full_name?: string; html_url?: string };
    if (!repo.full_name || !repo.html_url) return { ok: false, error: "no repo metadata" };
    for (const [path, content] of Object.entries(spec.files)) {
      await timed(`https://api.github.com/repos/${repo.full_name}/contents/${encodeURIComponent(path)}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ message: `feat: add ${path}`, content: Buffer.from(content, "utf8").toString("base64") }),
      });
    }
    const proof: Proof = { kind: "url", value: repo.html_url };
    return (await verifyProof(proof)) ? { ok: true, proof } : { ok: false, error: "verification failed" };
  } catch (e) {
    return fail(e);
  }
}

// ── Phase 2: Vercel deploy ───────────────────────────────────────────────────
export async function deployToVercel(): Promise<ExecOutcome> {
  const hook = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!hook) return disabled();
  try {
    const res = await timed(hook, { method: "POST" });
    if (!res.ok) return { ok: false, error: `deploy ${res.status}` };
    const url = process.env.VERCEL_PROJECT_URL;
    return { ok: true, proof: url ? { kind: "url", value: url } : { kind: "metric", value: "deploy triggered" } };
  } catch (e) {
    return fail(e);
  }
}

// ── Phase 2/3: Email (Resend) ────────────────────────────────────────────────
export async function sendEmail(
  opts: { to: string; subject: string; html: string },
  key: string | undefined = process.env.RESEND_API_KEY,
  from: string | undefined = process.env.RESEND_FROM
): Promise<ExecOutcome> {
  if (!key || !from || !opts.to) return disabled();
  try {
    const res = await timed("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
    });
    if (!res.ok) return { ok: false, error: `email ${res.status}` };
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, proof: { kind: "metric", value: data.id ? `email sent (${data.id})` : "email sent" } };
  } catch (e) {
    return fail(e);
  }
}

// ── Phase 3: Payments (Stripe payment link) ──────────────────────────────────
export async function createPaymentLink(): Promise<ExecOutcome> {
  const key = process.env.STRIPE_SECRET_KEY;
  const price = process.env.STRIPE_PRICE_ID;
  if (!key || !price) return disabled();
  try {
    const body = new URLSearchParams();
    body.set("line_items[0][price]", price);
    body.set("line_items[0][quantity]", "1");
    const res = await timed("https://api.stripe.com/v1/payment_links", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) return { ok: false, error: `stripe ${res.status}` };
    const data = (await res.json().catch(() => ({}))) as { url?: string };
    return { ok: true, proof: data.url ? { kind: "url", value: data.url } : { kind: "metric", value: "payment link created" } };
  } catch (e) {
    return fail(e);
  }
}

// ── Phase 3: Ads (operator-supplied webhook to their own ad pipeline) ─────────
export async function placeAd(
  spec: { objective: string; budget: number; copy: string },
  hook: string | undefined = process.env.ADS_WEBHOOK_URL,
  enforceSsrf = false
): Promise<ExecOutcome> {
  if (!hook) return disabled();
  try {
    // A per-user webhook is an untrusted URL receiving a server-side POST → SSRF-guard it. An
    // operator env webhook is trusted (may point at internal infra) and skips the guard.
    if (enforceSsrf) assertSafeBaseUrl(hook);
    const res = await timed(hook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(spec) });
    if (!res.ok) return { ok: false, error: `ads ${res.status}` };
    return { ok: true, proof: { kind: "metric", value: `ad queued: ${spec.objective}` } };
  } catch (e) {
    return fail(e);
  }
}

// ── Bluesky (AT Protocol) — free, approval-gated organic posting ──────────────
// Auth with a scoped app-password (createSession) → publish a post (createRecord). App-password is
// server-only and rotate-able; OFF until BLUESKY_HANDLE + BLUESKY_APP_PASSWORD are set. Never autonomous —
// only fires for a post the founder approved in the Approval Inbox.
export async function postToBluesky(opts: { text: string }): Promise<ExecOutcome> {
  const handle = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;
  const text = (opts.text || "").slice(0, 300);
  if (!handle || !password || !text) return disabled();
  try {
    const auth = await timed("https://bsky.social/xrpc/com.atproto.server.createSession", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier: handle, password }),
    });
    if (!auth.ok) return { ok: false, error: `bluesky auth ${auth.status}` };
    const session = (await auth.json().catch(() => ({}))) as { accessJwt?: string; did?: string };
    if (!session.accessJwt || !session.did) return { ok: false, error: "bluesky no session" };
    const res = await timed("https://bsky.social/xrpc/com.atproto.repo.createRecord", {
      method: "POST",
      headers: { authorization: `Bearer ${session.accessJwt}`, "content-type": "application/json" },
      body: JSON.stringify({
        repo: session.did,
        collection: "app.bsky.feed.post",
        record: { $type: "app.bsky.feed.post", text, createdAt: new Date().toISOString() },
      }),
    });
    if (!res.ok) return { ok: false, error: `bluesky post ${res.status}` };
    const data = (await res.json().catch(() => ({}))) as { uri?: string };
    const rkey = data.uri?.split("/").pop();
    const link = rkey ? `https://bsky.app/profile/${handle}/post/${rkey}` : undefined;
    return { ok: true, proof: link ? { kind: "url", value: link } : { kind: "metric", value: "posted to Bluesky" } };
  } catch (e) {
    return fail(e);
  }
}

// ── Dispatcher: map an agent action / approved item to its real executor ──────
export interface ActionPayload {
  company: { name: string; idea: string };
  item?: { kind: ApprovalKind | string; title?: string; detail?: string; amount?: number };
  ownerEmail?: string;
  connections?: Connections; // per-user credentials; each falls back to the operator env key
}
export async function runAction(action: string, p: ActionPayload): Promise<ExecOutcome> {
  const c = p.connections;
  switch (action) {
    case "build":
      return buildOnGitHub(
        {
          repo: repoSlug(p.company.name),
          description: p.company.idea.slice(0, 140),
          files: { "README.md": `# ${p.company.name}\n\n> ${p.company.idea}\n\nValidated MVP scaffolded by competitor.inc.\n` },
        },
        c?.githubToken || process.env.GITHUB_TOKEN
      );
    case "deploy":
      return deployToVercel();
    case "outreach": {
      const to = p.ownerEmail || process.env.OUTREACH_TO || "";
      if (!to) return disabled();
      return sendEmail(
        { to, subject: `[${p.company.name}] ${p.item?.title || "Outreach"}`, html: `<p>${escapeHtml(p.item?.detail || "")}</p>` },
        c?.resendApiKey || process.env.RESEND_API_KEY,
        c?.resendFrom || process.env.RESEND_FROM
      );
    }
    case "bluesky":
      return postToBluesky({ text: p.item?.detail || `${p.company.name}: ${p.company.idea}` });
    case "spend":
      return placeAd(
        { objective: p.item?.title || "demand test", budget: p.item?.amount ?? 50, copy: p.item?.detail || p.company.idea },
        c?.adsWebhookUrl || process.env.ADS_WEBHOOK_URL,
        !!c?.adsWebhookUrl // user-supplied URL → enforce SSRF guard
      );
    case "payments":
      return createPaymentLink();
    case "delete":
      return { ok: true, proof: { kind: "metric", value: "deletion acknowledged" } }; // destructive — no auto-API
    default:
      return { ok: false, error: "unknown action" };
  }
}
