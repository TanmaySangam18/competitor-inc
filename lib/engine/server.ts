import "server-only";

// Server-side engine. Runs the simulated provider by default; when a frontier model is
// configured (MODEL_PROVIDER=anthropic + ANTHROPIC_API_KEY), it asks the real model and
// normalizes the output into our types, falling back to simulated on any error. The API key
// never reaches the client because this module is server-only.

import { getProvider, scoreIdea, type ShiftResult } from "./provider";
import { governApprovals } from "./policy";
import type { Activity, ActivityStatus, AgentRole, ApprovalItem, ApprovalKind, ByokConfig, Company, ValidationResult } from "./types";
import { AGENTS } from "./types";

const PROVIDER = process.env.MODEL_PROVIDER ?? "simulated";
// Default model: Claude Sonnet 4.6 (the in-house agents run on it for now). Override per-deploy with
// MODEL_ID. Sonnet 4.6 takes our standard Messages call as-is (no thinking/sampling params).
const MODEL = process.env.MODEL_ID ?? "claude-sonnet-4-6";
const KEY = process.env.ANTHROPIC_API_KEY;
const GATEWAY_KEY = process.env.AI_GATEWAY_API_KEY;
// Self-hosted / any OpenAI-compatible endpoint set by the operator (trusted, not user-supplied).
const SELF_HOST_URL = process.env.MODEL_BASE_URL;
const SELF_HOST_KEY = process.env.MODEL_API_KEY;
const MODEL_TIMEOUT_MS = 30_000;
// For now every agent is on Sonnet 4.6. Set MODEL_CHEAP (e.g. claude-haiku-4-5) to split the
// lighter roles onto a cheaper/faster model later.
const MODEL_CHEAP = process.env.MODEL_CHEAP || "claude-sonnet-4-6";

// Per-agent model routing: the hard reasoners (Forge=engineering, Apex=ceo) get the strong model
// (MODEL_ID); other agents can run on a cheaper/faster one (MODEL_CHEAP). The managed
// engine honors this; BYOK always uses the user's own chosen model. Full per-agent task calls extend it.
const STRONG_ROLES: AgentRole[] = ["engineering", "ceo"];
export function modelForAgent(role: AgentRole): string {
  return STRONG_ROLES.includes(role) ? MODEL : MODEL_CHEAP;
}

// The model is a swappable commodity — never hardwired to one vendor. The managed (server-side)
// engine resolves from env to: Anthropic, the Vercel AI Gateway (any provider via "provider/model"),
// or any OpenAI-compatible / self-hosted endpoint. BYOK (below) adds a per-user override.
type Managed =
  | { kind: "anthropic"; key: string; model: string }
  | { kind: "openai"; baseUrl: string; key: string; model: string };

function managedModel(): Managed | null {
  if (PROVIDER === "anthropic" && KEY) return { kind: "anthropic", key: KEY, model: MODEL };
  if (PROVIDER === "gateway" && GATEWAY_KEY)
    return { kind: "openai", baseUrl: "https://ai-gateway.vercel.sh/v1", key: GATEWAY_KEY, model: MODEL };
  if ((PROVIDER === "openai-compatible" || PROVIDER === "private") && SELF_HOST_URL && SELF_HOST_KEY)
    return { kind: "openai", baseUrl: SELF_HOST_URL, key: SELF_HOST_KEY, model: MODEL };
  return null;
}

export function realModelConfigured(): boolean {
  return managedModel() !== null;
}

// Every upstream model call is bounded so a hung/slow provider can't wedge a request; on abort the
// caller catches and degrades to the simulated engine.
async function fetchWithTimeout(url: string, init: RequestInit, ms = MODEL_TIMEOUT_MS): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

const ROLES = Object.keys(AGENTS) as AgentRole[];
const APPROVAL_KINDS: ApprovalKind[] = ["spend", "outreach", "deploy", "delete", "twitter", "linkedin"];
const uid = () => crypto.randomUUID();
const num = (v: unknown, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const role = (v: unknown): AgentRole => (ROLES.includes(v as AgentRole) ? (v as AgentRole) : "engineering");

async function callAnthropic(system: string, user: string, key: string = KEY ?? "", model: string = MODEL, maxTokens = 1500): Promise<string> {
  const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
  }, maxTokens > 4000 ? 60_000 : MODEL_TIMEOUT_MS);
  if (!res.ok) throw new Error(`anthropic ${res.status}`);
  const data = await res.json();
  return data?.content?.[0]?.text ?? "";
}

// SSRF guard for the user-supplied BYOK base URL. Single source of truth lives in ./net and is
// re-exported here so existing importers (and tests) keep working unchanged.
export { assertSafeBaseUrl } from "./net";
import { assertSafeBaseUrl } from "./net";

// Any OpenAI-compatible endpoint: OpenAI, Groq, OpenRouter, Together, the Vercel AI Gateway, local
// servers, … `enforceSsrf` is true ONLY for user-supplied (BYOK) URLs; operator-set env URLs are
// trusted and may legitimately point at an internal/self-hosted host.
async function callOpenAICompat(baseUrl: string, key: string, model: string, system: string, user: string, enforceSsrf: boolean, maxTokens = 1500): Promise<string> {
  if (enforceSsrf) assertSafeBaseUrl(baseUrl);
  const res = await fetchWithTimeout(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
  }, maxTokens > 4000 ? 60_000 : MODEL_TIMEOUT_MS);
  if (!res.ok) throw new Error(`model ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

/* ── Real token-streaming ──────────────────────────────────────
   The non-streaming calls above resolve the whole reply, then the route fake-chunks it. The
   functions below stream the model's tokens as they're produced (true token-streaming) so chat
   feels live end-to-end. Each opens the connection and verifies the response BEFORE returning the
   generator, so a pre-stream failure throws and the caller degrades to the simulated engine. */

// Reads a Server-Sent-Events body, yielding each `data:` payload (without the prefix). Both
// Anthropic and OpenAI-compatible streaming use SSE; only the JSON shape inside differs.
async function* sseData(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n")) !== -1) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (line.startsWith("data:")) yield line.slice(5).trim();
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// Anthropic Messages streaming: text arrives in `content_block_delta` events (delta.text).
async function streamAnthropic(system: string, user: string, key: string, model: string): Promise<AsyncGenerator<string>> {
  const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: 1500, system, stream: true, messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok || !res.body) throw new Error(`anthropic ${res.status}`);
  return (async function* () {
    for await (const data of sseData(res.body!)) {
      if (data === "[DONE]") break;
      try {
        const obj = JSON.parse(data);
        if (obj?.type === "content_block_delta" && typeof obj.delta?.text === "string" && obj.delta.text)
          yield obj.delta.text as string;
      } catch { /* keepalive / non-JSON line — skip */ }
    }
  })();
}

// OpenAI-compatible streaming: text arrives in `choices[0].delta.content`, terminated by `[DONE]`.
async function streamOpenAICompat(baseUrl: string, key: string, model: string, system: string, user: string, enforceSsrf: boolean): Promise<AsyncGenerator<string>> {
  if (enforceSsrf) assertSafeBaseUrl(baseUrl);
  const res = await fetchWithTimeout(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, stream: true, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
  });
  if (!res.ok || !res.body) throw new Error(`model ${res.status}`);
  return (async function* () {
    for await (const data of sseData(res.body!)) {
      if (data === "[DONE]") break;
      try {
        const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta) yield delta;
      } catch { /* keepalive / non-JSON line — skip */ }
    }
  })();
}

// True when SOME model is reachable: the user's BYOK key, or a server-side env key.
function modelAvailable(byok?: ByokConfig): boolean {
  return !!byok?.apiKey || realModelConfigured();
}

// Routes to the user's BYOK provider first (their key, their bill — our marginal cost ~$0),
// then a server env model, else throws so callers fall back to the simulated engine.
async function callModel(system: string, user: string, byok?: ByokConfig, model?: string, maxTokens = 1500): Promise<string> {
  // 1) User's BYOK key (their bill — SSRF-guarded because the URL is user-supplied; user's model wins).
  if (byok?.apiKey && byok.provider === "openai-compatible" && byok.baseUrl) {
    return callOpenAICompat(byok.baseUrl, byok.apiKey, byok.model || "gpt-4o-mini", system, user, true, maxTokens);
  }
  if (byok?.apiKey && byok.provider === "anthropic") {
    return callAnthropic(system, user, byok.apiKey, byok.model || MODEL, maxTokens);
  }
  // 2) Managed (operator-configured) engine: per-agent `model` override → else the managed default.
  const managed = managedModel();
  if (managed?.kind === "anthropic") return callAnthropic(system, user, managed.key, model ?? managed.model, maxTokens);
  if (managed?.kind === "openai") return callOpenAICompat(managed.baseUrl, managed.key, model ?? managed.model, system, user, false, maxTokens);
  throw new Error("no model configured");
}

// Streaming twin of `callModel`: same BYOK-first → managed routing, but returns a generator of
// token deltas. Throws (before any token) when no model is configured so callers can fall back.
async function callModelStream(system: string, user: string, byok?: ByokConfig, model?: string): Promise<AsyncGenerator<string>> {
  if (byok?.apiKey && byok.provider === "openai-compatible" && byok.baseUrl) {
    return streamOpenAICompat(byok.baseUrl, byok.apiKey, byok.model || "gpt-4o-mini", system, user, true);
  }
  if (byok?.apiKey && byok.provider === "anthropic") {
    return streamAnthropic(system, user, byok.apiKey, byok.model || MODEL);
  }
  const managed = managedModel();
  if (managed?.kind === "anthropic") return streamAnthropic(system, user, managed.key, model ?? managed.model);
  if (managed?.kind === "openai") return streamOpenAICompat(managed.baseUrl, managed.key, model ?? managed.model, system, user, false);
  throw new Error("no model configured");
}

function extractJson<T>(text: string): T {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("no json in model output");
  return JSON.parse(match[0]) as T;
}

// Forge v2 (PDR §6 / agent-architecture-roadmap) — the model AUTHORS a small, real, multi-file static
// site for the idea (vs a fixed one-page template). Defensive on every axis so it can't ship junk:
// validates JSON, requires a real index.html, caps file count/size, blocks path traversal. Returns null
// on ANY problem so the caller falls back to the safe single-file template (verify-before-done). Static
// only — no build step, no external deps — so GitHub Pages serves it directly. Lights up with any model
// (Groq today); a Claude key makes it markedly better.
export async function generateSiteFiles(
  name: string,
  idea: string,
  byok?: ByokConfig,
): Promise<Record<string, string> | null> {
  if (!modelAvailable(byok)) return null;
  const system =
    "You are a senior front-end engineer. Output ONLY raw JSON, no markdown, no prose. Build a small, real, " +
    "static marketing site — no build step, no external JS/CDN deps, CSS linked or inline. It must look modern and be genuinely usable.";
  const user =
    `Company: ${name}\nWhat it does: ${idea}\n\n` +
    `Return JSON exactly like {"files":{"index.html":"<!doctype html>…","styles.css":"…"}}. ` +
    `Requirements: include index.html (required) that <link>s styles.css; a hero (name + what it does), 3 feature points, ` +
    `and an email capture form; clean responsive CSS; 2–4 files max; each file under 12000 characters; absolutely no external scripts or CDNs.`;
  try {
    const raw = await callModel(system, user, byok, undefined, 8000);
    const parsed = extractJson<{ files?: Record<string, unknown> }>(raw);
    const files = parsed?.files;
    if (!files || typeof files !== "object") return null;
    const out: Record<string, string> = {};
    let count = 0;
    for (const [path, content] of Object.entries(files)) {
      if (count >= 6) break;
      if (typeof path !== "string" || typeof content !== "string") continue;
      if (path.includes("..") || path.startsWith("/") || path.length > 80) continue; // no traversal/abs paths
      if (content.length < 1 || content.length > 14000) continue;
      out[path] = content;
      count++;
    }
    // Must be a genuine page, or we don't trust it — fall back.
    if (!out["index.html"] || !/<html|<!doctype/i.test(out["index.html"])) return null;
    return out;
  } catch {
    return null;
  }
}

export interface SiteAudit {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
}

// 2.8 import on-ramp (PDR §5) — audit an EXISTING product from its landing-page text. Gated on a model
// (null when off); defensive parse. Read-only/public — operating the project is gated on ownership.
export async function auditSite(title: string, text: string, byok?: ByokConfig): Promise<SiteAudit | null> {
  if (!modelAvailable(byok)) return null;
  const system =
    "You are a sharp startup operator auditing an EXISTING product from its landing page. Output ONLY raw JSON, no prose. Be specific to THIS product — no generic platitudes.";
  const user =
    `Title: ${title}\n\nLanding-page text:\n${text}\n\n` +
    `Return JSON {"summary":"1–2 sentences on what this is","strengths":["…"],"weaknesses":["…"],"opportunities":["a concrete growth move","…"]} — 2–4 specific items per list.`;
  try {
    const a = extractJson<Partial<SiteAudit>>(await callModel(system, user, byok, undefined, 1500));
    if (!a || typeof a.summary !== "string") return null;
    const arr = (x: unknown): string[] =>
      Array.isArray(x) ? x.filter((s): s is string => typeof s === "string" && s.trim().length > 0).slice(0, 5) : [];
    return { summary: a.summary.slice(0, 400), strengths: arr(a.strengths), weaknesses: arr(a.weaknesses), opportunities: arr(a.opportunities) };
  } catch {
    return null;
  }
}

export async function runValidate(idea: string, byok?: ByokConfig, salt?: string): Promise<ValidationResult> {
  const base = getProvider().validate(idea, salt); // realistic defaults + steps
  if (!modelAvailable(byok)) return base;
  const seed = salt ? idea + "::" + salt : idea;
  try {
    const text = await callModel(
      "You are competitor.inc's validation gate. Given a startup idea, estimate honest results of a small demand test. Be realistic and willing to be skeptical — estimate EVERY field from the specifics of this idea (don't return round/placeholder numbers)." +
        (salt ? " This is a RE-TEST — market conditions may have shifted since the last reading, so don't just echo it." : "") +
        ' Return ONLY JSON: {"waitlist":number (signups from a small landing-page test),"ctr":number (ad click-through %),"costPerSignup":number (dollars),"spend":number (test budget dollars),"conversion":number (landing→waitlist %),"clickThrough":number (fake-door button %),"searchVolume":number (monthly searches for this problem),"competition":"low"|"medium"|"high"}',
      idea,
      byok,
      modelForAgent("ceo")
    );
    const m = extractJson<{
      waitlist?: number; ctr?: number; costPerSignup?: number; spend?: number;
      conversion?: number; clickThrough?: number; searchVolume?: number; competition?: string;
    }>(text);
    const core = {
      waitlist: Math.round(num(m.waitlist, base.waitlist)),
      ctr: num(m.ctr, base.ctr),
      costPerSignup: num(m.costPerSignup, base.costPerSignup),
      spend: num(m.spend, base.spend),
    };
    // Every number is now the model's estimate for this idea; scoreIdea falls back to its RNG only
    // for any field the model omitted.
    const extras = {
      conversion: typeof m.conversion === "number" ? m.conversion : undefined,
      clickThrough: typeof m.clickThrough === "number" ? m.clickThrough : undefined,
      searchVolume: typeof m.searchVolume === "number" ? m.searchVolume : undefined,
      competition: (["low", "medium", "high"] as const).find((c) => c === m.competition),
    };
    return { steps: base.steps, ...core, ...scoreIdea(core, seed, extras) };
  } catch {
    return base; // graceful degradation
  }
}

function chatSystem(company: { name: string; idea: string }, soul?: string): string {
  return (
    `You are the AI co-founder running the company "${company.name}" (idea: ${company.idea}). ` +
    (soul ? soul + " " : "") +
    "Be concise, warm, and candid. If asked to do something consequential (spend, outreach, deploy), say you'll queue it for the user's approval."
  );
}

export async function runChat(
  company: { name: string; idea: string },
  message: string,
  soul?: string,
  byok?: ByokConfig
): Promise<string> {
  if (modelAvailable(byok)) {
    try {
      const text = await callModel(chatSystem(company, soul), message, byok, modelForAgent("ceo"));
      if (text.trim()) return text.trim();
    } catch {
      /* fall through */
    }
  }
  return simulatedReply(company, message);
}

// Real token-streaming for chat. Returns a generator that yields the model's tokens as they arrive,
// or `null` to signal the caller should fall back to the simulated (fake-streamed) reply. Null covers
// every degradation path: no model configured, the stream failing to open, OR an empty completion —
// we peek the first token so an empty real reply still degrades gracefully, exactly like runChat.
export async function streamChatReply(
  company: { name: string; idea: string },
  message: string,
  soul?: string,
  byok?: ByokConfig
): Promise<AsyncGenerator<string> | null> {
  if (!modelAvailable(byok)) return null;
  try {
    const gen = await callModelStream(chatSystem(company, soul), message, byok, modelForAgent("ceo"));
    const first = await gen.next();
    if (first.done || !first.value) return null; // empty completion → simulated fallback
    return (async function* () {
      yield first.value;
      yield* gen;
    })();
  } catch {
    return null;
  }
}

function simulatedReply(company: { name: string; idea: string }, message: string): string {
  const m = message.toLowerCase();
  if (/\b(hi|hey|hello)\b/.test(m)) return `Hey! I'm running ${company.name} with you. What should we tackle tonight?`;
  if (/valid|demand|worth|should i|market fit/.test(m))
    return `Before building more, I'd re-check demand. Want me to run another test for ${company.name}?`;
  if (/cost|spend|money|budget|burn/.test(m))
    return `Every action is in the Glass Box with its cost, and failed work is credited back to your allowance — you're never charged for work that didn't land. I won't spend above the cap without your sign-off.`;
  if (/ship|build|feature|deploy|code/.test(m))
    return `I can ship that. Deploys route through your Approval Inbox first — I'll prep it and wait for your yes.`;
  if (/market|\bad\b|ads|grow|launch|outreach|email/.test(m))
    return `I'll draft the campaign and a launch post. Outbound always waits for your approval before it goes out.`;
  if (/cut|kill|stop|pause/.test(m))
    return `Good instinct to question it. I'll run a reality-check on the numbers and recommend what to cut.`;
  return `Got it. For "${company.idea}" I'd line up the next highest-signal task and bring anything consequential to you to approve.`;
}

export interface ChatApproval {
  agent: AgentRole;
  kind: ApprovalKind;
  title: string;
  detail: string;
  amount?: number;
}

// Intent detection for chat. When the founder asks the co-founder to do something *consequential*
// (spend, outreach, deploy, delete), we queue a real ApprovalItem instead of only saying we will
// (Nielsen H2 — the system must do what it says). Deterministic, so the simulated and real-model
// paths behave identically; conservative-ish, keyed off action verbs.
export function detectChatApproval(message: string): ChatApproval | null {
  const m = message.toLowerCase();
  const quote = message.trim().slice(0, 140);
  // spend — also triggers on an explicit dollar amount
  if (/\b(spend|buy|pay|purchase|budget|fund|invest|ad spend)\b/.test(m) || /\$\s?\d/.test(m)) {
    const match = m.match(/\$\s?(\d[\d,]*)(?:\.(\d+))?/);
    const amount = match
      ? Math.round((Number(match[1].replace(/,/g, "")) + (match[2] ? Number("0." + match[2]) : 0)) * 100) / 100
      : 50;
    return { agent: "marketing", kind: "spend", title: "Approve spend", detail: `You asked: “${quote}”`, amount };
  }
  if (/\b(deploy|ship|release|go live|push (to )?prod|publish the (site|app))\b/.test(m)) {
    return { agent: "engineering", kind: "deploy", title: "Approve deploy", detail: `You asked: “${quote}”` };
  }
  // Outreach + marketing: "market it / run a campaign / promote it" is consequential too (implies
  // public posting or spend), so it queues. Scoped to skip benign mentions like "market fit".
  if (/\b(email|e-mail|reach out|outreach|dm|message|contact|tweet|post|announce|launch post|marketing|market (?:it|us|this|the|competitor)|campaign|promote|advertis|run (?:an )?ads?|go to market)\b/.test(m)) {
    return { agent: "growth", kind: "outreach", title: "Approve outreach", detail: `You asked: “${quote}”` };
  }
  if (/\b(delete|remove|tear down|shut ?down|cancel|wipe|purge)\b/.test(m)) {
    return { agent: "ceo", kind: "delete", title: "Approve deletion", detail: `You asked: “${quote}”` };
  }
  return null;
}

interface ModelShift {
  activities?: Array<{ agent?: string; action?: string; cost?: number; meta?: string; status?: string; proof?: { kind?: string; value?: string } }>;
  approvals?: Array<{ agent?: string; kind?: string; title?: string; detail?: string; amount?: number }>;
}

// Every shift's PROPOSED approvals pass through the policy engine before anyone sees them — the
// autonomous loop can't even propose what the policy forbids (Operating Policy §1).
function governShift(s: ShiftResult): ShiftResult {
  return { ...s, approvals: governApprovals(s.approvals) };
}

export async function runShift(company: Company, byok?: ByokConfig, context?: string): Promise<ShiftResult> {
  if (!modelAvailable(byok)) return governShift(getProvider().shift(company));
  const night = company.night + 1;
  const isImported = company.product?.status === "live";
  const distributionConstraint = isImported
    ? " CRITICAL: this product is ALREADY BUILT AND LIVE. The crew's ONLY job is getting it customers. DO NOT propose engineering or build activities. Focus exclusively on: outreach drafts, positioning, programmatic SEO, community posts, and referral mechanics."
    : "";
  try {
    const text = await callModel(
      `You are competitor.inc's overnight autonomous engine for the startup "${company.name}". Agents: ${ROLES.join(", ")}.${distributionConstraint} ` +
        "Produce 3-5 realistic actions taken overnight. Build on priorContext (what earlier nights did) — stay consistent; don't repeat or contradict past decisions. " +
        "Consequential actions (spend>$100, outreach, deploy, delete, twitter posts, linkedin posts) must go in 'approvals' (NOT auto-done). Return ONLY JSON: " +
        '{"activities":[{"agent":string,"action":string,"cost":number,"meta":string,"status":"done"|"failed-credited","proof":{"kind":"url"|"build"|"metric","value":string}}],"approvals":[{"agent":string,"kind":"spend"|"outreach"|"deploy"|"delete"|"twitter"|"linkedin","title":string,"detail":string,"amount":number}]}',
      JSON.stringify({ idea: company.idea, night, priorContext: context || "(none yet)" }),
      byok,
      modelForAgent("engineering")
    );
    const m = extractJson<ModelShift>(text);
    if (!Array.isArray(m.activities) || !Array.isArray(m.approvals)) throw new Error("bad shape");

    const activities: Activity[] = m.activities.slice(0, 6).map((a) => {
      const status: ActivityStatus = a.status === "failed-credited" ? "failed-credited" : "done";
      const proof =
        a.proof && (a.proof.kind === "url" || a.proof.kind === "build" || a.proof.kind === "metric")
          ? { kind: a.proof.kind as "url" | "build" | "metric", value: str(a.proof.value) }
          : undefined;
      return { id: uid(), night, agent: role(a.agent), action: str(a.action, "Did some work"), meta: str(a.meta) || undefined, cost: Math.max(0, num(a.cost)), status, proof };
    });
    const approvals: ApprovalItem[] = m.approvals.slice(0, 4).map((p) => ({
      id: uid(),
      night,
      agent: role(p.agent),
      kind: (APPROVAL_KINDS.includes(p.kind as ApprovalKind) ? p.kind : "spend") as ApprovalKind,
      title: str(p.title, "Needs your approval"),
      detail: str(p.detail),
      amount: p.amount != null ? Math.max(0, num(p.amount)) : undefined,
    }));
    if (activities.length === 0 && approvals.length === 0) throw new Error("empty");
    return governShift({ activities, approvals });
  } catch {
    return governShift(getProvider().shift(company)); // graceful degradation
  }
}
