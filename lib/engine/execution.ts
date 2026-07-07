import "server-only";

// Real, verifiable execution layer — every integration is OFF until its key is set, and falls back
// to the simulated engine when absent (so the app stays fully usable offline with zero config). This
// is the seam where the agents do REAL work — build on GitHub, deploy, email, place ads, set up
// payments — each gated, and (where it applies) checked by "verify-before-done" before being reported
// as done. Nothing here runs live without the operator's credentials.

import type { Proof, ApprovalKind, Connections } from "./types";
import { assertSafeBaseUrl, fetchWithTimeout } from "./net";
import { escapeHtml } from "./html";
import { generateSiteFiles } from "./server";
import { overHardCap, hardSpendCapCents } from "./spend-cap";
import { namespacedResource } from "./hosting";

const TIMEOUT_MS = 8000;

export interface ExecOutcome {
  ok: boolean;
  proof?: Proof;
  error?: string;
  disabled?: boolean; // true when the integration's key isn't set → caller uses simulated behavior
}
const disabled = (): ExecOutcome => ({ ok: false, disabled: true });
const fail = (e: unknown): ExecOutcome => ({ ok: false, error: e instanceof Error ? e.message : "unknown" });

const timed = (url: string, init: RequestInit): Promise<Response> => fetchWithTimeout(url, init, TIMEOUT_MS);
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
    mastodon: !!(process.env.MASTODON_BASE_URL && process.env.MASTODON_ACCESS_TOKEN),
    reddit: !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET && process.env.REDDIT_USERNAME && process.env.REDDIT_PASSWORD),
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
      const res = await timed(proof.value, { method: "HEAD" });
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
// A real, single-file landing page for the idea — so the build ships an actual OPENABLE website, not a
// bare repo. Inline CSS, no build step, works as a static GitHub Pages site.
// Turn a build PROMPT into a clean product tagline: take the first sentence, strip "build me a / I want"
// lead-ins, so the page reads like a product — never the raw prompt pasted in.
function productBlurb(idea: string): string {
  const first = idea.trim().split(/(?<=[.!?])\s+/)[0] || idea.trim();
  let s = first
    .replace(/^\s*(please\s+)?(build|make|create|develop|design)\s+(me\s+)?(a|an|the)?\s*/i, "")
    .replace(/^\s*(i\s+want|i\s+need|i'?d\s+like|i\s+would\s+like)\s+(to\s+have\s+|to\s+)?(a|an|the)?\s*/i, "");
  s = s.charAt(0).toUpperCase() + s.slice(1);
  return s.slice(0, 160);
}

// The deterministic fallback when the model can't author a real app (no capable build model connected).
// NOT a "coming soon" page and NOT the raw prompt dumped — a credible early product site (hero, what-it-
// does, why, how-it-works, CTA). Real FUNCTIONAL apps come from generateSiteFiles("app") when a capable
// build model (ANTHROPIC_API_KEY / BYOK) is connected.
export function siteHtml(name: string, idea: string): string {
  const n = escapeHtml(name);
  const blurb = escapeHtml(productBlurb(idea));
  const desc = escapeHtml(idea.trim().slice(0, 320));
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${n}</title><meta name="description" content="${blurb}">
<style>
*{box-sizing:border-box;margin:0}html{scroll-behavior:smooth}
body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#faf6ee;color:#1c1917;line-height:1.6}
.wrap{max-width:900px;margin:0 auto;padding:0 24px}
nav{display:flex;align-items:center;justify-content:space-between;padding:20px 0}
nav .brand{font-weight:800;font-size:18px;letter-spacing:-.02em}
.btn{background:#ea580c;color:#fff;text-decoration:none;padding:11px 18px;border-radius:10px;font-weight:600;font-size:14px;display:inline-block}
header{padding:64px 0 52px;text-align:center}
header h1{font-size:clamp(2.2rem,6vw,3.6rem);font-weight:800;letter-spacing:-.03em;line-height:1.05}
header p{font-size:1.2rem;color:#57534e;margin:18px auto 0;max-width:640px}
.hero-cta{margin-top:30px}
section{padding:38px 0;border-top:1px solid #00000010}
h2{font-size:1.5rem;font-weight:700;letter-spacing:-.01em;margin-bottom:10px}
.lead{color:#57534e;max-width:640px}
.grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));margin-top:22px}
.card{background:#fff;border:1px solid #00000012;border-radius:16px;padding:20px}
.card h3{font-size:1rem;margin-bottom:6px}.card p{color:#57534e;font-size:.95rem}
.steps{margin-top:20px;display:grid;gap:14px}.step{display:flex;gap:14px;align-items:flex-start}
.step .num{flex:none;width:30px;height:30px;border-radius:50%;background:#ea580c;color:#fff;display:grid;place-items:center;font-weight:700;font-size:14px}
form{margin-top:20px;display:flex;gap:8px;flex-wrap:wrap}
input{flex:1;min-width:240px;padding:14px 16px;border:1px solid #00000022;border-radius:12px;font-size:15px;background:#fff}
button{padding:14px 22px;border:0;border-radius:12px;background:#ea580c;color:#fff;font-weight:600;font-size:15px;cursor:pointer}
footer{padding:44px 0;text-align:center;font-size:13px;color:#a8a29e}footer a{color:#78716c}
</style></head>
<body><div class="wrap">
<nav><span class="brand">${n}</span><a class="btn" href="#get-started">Get started</a></nav>
<header>
<h1>${n}</h1>
<p>${blurb}</p>
<div class="hero-cta"><a class="btn" href="#get-started">Get early access</a></div>
</header>
<section><h2>What it does</h2><p class="lead">${desc}</p></section>
<section><h2>Why ${n}</h2><div class="grid">
<div class="card"><h3>Built around your idea</h3><p>Shaped to exactly what you described — not a generic template.</p></div>
<div class="card"><h3>Yours to own</h3><p>Your product, your customers, your data. You stay in control the whole way.</p></div>
<div class="card"><h3>Ships fast</h3><p>Start with a real, working first version and improve from real usage.</p></div>
</div></section>
<section><h2>How it works</h2><div class="steps">
<div class="step"><span class="num">1</span><div><strong>Tell us what you want.</strong> What you described is the spec.</div></div>
<div class="step"><span class="num">2</span><div><strong>The crew builds &amp; validates.</strong> A working first version plus an honest read on demand.</div></div>
<div class="step"><span class="num">3</span><div><strong>You launch &amp; grow.</strong> Get it in front of real people and improve from what they do.</div></div>
</div></section>
<section id="get-started"><h2>Get early access</h2><p class="lead">Be first to try ${n}.</p>
<form onsubmit="event.preventDefault();this.outerHTML='<p style=&quot;margin-top:16px;color:#16a34a;font-weight:600&quot;>Thanks — you are on the list.</p>'">
<input type="email" placeholder="you@email.com" aria-label="Email" required>
<button type="submit">Notify me</button>
</form></section>
<footer>Shipped by <a href="https://competitor-inc-zeta.vercel.app">competitor.inc</a></footer>
</div></body></html>`;
}

// `isPublic` defaults true so the resulting site/repo URL is publicly resolvable — which is what makes the
// receipt CHECKABLE ("Don't trust us — click it"). We push a real index.html and enable GitHub Pages so
// the build ships an actual OPENABLE WEBSITE (not just code). Pages deploys asynchronously (~1 min), so we
// don't hard-fail on a not-yet-live HEAD — the repo + files exist now, which is the real artifact.
export async function buildOnGitHub(
  spec: BuildSpec,
  token: string | undefined = process.env.GITHUB_TOKEN,
  isPublic = true
): Promise<ExecOutcome> {
  if (!token) return disabled();
  const headers = { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "content-type": "application/json" };
  try {
    const create = await timed("https://api.github.com/user/repos", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: spec.repo, description: spec.description, private: !isPublic, auto_init: true }),
    });
    if (!create.ok) return { ok: false, error: `repo ${create.status}` };
    const repo = (await create.json().catch(() => ({}))) as { full_name?: string; html_url?: string; name?: string };
    if (!repo.full_name || !repo.html_url) return { ok: false, error: "no repo metadata" };
    for (const [path, content] of Object.entries(spec.files)) {
      await timed(`https://api.github.com/repos/${repo.full_name}/contents/${encodeURIComponent(path)}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ message: `feat: add ${path}`, content: Buffer.from(content, "utf8").toString("base64") }),
      });
    }
    // Turn the repo into a live website via GitHub Pages. Best-effort: on failure we fall back to the
    // repo URL (still a real, resolvable artifact). 409 = Pages already enabled.
    let siteUrl = repo.html_url;
    try {
      const [owner, repoName] = repo.full_name.split("/");
      const pg = await timed(`https://api.github.com/repos/${repo.full_name}/pages`, {
        method: "POST",
        headers,
        body: JSON.stringify({ source: { branch: "main", path: "/" } }),
      });
      if (pg.ok || pg.status === 409) siteUrl = `https://${owner}.github.io/${repoName}/`;
    } catch {
      /* keep the repo URL as the artifact */
    }
    return { ok: true, proof: { kind: "url", value: siteUrl } };
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

// ── Mastodon — free, bot-friendly, approval-gated organic posting ─────────────
// Posts to competitor.inc's OWN Mastodon account (a "roomie" bot) marketing a user's company. OFF until
// MASTODON_BASE_URL + MASTODON_ACCESS_TOKEN are set. Only fires for posts approved under a campaign policy.
export async function postToMastodon(opts: { text: string }): Promise<ExecOutcome> {
  const base = process.env.MASTODON_BASE_URL;
  const token = process.env.MASTODON_ACCESS_TOKEN;
  const text = (opts.text || "").slice(0, 500);
  if (!base || !token || !text) return disabled();
  try {
    const res = await timed(`${base.replace(/\/$/, "")}/api/v1/statuses`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ status: text, visibility: "public" }),
    });
    if (!res.ok) return { ok: false, error: `mastodon ${res.status}` };
    const data = (await res.json().catch(() => ({}))) as { url?: string };
    return { ok: true, proof: data.url ? { kind: "url", value: data.url } : { kind: "metric", value: "posted to Mastodon" } };
  } catch (e) {
    return fail(e);
  }
}

// ── Reddit — approval-gated organic posting (Block D) ─────────────────────────
// Script-app OAuth (password grant) → submit a self/link post. OFF until all four env vars are set.
// Reddit blocks datacenter IPs for anonymous reads, but AUTHENTICATED API calls from a server are fine.
// Never autonomous — only fires for a post the founder approved. Subreddit + rules are the founder's
// responsibility (reddiquette); we default to the user's profile ("u_<name>") which is always postable.
export async function postToReddit(opts: { title: string; text: string; subreddit?: string }): Promise<ExecOutcome> {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  const user = process.env.REDDIT_USERNAME;
  const pass = process.env.REDDIT_PASSWORD;
  const title = (opts.title || "").slice(0, 300);
  const text = (opts.text || "").slice(0, 4000);
  if (!id || !secret || !user || !pass || !title) return disabled();
  const ua = `web:competitor.inc:v1 (by /u/${user})`;
  try {
    const auth = await timed("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
        "content-type": "application/x-www-form-urlencoded",
        "user-agent": ua,
      },
      body: `grant_type=password&username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`,
    });
    if (!auth.ok) return { ok: false, error: `reddit auth ${auth.status}` };
    const tok = (await auth.json().catch(() => ({}))) as { access_token?: string };
    if (!tok.access_token) return { ok: false, error: "reddit no token" };
    // Default to the poster's own profile subreddit — always allowed, no subreddit rules to trip.
    const sr = (opts.subreddit || `u_${user}`).replace(/^r\//, "");
    const res = await timed("https://oauth.reddit.com/api/submit", {
      method: "POST",
      headers: { authorization: `Bearer ${tok.access_token}`, "content-type": "application/x-www-form-urlencoded", "user-agent": ua },
      body: `sr=${encodeURIComponent(sr)}&kind=self&title=${encodeURIComponent(title)}&text=${encodeURIComponent(text)}&api_type=json`,
    });
    if (!res.ok) return { ok: false, error: `reddit submit ${res.status}` };
    const data = (await res.json().catch(() => ({}))) as { json?: { data?: { url?: string }; errors?: unknown[] } };
    const errs = data.json?.errors;
    if (Array.isArray(errs) && errs.length) return { ok: false, error: `reddit: ${JSON.stringify(errs[0])}` };
    const link = data.json?.data?.url;
    return { ok: true, proof: link ? { kind: "url", value: link } : { kind: "metric", value: "posted to Reddit" } };
  } catch (e) {
    return fail(e);
  }
}

// ── Dispatcher: map an agent action / approved item to its real executor ──────
export interface ActionPayload {
  company: { name: string; idea: string };
  companyId?: string; // tenant identity — namespaces the hosted artifact (per-tenant isolation)
  item?: { kind: ApprovalKind | string; title?: string; detail?: string; amount?: number };
  ownerEmail?: string;
  connections?: Connections; // per-user credentials; each falls back to the operator env key
}
export async function runAction(action: string, p: ActionPayload): Promise<ExecOutcome> {
  const c = p.connections;
  switch (action) {
    case "build": {
      // Forge v2: the model AUTHORS a real, FUNCTIONAL client-side app ("app" mode) — working views +
      // localStorage, not just a landing page. Needs a capable build model (ANTHROPIC_API_KEY / BYOK);
      // weaker/free models can't emit valid app JSON, so any failure falls back to a credible product site.
      const generated = await generateSiteFiles(p.company.name, p.company.idea, undefined, "app").catch(() => null);
      const files = generated ?? { "index.html": siteHtml(p.company.name, p.company.idea) };
      // Per-tenant hosting contract: namespace the repo to this tenant so two founders building the same
      // idea can never collide (and idempotent re-runs hit the same repo). Falls back to the bare slug
      // offline (no identity), preserving sim parity.
      const repo = namespacedResource(repoSlug(p.company.name), { companyId: p.companyId, ownerEmail: p.ownerEmail });
      return buildOnGitHub(
        { repo, description: p.company.idea.slice(0, 140), files },
        c?.githubToken || process.env.GITHUB_TOKEN
      );
    }
    case "deploy":
      return deployToVercel();
    case "outreach": {
      const to = p.ownerEmail || process.env.OUTREACH_TO || "";
      if (!to) return disabled();
      // Compliance gate, in the send path (CAN-SPAM/GDPR): every outbound email carries sender identity +
      // a working opt-out, appended server-side so no send can bypass it. (Cold-outreach drafting uses the
      // stricter evaluateOutreach gate in outreach.ts.)
      const html =
        `<p>${escapeHtml(p.item?.detail || "")}</p>` +
        `<hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>` +
        `<p style="font-size:12px;color:#888">Sent via competitor.inc on behalf of ${escapeHtml(p.company.name)}. ` +
        `You're receiving this because you opted in — reply STOP to unsubscribe.</p>`;
      return sendEmail(
        { to, subject: `[${p.company.name}] ${p.item?.title || "Outreach"}`, html },
        c?.resendApiKey || process.env.RESEND_API_KEY,
        c?.resendFrom || process.env.RESEND_FROM
      );
    }
    case "bluesky":
      return postToBluesky({ text: p.item?.detail || `${p.company.name}: ${p.company.idea}` });
    case "mastodon":
      return postToMastodon({ text: p.item?.detail || `${p.company.name}: ${p.company.idea}` });
    case "reddit":
      return postToReddit({ title: p.item?.title || p.company.name, text: p.item?.detail || `${p.company.name}: ${p.company.idea}` });
    case "spend": {
      // Gate 2, enforced BELOW the prompt (see spend-cap.ts): a hard outbound-spend ceiling in the executor,
      // independent of any agent proposal or owner approval. Default 0 ⇒ no real money can move.
      const cents = Math.max(0, Math.round((p.item?.amount ?? 50) * 100));
      if (overHardCap(cents)) {
        return { ok: false, error: `blocked by the hard spend cap: $${(cents / 100).toFixed(2)} > $${(hardSpendCapCents() / 100).toFixed(2)}. This ceiling is enforced in the executor (below the prompt); raise HARD_SPEND_CAP_CENTS to change it.` };
      }
      return placeAd(
        { objective: p.item?.title || "demand test", budget: p.item?.amount ?? 50, copy: p.item?.detail || p.company.idea },
        c?.adsWebhookUrl || process.env.ADS_WEBHOOK_URL,
        !!c?.adsWebhookUrl // user-supplied URL → enforce SSRF guard
      );
    }
    case "payments":
      return createPaymentLink();
    case "delete":
      return { ok: true, proof: { kind: "metric", value: "deletion acknowledged" } }; // destructive — no auto-API
    default:
      return { ok: false, error: "unknown action" };
  }
}
