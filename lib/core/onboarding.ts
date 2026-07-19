// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING CO-PILOT — the brain of the "set it all up for me" flow (ADR-0017, founder goal 2026-07-19).
//
// Founder's target: the company sets ITSELF up — the user taps "OK" a handful of times, the agent does
// everything in between and reports each step to Slack. This module is the CO-PILOT'S PLAN: per service,
// the exact ordered steps, each tagged AGENT (the co-pilot navigates / pre-fills / detects / connects) or
// HUMAN (an irreducible click the agent MUST NOT do). The five human hard-stops are bright lines, chosen
// to protect the customer, not to add friction:
//   account-create · accept-terms · authenticate(password) · captcha · grant-consent · pay
// Everything else — deep-linking to the exact page, pre-filling names/scopes/redirect URLs, detecting when
// a key lands, running OAuth — is the agent's job. Rationale in ADR-0017; each hard-stop's WHY is inline.
//
// Pure + deterministic (no I/O): the plan is data the browser-side co-pilot executes and the office reports.
// ─────────────────────────────────────────────────────────────────────────────

import { CONNECTION_MAP, type Connection } from "@/lib/core/connections";
import { oauthProviderFor } from "@/lib/core/oauth";

export type StepActor = "agent" | "human";
// The only reasons a step is HUMAN. Each is a legal act, a secret, or a bot-detection gate the agent
// must never cross — crossing them transfers liability to software or gets the customer's account banned.
export type HardStop = "account-create" | "accept-terms" | "authenticate" | "captcha" | "grant-consent" | "pay";

export interface OnboardingStep {
  actor: StepActor;
  label: string; // shown to the user + posted to Slack
  url?: string; // the exact page the agent deep-links to (agent steps) or the human should be on
  prefill?: string[]; // non-secret values the agent fills (names, scopes, redirect URLs) — NEVER secrets
  detect?: string; // how completion is verified (drives auto-advance) — e.g. the env var that appears
  hardStop?: HardStop; // present iff actor === "human"; the WHY the agent stops here
}

export interface SetupRecipe {
  connectionId: string;
  name: string;
  oauth: boolean; // true when the whole thing collapses to one OAuth authorize click (hands-free path)
  steps: OnboardingStep[];
}

const human = (label: string, hardStop: HardStop, url?: string): OnboardingStep => ({ actor: "human", label, hardStop, url });
const agent = (label: string, o: Partial<OnboardingStep> = {}): OnboardingStep => ({ actor: "agent", label, ...o });

// Recipes for the services with a knowable setup path. Absent id ⇒ generic "open the provider + paste the
// key" fallback (see recipeFor). URLs are the real create-key pages; scopes match what the platform needs.
export const SETUP_RECIPES: SetupRecipe[] = [
  {
    connectionId: "github", name: "GitHub", oauth: true,
    steps: [
      human("Sign in to GitHub (or create a free account)", "account-create", "https://github.com/login"),
      agent("Open the token page with the right scopes pre-filled", { url: "https://github.com/settings/tokens/new", prefill: ["name: competitor.inc", "scopes: repo, workflow"] }),
      human("Click Generate token", "authenticate", "https://github.com/settings/tokens/new"),
      agent("Detect + store the token, verify the connection", { detect: "GITHUB_TOKEN" }),
    ],
  },
  {
    connectionId: "ai-model", name: "AI model key", oauth: false,
    steps: [
      human("Sign in to your model provider (Groq is free, no card)", "account-create", "https://console.groq.com"),
      agent("Open the API-keys page", { url: "https://console.groq.com/keys", prefill: ["name: competitor.inc"] }),
      human("Click Create key", "authenticate", "https://console.groq.com/keys"),
      agent("Detect + store the key, verify cognition is live", { detect: "GROQ_API_KEY | ANTHROPIC_API_KEY | OPENAI_API_KEY" }),
    ],
  },
  {
    connectionId: "hosting", name: "Vercel", oauth: true,
    steps: [
      human("Sign in to Vercel (free hobby tier)", "account-create", "https://vercel.com/login"),
      agent("Open the account tokens page", { url: "https://vercel.com/account/tokens", prefill: ["name: competitor.inc", "scope: full account", "expiry: no expiration"] }),
      human("Click Create Token", "authenticate", "https://vercel.com/account/tokens"),
      agent("Detect + store the token", { detect: "FULLSTACK_VERCEL_TOKEN" }),
    ],
  },
  {
    connectionId: "database", name: "Supabase", oauth: false,
    steps: [
      human("Sign in to Supabase + create a project", "account-create", "https://supabase.com/dashboard"),
      agent("Open the project API settings", { url: "https://supabase.com/dashboard/project/_/settings/api", prefill: ["copy: Project URL", "copy: service_role key"] }),
      human("Reveal the service_role key", "authenticate"),
      agent("Detect + store URL + key, verify the DB", { detect: "NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY" }),
    ],
  },
  {
    connectionId: "slack", name: "Slack", oauth: true,
    steps: [
      human("Sign in to the Slack workspace to connect", "account-create", "https://slack.com/signin"),
      agent("Start the OAuth authorize flow with the right scopes", { url: "/api/oauth/slack/start", prefill: ["scopes: chat:write, channels:read, channels:manage, users:read"] }),
      human("Click Authorize on Slack's page", "grant-consent"),
      agent("Receive + store the token, post the first office message", { detect: "user_connections(slack)" }),
    ],
  },
  {
    connectionId: "payments", name: "Stripe", oauth: true,
    steps: [
      human("Sign in to Stripe (or start onboarding)", "account-create", "https://dashboard.stripe.com/login"),
      agent("Begin Stripe Connect onboarding", { url: "/api/oauth/stripe/start" }),
      human("Complete Stripe identity + BANK details", "pay", "https://dashboard.stripe.com"),
      agent("Receive the connected-account id, verify payouts route to YOU", { detect: "user_connections(stripe)" }),
    ],
  },
];

export function recipeFor(conn: Connection): SetupRecipe {
  const r = SETUP_RECIPES.find((x) => x.connectionId === conn.id);
  if (r) return r;
  // Generic honest fallback: open the provider, human creates the key, agent detects it.
  return {
    connectionId: conn.id, name: conn.name, oauth: Boolean(oauthProviderFor(conn.id)),
    steps: [
      human(`Sign in to ${conn.name}`, "account-create"),
      agent(`Guide to the ${conn.name} key/settings page and pre-fill what's safe`),
      human(`Create the key / grant access in ${conn.name}`, "authenticate"),
      agent(`Detect + store, verify the connection`, { detect: conn.env.join(" | ") || "manual" }),
    ],
  };
}

export interface OnboardingPlan {
  total: number;
  remaining: number;
  agentSteps: number; // how much the co-pilot does hands-free
  humanStops: number; // how few taps the human owes
  services: Array<{ connectionId: string; name: string; done: boolean; steps: OnboardingStep[] }>;
}

/**
 * Build the co-pilot's ordered plan across the connection map. `configured` = the ids already connected
 * (from connectionMapStatus) — those services are marked done and their steps skipped. Ordered by tier so
 * T0 (the brain + hands) comes first. Deterministic.
 */
export function onboardingPlan(configuredIds: ReadonlySet<string>): OnboardingPlan {
  const services = CONNECTION_MAP
    .filter((c) => c.owner === "customer")
    .map((c) => ({ connectionId: c.id, name: c.name, done: configuredIds.has(c.id), steps: recipeFor(c).steps }));
  const pending = services.filter((s) => !s.done);
  const allSteps = pending.flatMap((s) => s.steps);
  return {
    total: services.length,
    remaining: pending.length,
    agentSteps: allSteps.filter((s) => s.actor === "agent").length,
    humanStops: allSteps.filter((s) => s.actor === "human").length,
    services,
  };
}

/** A one-line Slack update the assigned employee posts as it works a step (office.postToDept). */
export function stepReport(serviceName: string, step: OnboardingStep): string {
  if (step.actor === "human") return `⏸ ${serviceName}: waiting on you — ${step.label} (I can't do this one: ${step.hardStop}).`;
  const extra = step.prefill?.length ? ` [pre-filled: ${step.prefill.join("; ")}]` : step.detect ? ` [will verify: ${step.detect}]` : "";
  return `▷ ${serviceName}: ${step.label}${extra}`;
}
