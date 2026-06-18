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

export function realModelConfigured(): boolean {
  return PROVIDER === "anthropic" && !!KEY;
}

const ROLES = Object.keys(AGENTS) as AgentRole[];
const APPROVAL_KINDS: ApprovalKind[] = ["spend", "outreach", "deploy", "delete"];
const uid = () => crypto.randomUUID();
const num = (v: unknown, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const role = (v: unknown): AgentRole => (ROLES.includes(v as AgentRole) ? (v as AgentRole) : "engineering");

async function callAnthropic(system: string, user: string, key: string = KEY ?? "", model: string = MODEL): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
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
function assertSafeBaseUrl(raw: string): void {
  let u: URL;
  try { u = new URL(raw); } catch { throw new Error("invalid baseUrl"); }
  if (u.protocol !== "https:") throw new Error("baseUrl must be https");
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host === "metadata.google.internal") throw new Error("blocked host");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const [a, b] = host.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168))
      throw new Error("blocked private IP");
  }
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) throw new Error("blocked IPv6 host");
}

// Any OpenAI-compatible endpoint: OpenAI, Groq, OpenRouter, Together, local servers, …
async function callOpenAICompat(baseUrl: string, key: string, model: string, system: string, user: string): Promise<string> {
  assertSafeBaseUrl(baseUrl);
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
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
  if (byok?.apiKey && byok.provider === "openai-compatible" && byok.baseUrl) {
    return callOpenAICompat(byok.baseUrl, byok.apiKey, byok.model || "gpt-4o-mini", system, user);
  }
  if (byok?.apiKey && byok.provider === "anthropic") {
    return callAnthropic(system, user, byok.apiKey, byok.model || MODEL);
  }
  if (realModelConfigured()) return callAnthropic(system, user);
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
    return `Every action is in the Glass Box with its cost, and failed tasks auto-refund. I won't spend above the cap without your sign-off.`;
  if (/ship|build|feature|deploy|code/.test(m))
    return `I can ship that. Deploys route through your Approval Inbox first — I'll prep it and wait for your yes.`;
  if (/market|\bad\b|ads|grow|launch|outreach|email/.test(m))
    return `I'll draft the campaign and a launch post. Outbound always waits for your approval before it goes out.`;
  if (/cut|kill|stop|pause/.test(m))
    return `Good instinct to question it. I'll run a reality-check on the numbers and recommend what to cut.`;
  return `Got it. For "${company.idea}" I'd line up the next highest-signal task and bring anything consequential to you to approve.`;
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
        '{"activities":[{"agent":string,"action":string,"cost":number,"meta":string,"status":"done"|"failed-refunded","proof":{"kind":"url"|"build"|"metric","value":string}}],"approvals":[{"agent":string,"kind":"spend"|"outreach"|"deploy"|"delete","title":string,"detail":string,"amount":number}]}',
      JSON.stringify({ idea: company.idea, night }),
      byok
    );
    const m = extractJson<ModelShift>(text);
    if (!Array.isArray(m.activities) || !Array.isArray(m.approvals)) throw new Error("bad shape");

    const activities: Activity[] = m.activities.slice(0, 6).map((a) => {
      const status: ActivityStatus = a.status === "failed-refunded" ? "failed-refunded" : "done";
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
