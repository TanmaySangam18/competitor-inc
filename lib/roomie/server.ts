import "server-only";

// Server-side engine. Runs the simulated provider by default; when a frontier model is
// configured (ROOMIE_PROVIDER=anthropic + ANTHROPIC_API_KEY), it asks the real model and
// normalizes the output into our types, falling back to simulated on any error. The API key
// never reaches the client because this module is server-only.

import { getProvider, scoreIdea, type ShiftResult } from "./provider";
import type { Activity, ActivityStatus, AgentRole, ApprovalItem, ApprovalKind, ByokConfig, Company, ValidationResult } from "./types";
import { AGENTS } from "./types";

const PROVIDER = process.env.ROOMIE_PROVIDER ?? "simulated";
const MODEL = process.env.ROOMIE_MODEL ?? "claude-opus-4-8";
const KEY = process.env.ANTHROPIC_API_KEY;
const GATEWAY_KEY = process.env.AI_GATEWAY_API_KEY;
// Self-hosted / any OpenAI-compatible endpoint set by the operator (trusted, not user-supplied).
const SELF_HOST_URL = process.env.ROOMIE_PRIVATE_BASE_URL;
const SELF_HOST_KEY = process.env.ROOMIE_API_KEY;
const MODEL_TIMEOUT_MS = 30_000;

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
const APPROVAL_KINDS: ApprovalKind[] = ["spend", "outreach", "deploy", "delete"];
const uid = () => crypto.randomUUID();
const num = (v: unknown, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const role = (v: unknown): AgentRole => (ROLES.includes(v as AgentRole) ? (v as AgentRole) : "engineering");

async function callAnthropic(system: string, user: string, key: string = KEY ?? "", model: string = MODEL): Promise<string> {
  const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: 1500, system, messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}`);
  const data = await res.json();
  return data?.content?.[0]?.text ?? "";
}

// SSRF guard: the user-supplied baseUrl receives their API key as a Bearer token and is fetched
// server-side, so a malicious/typo'd URL could turn our server into a proxy to internal hosts
// (e.g. cloud metadata at 169.254.169.254). Require https + reject private/loopback/link-local.
export function assertSafeBaseUrl(raw: string): void {
  let u: URL;
  try { u = new URL(raw); } catch { throw new Error("invalid baseUrl"); }
  if (u.protocol !== "https:") throw new Error("baseUrl must be https");
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host === "metadata.google.internal") throw new Error("blocked host");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const [a, b] = host.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168))
      throw new Error("blocked private IP");
  }
  // IPv6: loopback (::1), unspecified (::), unique-local (fc00::/7 → fc/fd), link-local (fe80::/10 →
  // fe8–feb), and ANY IPv4-mapped form (::ffff:… — the URL parser serializes it as hex or dotted, and
  // it can smuggle a private/metadata IPv4 such as 169.254.169.254). Public model APIs use hostnames.
  if (host === "::1" || host === "::" || host.startsWith("::ffff:") || /^f[cd]/.test(host) || /^fe[89ab]/.test(host))
    throw new Error("blocked IPv6 host");
}

// Any OpenAI-compatible endpoint: OpenAI, Groq, OpenRouter, Together, the Vercel AI Gateway, local
// servers, … `enforceSsrf` is true ONLY for user-supplied (BYOK) URLs; operator-set env URLs are
// trusted and may legitimately point at an internal/self-hosted host.
async function callOpenAICompat(baseUrl: string, key: string, model: string, system: string, user: string, enforceSsrf: boolean): Promise<string> {
  if (enforceSsrf) assertSafeBaseUrl(baseUrl);
  const res = await fetchWithTimeout(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
  });
  if (!res.ok) throw new Error(`model ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

// True when SOME model is reachable: the user's BYOK key, or a server-side env key.
function modelAvailable(byok?: ByokConfig): boolean {
  return !!byok?.apiKey || realModelConfigured();
}

// Routes to the user's BYOK provider first (their key, their bill — our marginal cost ~$0),
// then a server env model, else throws so callers fall back to the simulated engine.
async function callModel(system: string, user: string, byok?: ByokConfig): Promise<string> {
  // 1) User's BYOK key (their bill — SSRF-guarded because the URL is user-supplied).
  if (byok?.apiKey && byok.provider === "openai-compatible" && byok.baseUrl) {
    return callOpenAICompat(byok.baseUrl, byok.apiKey, byok.model || "gpt-4o-mini", system, user, true);
  }
  if (byok?.apiKey && byok.provider === "anthropic") {
    return callAnthropic(system, user, byok.apiKey, byok.model || MODEL);
  }
  // 2) Managed (operator-configured) engine: Anthropic, Gateway, or any OpenAI-compatible host.
  const managed = managedModel();
  if (managed?.kind === "anthropic") return callAnthropic(system, user, managed.key, managed.model);
  if (managed?.kind === "openai") return callOpenAICompat(managed.baseUrl, managed.key, managed.model, system, user, false);
  throw new Error("no model configured");
}

function extractJson<T>(text: string): T {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("no json in model output");
  return JSON.parse(match[0]) as T;
}

export async function runValidate(idea: string, byok?: ByokConfig): Promise<ValidationResult> {
  const base = getProvider().validate(idea); // realistic defaults + steps
  if (!modelAvailable(byok)) return base;
  try {
    const text = await callModel(
      "You are competitor.inc's validation gate. Given a startup idea, estimate honest results of a small real demand test. Be realistic and willing to be skeptical. Return ONLY JSON: " +
        '{"waitlist":number,"ctr":number,"costPerSignup":number,"spend":number}',
      idea,
      byok
    );
    const m = extractJson<{ waitlist?: number; ctr?: number; costPerSignup?: number; spend?: number }>(text);
    const core = {
      waitlist: Math.round(num(m.waitlist, base.waitlist)),
      ctr: num(m.ctr, base.ctr),
      costPerSignup: num(m.costPerSignup, base.costPerSignup),
      spend: num(m.spend, base.spend),
    };
    // derive experiments/confidence/verdict deterministically from the model's core estimates
    return { steps: base.steps, ...core, ...scoreIdea(core, idea) };
  } catch {
    return base; // graceful degradation
  }
}

export async function runChat(
  company: { name: string; idea: string },
  message: string,
  soul?: string,
  byok?: ByokConfig
): Promise<string> {
  if (modelAvailable(byok)) {
    try {
      const sys =
        `You are the AI co-founder running the company "${company.name}" (idea: ${company.idea}). ` +
        (soul ? soul + " " : "") +
        "Be concise, warm, and candid. If asked to do something consequential (spend, outreach, deploy), say you'll queue it for the user's approval.";
      const text = await callModel(sys, message, byok);
      if (text.trim()) return text.trim();
    } catch {
      /* fall through */
    }
  }
  return simulatedReply(company, message);
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
  if (/\b(email|e-mail|reach out|outreach|dm|message|contact|tweet|post|announce|launch post)\b/.test(m)) {
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

export async function runShift(company: Company, byok?: ByokConfig): Promise<ShiftResult> {
  if (!modelAvailable(byok)) return getProvider().shift(company);
  const night = company.night + 1;
  try {
    const text = await callModel(
      `You are competitor.inc's overnight autonomous engine for the startup "${company.name}". Agents: ${ROLES.join(", ")}. ` +
        "Produce 3-5 realistic actions taken overnight. Consequential actions (spend>$100, outreach, deploy, delete) must go in 'approvals' (NOT auto-done). Return ONLY JSON: " +
        '{"activities":[{"agent":string,"action":string,"cost":number,"meta":string,"status":"done"|"failed-credited","proof":{"kind":"url"|"build"|"metric","value":string}}],"approvals":[{"agent":string,"kind":"spend"|"outreach"|"deploy"|"delete","title":string,"detail":string,"amount":number}]}',
      JSON.stringify({ idea: company.idea, night }),
      byok
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
    return { activities, approvals };
  } catch {
    return getProvider().shift(company); // graceful degradation
  }
}
