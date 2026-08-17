// lib/core/accounts.ts — COUNT ACCOUNTS, NOT SERVICES.
//
// THE PROBLEM THIS FIXES. The connection map holds 19 entries, and /connect showed all 19 at once. Only
// ONE of them is required (A1), but a page listing nineteen chores reads as nineteen chores whatever the
// small print says. The founder's reaction was the correct one: "I am giving users 19 things to connect?"
//
// THE INSIGHT: the 19 are CAPABILITIES, and our taxonomy is capability-shaped, so it inflates the count
// against us. A human does not open nineteen accounts. They open about seven, and each one lights several
// capabilities at once. Supabase alone is a database, an object store and an auth provider. Google
// Workspace is mail, calendar, a support inbox and a drive, behind a single consent screen.
//
// So this module is the human-shaped view: what you actually go and do, once, and what each one turns on.
// It composes CONNECTION_MAP and CAPABILITIES rather than restating them, so there is still exactly one
// definition of what exists and one of what it unlocks.
//
// WHAT THIS DELIBERATELY IS NOT: managed credentials. Competitors reach zero connections by holding the
// customer's accounts and paying their vendor bills, which needs an entity, vendor contracts and a budget
// we do not have. Grouping is honest; pretending we provisioned something is not.

import { CONNECTION_MAP } from "./connections";
import { CAPABILITIES, type CapabilityId } from "./capabilities";

export interface ProviderAccount {
  id: string;
  name: string;
  /** Connection ids from CONNECTION_MAP that this ONE account satisfies. */
  covers: string[];
  /** What the human physically does, once. */
  action: string;
  signupUrl: string;
  /** Why this is one step rather than several. Shown so the grouping is explained, not asserted. */
  why: string;
  /** True when a single OAuth consent covers everything listed, rather than several pasted keys. */
  oneConsent: boolean;
}

/**
 * Ordered by how early a real company needs them. The model comes first because it is the only genuinely
 * unsubstitutable one: inference costs money per token, so nobody can hand it to you for free forever.
 */
export const ACCOUNTS: readonly ProviderAccount[] = [
  {
    id: "openrouter",
    name: "A model key",
    covers: ["ai-model"],
    action: "Create one key at OpenRouter (or paste an Anthropic, OpenAI or Groq key you already have)",
    signupUrl: "https://openrouter.ai/keys",
    why: "One key routes to hundreds of models, so switching model later is a dropdown rather than another signup.",
    oneConsent: false,
  },
  {
    id: "github",
    name: "GitHub",
    covers: ["github"],
    action: "Authorise GitHub",
    signupUrl: "https://github.com/settings/tokens",
    why: "Repositories, Actions and secrets are one account, so code, CI and credentials arrive together.",
    oneConsent: true,
  },
  {
    id: "supabase",
    name: "Supabase",
    covers: ["database", "object-storage"],
    action: "Create one Supabase project and paste its URL and service key",
    signupUrl: "https://supabase.com/dashboard",
    why: "One project is a Postgres database, an object store and an auth provider. Three capabilities, one signup.",
    oneConsent: false,
  },
  {
    id: "vercel",
    name: "Vercel",
    covers: ["hosting", "registrar", "analytics"],
    action: "Authorise Vercel",
    signupUrl: "https://vercel.com/account/tokens",
    why: "Hosting, domains and analytics are the same account, so shipping and measuring do not need separate setup.",
    oneConsent: true,
  },
  {
    id: "google",
    name: "Google Workspace",
    covers: ["email-sending", "calendar", "support-inbox"],
    action: "Sign in with Google once and approve the scopes",
    signupUrl: "https://workspace.google.com",
    why: "Mail, calendar and the support inbox are one consent screen with several scopes, not three connections.",
    oneConsent: true,
  },
  {
    id: "payments",
    name: "Stripe or Polar",
    covers: ["payments", "banking"],
    action: "Connect the payment processor you already use",
    signupUrl: "https://dashboard.stripe.com/apikeys",
    why: "Charging customers and reading the resulting balance are one relationship, not two.",
    oneConsent: true,
  },
  {
    id: "slack",
    name: "Slack",
    covers: ["slack"],
    action: "Install the app into your workspace",
    signupUrl: "https://api.slack.com/apps",
    why: "The org reports where you already read, so there is no second place to check.",
    oneConsent: true,
  },
  {
    id: "social",
    name: "Social accounts",
    covers: ["social", "ads"],
    action: "Authorise the platforms you want the company to post on",
    signupUrl: "https://bsky.app/settings/app-passwords",
    why: "Organic posting and paid promotion run on the same accounts, and both pass the publishing mandate first.",
    oneConsent: true,
  },
  {
    id: "ops",
    name: "Error and uptime monitoring",
    covers: ["error-uptime", "crm", "agent-inbox", "cloudflare"],
    action: "Connect the operational tools you already run",
    signupUrl: "https://sentry.io",
    why: "Grouped because a company that has one of these usually has the rest, and none of them gate anything earlier.",
    oneConsent: false,
  },
] as const;

export interface AccountState extends ProviderAccount {
  connected: boolean;
  /** Connection ids from `covers` that are still absent. */
  missing: string[];
  /** Capability ids this account would light up from here. */
  unlocks: CapabilityId[];
}

/** Which capabilities would become live if this account were connected, given what is already configured. */
function unlockedBy(account: ProviderAccount, configured: Set<string>): CapabilityId[] {
  const after = new Set([...configured, ...account.covers]);
  return CAPABILITIES.filter(
    (c) => c.needs.some((n) => !configured.has(n)) && c.needs.every((n) => after.has(n)),
  ).map((c) => c.id);
}

export function accountStatus(configured: Iterable<string>): AccountState[] {
  const have = new Set(configured);
  return ACCOUNTS.map((a) => {
    const missing = a.covers.filter((c) => !have.has(c));
    return { ...a, connected: missing.length === 0, missing, unlocks: unlockedBy(a, have) };
  });
}

export interface NextStep {
  account: ProviderAccount;
  /** The plain reason to do this one now, phrased as what it turns on. */
  because: string;
  unlocks: CapabilityId[];
}

/**
 * JUST-IN-TIME CONSENT: the single next thing to ask for, and never a list.
 *
 * /connect used to promise it "asks for the next connection only when a task truly needs it" and then
 * contradict itself by listing all nineteen upfront. This is the promise, implemented. Pass the capability
 * a task is actually blocked on and the answer is targeted; pass nothing and it returns whichever account
 * unlocks the most from here.
 *
 * Returns null when nothing useful is left, which is a real state and should be shown as done.
 */
export function nextStep(configured: Iterable<string>, blockedOn?: CapabilityId): NextStep | null {
  const have = new Set(configured);
  const states = accountStatus(have).filter((a) => !a.connected);
  if (!states.length) return null;

  if (blockedOn) {
    const cap = CAPABILITIES.find((c) => c.id === blockedOn);
    if (cap) {
      const missing = cap.needs.filter((n) => !have.has(n));
      // The account that closes the most of this capability's gap, so we never send someone to a signup
      // that leaves them still blocked without saying so.
      const best = states
        .map((a) => ({ a, closes: a.covers.filter((c) => missing.includes(c)).length }))
        .filter((x) => x.closes > 0)
        .sort((x, y) => y.closes - x.closes || x.a.id.localeCompare(y.a.id))[0];
      if (best) {
        const remaining = missing.filter((m) => !best.a.covers.includes(m));
        return {
          account: best.a,
          because: remaining.length
            ? `${cap.name} needs this, and then ${remaining.length} more.`
            : `${cap.name} needs only this.`,
          unlocks: best.a.unlocks,
        };
      }
    }
  }

  const ranked = [...states].sort((a, b) => b.unlocks.length - a.unlocks.length || a.id.localeCompare(b.id));
  const pick = ranked[0];
  return {
    account: pick,
    because: pick.unlocks.length
      ? `Turns on ${pick.unlocks.length === 1 ? "one more thing" : `${pick.unlocks.length} more things`} the company can do.`
      : "Optional. Nothing is waiting on it.",
    unlocks: pick.unlocks,
  };
}

/** The honest headline for the front door: accounts, not services. */
export function accountSummary(configured: Iterable<string>): { connected: number; total: number; line: string } {
  const states = accountStatus(configured);
  const connected = states.filter((a) => a.connected).length;
  return {
    connected,
    total: states.length,
    line:
      connected === states.length
        ? "Everything is connected."
        : `${connected} of ${states.length} accounts connected. Only the model key is ever required; the rest wait until something needs them.`,
  };
}

/** Every connection must be reachable through some account, or the grouping is quietly hiding one. */
export function uncoveredConnections(): string[] {
  const covered = new Set(ACCOUNTS.flatMap((a) => a.covers));
  return CONNECTION_MAP.map((c) => c.id).filter((id) => !covered.has(id));
}
