// lib/core/connections.ts — THE CONNECTION MAP (docs/CONNECT-FIRST-RESET.md §1) + the founder go-live switch.
//
// Two sets, one registry (ADR-0004):
//
// 1. CONNECTION_MAP — the 17 services every software company runs on, tiered by WHEN the company
//    actually needs them (T0 day one → T3 as it grows). Each is BYOK: the customer's account, the
//    customer's ownership, the customer's spend. Company #0 (competitor.inc itself) is customer zero
//    of the same map — ONE engine, TWO tenants. The org runs degraded-but-honest with any subset:
//    every entry declares `unlocks` (what connecting enables) and `degraded` (the honest line shown
//    while absent) so no surface ever has to invent a claim.
//
// 2. FOUNDER_GO_LIVE — competitor.inc's own switch (answers "what do I flip when I go live?"):
//    the legal/control items (entity+bank, lawyer, kill switch, MAINTENANCE) that a customer never
//    sees. Some env vars are shared with the map (model keys, Stripe) — same detection, same truth.
//
// Detection is ENV-BASED and honest: `configured` is true only when a declared env var is actually
// present in this deployment. Items with no env detection (bank accounts, lawyers, registrars we
// don't consume programmatically yet) are TRACKED, NOT DETECTED — configured:false + a note, never
// faked. Per-customer key vaults come in a later block; env-of-this-deployment is the truth today.

import type { AgentRole } from "@/lib/core/types";

export type Owner = "founder" | "customer";
export type ConnectionTier = "T0" | "T1" | "T2" | "T3";

export interface Connection {
  id: string;
  name: string;
  tier: ConnectionTier; // when the company needs it (T0 day one … T3 as it grows)
  department: AgentRole; // which department consumes it ("ceo" = org-wide)
  owner: Owner;
  purpose: string;
  env: string[]; // env var(s) that indicate it's wired ([] = manual/legal, tracked not detected)
  /**
   * How `env` is READ, when a bare any-of would lie.
   *
   * Detection was `env.some(present)` for every entry, which is right for a list of alternatives (any
   * model provider will do) and wrong for a list of halves. Production had SUPABASE_SERVICE_ROLE_KEY and
   * no public URL, so /connect reported the database CONNECTED while the browser had no client config and
   * nobody could sign in. A false positive on the page whose entire job is to be honest.
   *
   * Each inner array is a COMPLETE way to satisfy this connection: configured when ANY group has ALL of
   * its members present. Absent, every env var is its own group, which is the old any-of behaviour.
   */
  envGroups?: string[][];
  unlocks: string; // what the org can do once connected (shown when configured)
  degraded: string; // the honest line shown while absent — the org still runs, minus this
  /**
   * Required to START, not required to be useful. Exactly ONE customer connection is required (the model
   * key), because that is the only thing the org cannot run without. Everything else gates a named
   * capability in lib/core/capabilities.ts rather than blocking the front door. See A1 in
   * docs/NAIVE-GAP-LIST.md for why this used to be four and what the category error was.
   */
  required: boolean;
}

export const TIER_LABELS: Record<ConnectionTier, { title: string; when: string }> = {
  T0: { title: "The brain + hands", when: "day one; only the model key is required" },
  T1: { title: "The voice", when: "first week" },
  T2: { title: "The money", when: "before the first sale" },
  T3: { title: "The senses", when: "as the business grows" },
};

export const TIER_ORDER: ConnectionTier[] = ["T0", "T1", "T2", "T3"];

// ── THE 17-SERVICE CONNECTION MAP (CONNECT-FIRST-RESET.md §1, verbatim scope) ──
export const CONNECTION_MAP: Connection[] = [
  // T0 · The brain + hands (day one, required)
  {
    id: "ai-model", name: "AI model key", tier: "T0", department: "ceo", owner: "customer",
    purpose: "Cognition, Anthropic / OpenAI / Groq; the model the org thinks with",
    env: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GROQ_API_KEY", "MODEL_API_KEY"],
    unlocks: "Agents can think: plan, write code, draft copy, answer customers.",
    degraded: "No cognition. The org is inert. Nothing runs until a model key exists.",
    required: true,
  },
  {
    id: "github", name: "GitHub", tier: "T0", department: "engineering", owner: "customer",
    purpose: "Repos + Actions, where software gets built",
    env: ["GITHUB_TOKEN"],
    unlocks: "The org can create repos, commit code, open PRs, and run CI.",
    degraded: "No hands on code. Builds are planned but nothing is committed or shipped.",
    required: false, // gates the "commit" capability, not startup (A1)
  
  },
  {
    id: "hosting", name: "Vercel (or Cloudflare Pages)", tier: "T0", department: "engineering", owner: "customer",
    purpose: "Where the software runs",
    env: ["FULLSTACK_VERCEL_TOKEN", "VERCEL_DEPLOY_HOOK_URL"],
    unlocks: "Ship to a real URL. Deploy, preview, verify, roll back.",
    degraded: "Builds stop at the repo. Nothing reaches a live URL.",
    required: false, // gates the "deploy" capability, not startup (A1)
  
  },
  {
    id: "database", name: "Database (Supabase / Neon)", tier: "T0", department: "engineering", owner: "customer",
    purpose: "Per-product data, RLS isolation",
    env: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    // ALL THREE or nothing. The browser client reads NEXT_PUBLIC_SUPABASE_URL and
    // NEXT_PUBLIC_SUPABASE_ANON_KEY (lib/supabase/client.ts); the server reads the service key. The anon
    // key was missing from this list, which meant detection could still say CONNECTED while sign-in was
    // impossible: the same false positive one layer down.
    //
    // Both NEXT_PUBLIC_ vars must be NON-SENSITIVE in Vercel. A var marked Sensitive is not inlined into
    // the client bundle, so it is present on the server, absent in the browser, and the deployment looks
    // configured while nobody can log in. That is exactly how this shipped.
    envGroups: [["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]],
    unlocks: "Products can persist data; every tenant isolated by RLS.",
    degraded: "Stateless only. Nothing that needs stored data can ship.",
    required: false, // gates the "persist" capability, not startup (A1)
  
  },

  {
    id: "object-storage", name: "Object storage (Supabase Storage / S3 / R2)", tier: "T0", department: "engineering", owner: "customer",
    purpose: "Files: uploads, images, documents, exports",
    env: ["STORAGE_BUCKET_URL", "STORAGE_ACCESS_KEY_ID", "S3_BUCKET", "R2_ACCOUNT_ID"],
    envGroups: [["STORAGE_BUCKET_URL", "STORAGE_ACCESS_KEY_ID"], ["S3_BUCKET"], ["R2_ACCOUNT_ID"]],
    unlocks: "Products can accept uploads and hand back generated files, through signed URLs.",
    degraded: "No file handling. Anything that takes an upload or returns a document cannot ship.",
    required: false, // gates the "store" capability, not startup (A4)
  },

  // T1 · The voice (first week — the company becomes conversational)
  {
    id: "slack", name: "Slack workspace", tier: "T1", department: "ops", owner: "customer",
    purpose: "The OFFICE: agents deliberate in channels 24/7; you're @-tagged only on real decisions",
    env: ["SLACK_BOT_TOKEN", "SLACK_SIGNING_SECRET"],
    envGroups: [["SLACK_BOT_TOKEN", "SLACK_SIGNING_SECRET"]], // post with the token, verify inbound with the secret
    unlocks: "The org talks where you already live; decisions reach you as @-mentions.",
    degraded: "No office in Slack. Deliberation stays on the web surface only.",
    required: false,
  },
  {
    id: "email-sending", name: "Email sending", tier: "T1", department: "support", owner: "customer",
    purpose: "Google Workspace or Resend/Postmark, support@, reports, receipts",
    env: ["RESEND_API_KEY", "RESEND_FROM"],
    envGroups: [["RESEND_API_KEY", "RESEND_FROM"]], // a key with no from-address cannot send
    unlocks: "The org can send: receipts, reports, and support replies from your domain.",
    degraded: "Mute by mail. Receipts and reports render but cannot be sent.",
    required: false,
  },
  {
    id: "agent-inbox", name: "Agent inboxes (AgentMail)", tier: "T1", department: "support", owner: "customer",
    purpose: "Two-way email: each agent gets its own inbox (send AND receive) via API",
    env: ["AGENTMAIL_API_KEY"],
    unlocks: "Support, sales, and finance agents read inbound mail and reply in-thread. The company's voice becomes two-way, not send-only.",
    degraded: "Send-only. The org can email out (via Email sending) but can't receive or reply; inbound goes unread until connected.",
    required: false,
  },
  {
    id: "registrar", name: "Domain registrar", tier: "T1", department: "ops", owner: "customer",
    purpose: "Cloudflare / Namecheap / Vercel Domains, legal domains only (standing rule)",
    env: [], // no programmatic registrar consumption yet — tracked, not detected
    unlocks: "Products get real custom domains, provisioned legally.",
    degraded: "Products ship on subdomains only. No custom domains.",
    required: false,
  },

  // T2 · The money (before the first sale)
  {
    id: "payments", name: "Stripe (or Polar as MoR)", tier: "T2", department: "finance", owner: "customer",
    purpose: "Charging customers",
    // NEXT_PUBLIC_CHECKOUT_URL is the R1 arming switch: billing.ts only enforces the paywall once the
    // operator checkout link exists, so /connect must show it as part of the true remaining setup.
    env: ["STRIPE_SECRET_KEY", "POLAR_WEBHOOK_SECRET", "NEXT_PUBLIC_CHECKOUT_URL"],
    unlocks: "The company can take money. Checkout, subscriptions, webhooks.",
    degraded: "Everything runs except revenue. No charge can be made.",
    required: false,
  },
  {
    id: "banking", name: "Banking / accounting readout", tier: "T2", department: "finance", owner: "customer",
    purpose: "Mercury / QuickBooks / Stripe Tax, finance agents' ground truth; READ + report, never move funds",
    env: [], // read-only readout not wired programmatically yet — tracked, not detected
    unlocks: "Finance reports reconcile against the real account (read-only; moving funds stays human-only).",
    degraded: "Finance reports draw on Stripe data alone. No bank-level ground truth.",
    required: false,
  },

  // T3 · The senses (as the business grows)
  {
    id: "analytics", name: "Analytics", tier: "T3", department: "growth", owner: "customer",
    purpose: "Our first-party pixel (built in) + optional GA4/PostHog",
    env: ["TRACK_SALT", "MCP_ANALYTICS_URL"],
    unlocks: "The growth loop reads the real funnel end to end, deduped and salted.",
    degraded: "The built-in pixel still collects basics; no salted dedup, no external analytics.",
    required: false,
  },
  {
    id: "error-uptime", name: "Errors + uptime", tier: "T3", department: "engineering", owner: "customer",
    purpose: "Sentry + a ping monitor, the incident loop's input",
    env: ["MCP_SENTRY_URL"],
    unlocks: "Incidents triage themselves: error in, root-cause, fix, receipt out.",
    degraded: "Blind to production errors. Incidents surface only when a human notices.",
    required: false,
  },
  {
    id: "support-inbox", name: "Customer support inbox", tier: "T3", department: "support", owner: "customer",
    purpose: "Shared mailbox or Plain/Intercom, support agents answer; escalate on policy",
    env: [], // no inbound-mail consumption wired yet — tracked, not detected
    unlocks: "Inbound customer mail gets grounded answers. Cite-or-abstain, escalate on policy.",
    degraded: "No inbound ear. Support answers exist in-product only.",
    required: false,
  },
  {
    id: "crm", name: "CRM", tier: "T3", department: "growth", owner: "customer",
    purpose: "Attio / HubSpot, or our own substrate table first (sales agents' pipeline)",
    env: ["MCP_CRM_URL"],
    unlocks: "Sales agents keep a durable pipeline: leads, stages, next steps.",
    degraded: "No durable sales state. Pipeline lives only inside a single run.",
    required: false,
  },
  {
    id: "calendar", name: "Calendar (Cal.com)", tier: "T3", department: "growth", owner: "customer",
    purpose: "Sales agents book real meetings (the conversion sensor)",
    env: ["CAL_WEBHOOK_SECRET"],
    unlocks: "Prospects book straight into a real calendar; bookings feed the funnel.",
    degraded: "No bookings. Sales sequences end at a reply, never a meeting.",
    required: false,
  },
  {
    id: "social", name: "Social accounts", tier: "T3", department: "marketing", owner: "customer",
    purpose: "Bluesky / Mastodon / X / LinkedIn, post to your OWN opted-in audience, never scraped graphs",
    env: ["BLUESKY_HANDLE", "BLUESKY_APP_PASSWORD", "MASTODON_BASE_URL", "MASTODON_ACCESS_TOKEN"],
    // Either platform is enough, but each needs its own pair. This is exactly what the executors in
    // lib/engine/execution.ts already require with &&, so detection now matches reality.
    envGroups: [["BLUESKY_HANDLE", "BLUESKY_APP_PASSWORD"], ["MASTODON_BASE_URL", "MASTODON_ACCESS_TOKEN"]],
    unlocks: "Marketing agents publish to your audience, clearly disclosed as AI.",
    degraded: "Nothing is posted anywhere. Drafts queue for a human to paste.",
    required: false,
  },
  {
    id: "ads", name: "Ads (optional, capped)", tier: "T3", department: "growth", owner: "customer",
    purpose: "Google/Meta, spend caps + tier gates apply",
    env: ["ADS_WEBHOOK_URL"],
    unlocks: "Capped experiments can buy reach; anything over cap queues for you.",
    degraded: "Zero paid reach. Growth is organic only.",
    required: false,
  },
  {
    id: "cloudflare", name: "Cloudflare (DNS/CDN/WAF)", tier: "T3", department: "ops", owner: "customer",
    purpose: "Where not covered by the registrar",
    env: [], // no programmatic Cloudflare consumption yet — tracked, not detected
    unlocks: "The org can manage DNS records, caching, and WAF rules itself.",
    degraded: "DNS, caching, and WAF changes stay manual founder work.",
    required: false,
  },
];

// ── FOUNDER GO-LIVE: competitor.inc's own switch (kept — answers "what do I flip to go live?") ──
export const FOUNDER_GO_LIVE: Connection[] = [
  {
    id: "entity-bank", name: "Business entity + bank (KYC)", tier: "T2", department: "finance", owner: "founder",
    purpose: "Legal person + a place revenue can settle",
    env: [],
    unlocks: "Revenue can legally settle; contracts have a counterparty.",
    degraded: "No legal person. Nothing can be sold or settled.",
    required: true,
  },
  {
    id: "vault", name: "Secrets vault", tier: "T0", department: "ops", owner: "founder",
    purpose: "Hold every key; stand up BEFORE any API key",
    env: ["VAULT_URL", "DOPPLER_TOKEN", "INFISICAL_TOKEN"],
    unlocks: "Every key lives in one revocable place; rotation is one operation.",
    degraded: "Keys live loose in env files. Rotation and revocation are manual.",
    required: true,
  },
  {
    id: "model", name: "Model provider key(s)", tier: "T0", department: "ceo", owner: "founder",
    purpose: "The company's cognition (2+ for failover)",
    env: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY"],
    unlocks: "Company #0 can think. With failover when a provider degrades.",
    degraded: "Company #0 is inert. No agent can run.",
    required: true,
  },
  {
    id: "domain-email", name: "Domain + email (SPF/DKIM/DMARC)", tier: "T1", department: "ops", owner: "founder",
    purpose: "The address + deliverable mail",
    env: ["NEXT_PUBLIC_SITE_URL"],
    unlocks: "Mail that lands. Receipts, reports, and replies deliver.",
    degraded: "No deliverable address. Outbound mail would bounce or spam-folder.",
    required: true,
  },
  {
    id: "stripe", name: "Stripe (Connect) verified", tier: "T2", department: "finance", owner: "founder",
    purpose: "Take money to the right account, never pool",
    env: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    unlocks: "Money flows to the right account. Never pooled, never held for customers.",
    degraded: "No money can move. Checkout stays dark.",
    required: true,
  },
  {
    id: "legal", name: "Lawyer-signed ToS + AUP + insurance", tier: "T2", department: "legal", owner: "founder",
    purpose: "Liability split + acceptable-use + cover",
    env: [],
    unlocks: "Customers can sign something real; liability is split on paper.",
    degraded: "No signed terms. Taking customers would be uninsured exposure.",
    required: true,
  },
  {
    id: "control-secret", name: "Control secret (out-of-band kill switch)", tier: "T0", department: "ceo", owner: "founder",
    purpose: "Human-only control-plane auth",
    env: ["CONTROL_SECRET"],
    unlocks: "The human can stop everything from outside the system, instantly.",
    degraded: "No out-of-band stop. Autonomy without a hardware brake.",
    required: true,
  },
  {
    id: "go-live", name: "Flip MAINTENANCE=0", tier: "T0", department: "ceo", owner: "founder",
    purpose: "The last switch, after the gate + drills pass",
    env: ["MAINTENANCE"],
    unlocks: "The site is live to the public.",
    degraded: "Maintenance mode. The public sees the holding page.",
    required: true,
  },
];

// The full registry: founder switch + the 17-service map. Existing consumers of CONNECTIONS see both.
export const CONNECTIONS: Connection[] = [...FOUNDER_GO_LIVE, ...CONNECTION_MAP];

export interface ConnectionStatus extends Connection {
  configured: boolean;
  note?: string; // present on tracked-not-detected items — why configured is false by construction
}

const TRACKED_NOT_DETECTED = "No env detection; tracked manually, shown as not connected until a human verifies it.";

/** Present and non-empty. A var set to "" is not set, which is a real Vercel foot-gun. */
const present = (env: Record<string, string | undefined>, name: string): boolean =>
  typeof env[name] === "string" && env[name] !== "";

/**
 * Configured when ANY group has ALL its members present. With no groups declared, each var is its own
 * group, which reproduces the original any-of rule for the entries where alternatives are the truth.
 */
export function isConfigured(c: Connection, env: Record<string, string | undefined> = process.env): boolean {
  if (c.env.length === 0) return false; // manual/legal: tracked, never guessed
  const groups = c.envGroups ?? c.env.map((e) => [e]);
  return groups.some((g) => g.length > 0 && g.every((e) => present(env, e)));
}

/** How the UI should label the requirement, so "set any of" never appears above a list of halves. */
export function envRequirement(c: Connection): { label: string; groups: string[][] } {
  const groups = c.envGroups ?? c.env.map((e) => [e]);
  const multi = groups.some((g) => g.length > 1);
  const label = groups.length === 1
    ? (groups[0].length > 1 ? "set all of" : "set")
    : multi ? "set any complete group" : "set any of";
  return { label, groups };
}

export function connectionStatus(owner?: Owner, env: Record<string, string | undefined> = process.env): ConnectionStatus[] {
  return CONNECTIONS.filter((c) => !owner || c.owner === owner).map((c) => ({
    ...c,
    // env-detectable items report real status; manual/legal (env:[]) can't be detected → false until done.
    configured: isConfigured(c, env),
    ...(c.env.length === 0 ? { note: TRACKED_NOT_DETECTED } : {}),
  }));
}

// The map alone (the 17), with live status — what /connect renders.
export function connectionMapStatus(env: Record<string, string | undefined> = process.env): ConnectionStatus[] {
  const byId = new Map(connectionStatus("customer", env).map((c) => [c.id, c]));
  return CONNECTION_MAP.map((c) => byId.get(c.id)!);
}

// A one-line honest summary for the founder's switch.
export function goLiveReadiness(): { required: number; configured: number; pending: string[] } {
  const founder = connectionStatus("founder").filter((c) => c.required);
  const pending = founder.filter((c) => !c.configured).map((c) => c.name);
  return { required: founder.length, configured: founder.length - pending.length, pending };
}
