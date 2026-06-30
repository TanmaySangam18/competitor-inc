// competitor.inc engine — swappable provider interface.
//
// The product is designed "frontier-model-first, behind a swappable interface."
// `SimulatedProvider` runs fully client-side with no API key (instant, offline demo).
// A real model is a drop-in: implement `EngineProvider` to call /api/engine (server-side,
// where the key lives) and select it via NEXT_PUBLIC_MODEL_PROVIDER.

import type {
  Activity,
  AgentRole,
  ApprovalItem,
  Company,
  Experiment,
  ValidationResult,
} from "./types";

export interface ShiftResult {
  activities: Activity[];
  approvals: ApprovalItem[];
}

export interface EngineProvider {
  readonly name: string;
  // `salt` varies the deterministic result for re-tests (continuous validation) — same idea, a
  // fresh-but-plausible reading. Omitted = the stable first-run result.
  validate(idea: string, salt?: string): ValidationResult;
  shift(company: Company): ShiftResult;
}

/* ── deterministic RNG (so a given idea/night is reproducible) ── */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(rng: () => number, arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const between = (rng: () => number, lo: number, hi: number) => lo + rng() * (hi - lo);
const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const uid = () => crypto.randomUUID();

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join("-") || "venture"
  );
}

const STOP = new Set([
  "a", "an", "the", "for", "to", "of", "and", "app", "that", "with", "my", "me", "build",
  "make", "create", "i", "want", "platform", "tool", "ai", "your", "you",
]);

export function companyNameFrom(idea: string): string {
  const words = idea
    .replace(/[^a-zA-Z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w.toLowerCase()));
  const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  if (words.length === 0) return "Untitled Co.";
  const core = cap(words[0]);
  const suffix = pick(mulberry32(hash(idea)), ["ly", "ory", "ish", "base", "loop", "hub", "go"]);
  return core + suffix;
}

/* ── Validation scoring — shared by simulated + real-model paths ── */
export interface ValidationCore {
  waitlist: number;
  ctr: number;
  costPerSignup: number;
  spend: number;
}

// Secondary estimates. When a real model runs, it provides these (so every number reflects reasoning
// about the specific idea); offline/simulated falls back to the deterministic RNG below.
export interface ScoreExtras {
  conversion?: number; // landing → waitlist conversion %
  clickThrough?: number; // fake-door click-through %
  searchVolume?: number; // monthly searches
  competition?: "low" | "medium" | "high";
}
const COMPETITION = ["low", "medium", "high"] as const;
const fin = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function scoreIdea(core: ValidationCore, seed: string, extras?: ScoreExtras) {
  const rng = mulberry32(hash("score:" + seed));
  const conv = fin(extras?.conversion) ? round(Math.max(0, extras!.conversion!), 1) : round(between(rng, 2, 9), 1);
  const fakedoor = fin(extras?.clickThrough) ? round(Math.max(0, extras!.clickThrough!), 1) : round(between(rng, 1.5, 12), 1);
  const searches = fin(extras?.searchVolume) ? Math.max(0, Math.round(extras!.searchVolume!)) : Math.round(between(rng, 200, 18000));
  const competition = extras?.competition && COMPETITION.includes(extras.competition) ? extras.competition : pick(rng, [...COMPETITION]);
  const sig = (good: boolean, mid: boolean): Experiment["signal"] => (good ? "positive" : mid ? "weak" : "negative");
  const experiments: Experiment[] = [
    { key: "landing", label: "Landing page + waitlist", detail: "Projected signups + conversion", metric: `${core.waitlist} signups · ${conv}% conversion`, signal: sig(core.waitlist >= 40, core.waitlist >= 20) },
    { key: "fakedoor", label: "Fake-door test", detail: "A “Get started” click-through estimate", metric: `${fakedoor}% clicked through`, signal: sig(fakedoor >= 6, fakedoor >= 3) },
    { key: "ads", label: "Paid demand test", detail: "Small ad smoke-test (your budget)", metric: `${core.ctr}% CTR · $${core.costPerSignup}/signup`, signal: sig(core.ctr >= 3 && core.costPerSignup <= 1.5, core.costPerSignup <= 2.5) },
    { key: "search", label: "Search demand", detail: "Existing intent for this problem", metric: `${searches.toLocaleString()}/mo searches · ${competition} competition`, signal: sig(searches >= 4000 && competition !== "high", searches >= 1500) },
  ];
  const points = experiments.reduce((t, e) => t + (e.signal === "positive" ? 2 : e.signal === "weak" ? 1 : 0), 0);
  const confidence = Math.round((points / (experiments.length * 2)) * 100);
  const verdict: ValidationResult["verdict"] = confidence >= 65 ? "strong" : confidence < 40 ? "weak" : "mixed";
  const weakest = experiments.find((e) => e.signal === "negative") ?? experiments.find((e) => e.signal === "weak");
  const recommendation =
    verdict === "strong"
      ? `Strong, consistent signal (${confidence}% confidence). I'd build the MVP.`
      : verdict === "mixed"
      ? `Mixed signal (${confidence}%).${weakest ? ` The "${weakest.label}" result is soft —` : ""} I'd sharpen the idea or test a different angle before building.`
      : `Honestly, the signal is weak (${confidence}%). I'd hold — this isn't worth building yet. Want to try a different angle?`;
  return { experiments, confidence, verdict, recommendation };
}

/* ── Simulated provider ─────────────────────────────────────── */
class SimulatedProvider implements EngineProvider {
  readonly name = "simulated";

  validate(idea: string, salt = ""): ValidationResult {
    const seed = salt ? idea + "::" + salt : idea;
    const rng = mulberry32(hash("validate:" + seed));
    const waitlist = Math.round(between(rng, 8, 86));
    const ctr = round(between(rng, 1.4, 6.4), 1);
    const costPerSignup = round(between(rng, 0.3, 3.4), 2);
    const spend = round(between(rng, 15, 25), 2);
    const score = scoreIdea({ waitlist, ctr, costPerSignup, spend }, seed);
    return {
      steps: [
        { label: "Spun up a landing page", done: true },
        { label: "Wired a waitlist + analytics", done: true },
        { label: `Ran a $${spend} demand test`, done: true },
        { label: "Scored 4 experiments", done: true },
      ],
      waitlist,
      ctr,
      costPerSignup,
      spend,
      ...score,
    };
  }

  shift(company: Company): ShiftResult {
    const night = company.night + 1;
    const rng = mulberry32(hash(company.id + ":night:" + night));
    const activities: Activity[] = [];
    const approvals: ApprovalItem[] = [];

    const add = (
      agent: AgentRole,
      action: string,
      opts: Partial<Activity> = {}
    ) => {
      activities.push({
        id: uid(),
        night,
        agent,
        action,
        cost: 0,
        status: "done",
        ...opts,
      });
    };

    // Engineering — ship something, with proof
    if (rng() > 0.15) {
      const feat = pick(rng, ["onboarding flow", "billing screen", "search", "share links", "dark mode"]);
      add("engineering", `Shipped the ${feat}`, {
        cost: round(between(rng, 0.18, 0.7)),
        // Simulated shift → a metric, never a fabricated clickable URL. Real builds attach a real,
        // resolvable link (see execution.ts buildOnGitHub); this is the offline preview.
        proof: { kind: "metric", value: "build passed (preview)" },
        meta: "build passed",
      });
    }
    if (rng() > 0.6) {
      // a deploy to prod needs sign-off
      approvals.push({
        id: uid(), night, agent: "engineering", kind: "deploy",
        title: "Deploy v" + night + " to production",
        detail: "All checks green. Pushing to the live site needs your ok.",
      });
    }

    // Marketing — demand test / spend (big spend needs approval)
    if (rng() > 0.2) {
      const small = round(between(rng, 8, 22));
      add("marketing", `Ran a $${small} test — ${round(between(rng, 2.1, 6.2), 1)}% CTR`, {
        cost: small,
        proof: { kind: "metric", value: `+${Math.round(between(rng, 6, 40))} signups` },
        meta: "within budget",
      });
    }
    if (rng() > 0.55) {
      const big = Math.round(between(rng, 150, 600));
      approvals.push({
        id: uid(), night, agent: "marketing", kind: "spend",
        title: `Scale ad spend to $${big}/day`,
        detail: `Last test beat target CAC — above the auto-spend cap, so it needs your ok. This runs on YOUR connected ad account; with none connected it stays a simulated plan (nothing is spent).`,
        amount: big,
      });
    }

    // Support — handle users, occasional credit-back on failed work
    if (rng() > 0.25) {
      add("support", `Answered ${Math.round(between(rng, 3, 19))} support emails`, {
        cost: round(between(rng, 0.02, 0.12)),
        meta: "0 escalations",
      });
    }
    if (rng() > 0.78) {
      // a task failed → credits returned to your allowance, never charged (transparency feature)
      add("engineering", "A codegen task failed — credited back, not charged", {
        cost: round(between(rng, 0.2, 0.5)),
        status: "failed-credited",
        meta: "no charge for failed work",
      });
    }

    // Growth — outreach drafts need sign-off
    if (rng() > 0.5) {
      approvals.push({
        id: uid(), night, agent: "growth", kind: "bluesky",
        title: "Post a launch update on Bluesky",
        // Markets the CUSTOMER's product (name + idea) — not competitor.inc's pitch.
        detail: `${company.name} is live in early access — ${company.idea}. Be one of the first to try it 👇`,
      });
    } else if (rng() > 0.4) {
      add("growth", "Spotted a trend worth riding & drafted notes", {
        cost: 0,
        meta: "saved to ideas",
      });
    }

    // CEO — nightly audit + the occasional honest "cut this"
    if (rng() > 0.5) {
      add("ceo", `Nightly audit: runway healthy, churn ${round(between(rng, 1.1, 4.2), 1)}%`, {
        cost: 0,
        meta: "no action needed",
      });
    } else {
      const feat = pick(rng, ["the referral page", "the AI summarizer", "the Pro tier"]);
      add("ceo", `Reality check: ${feat} isn't converting — I'd cut it`, {
        cost: 0,
        meta: "recommend killing",
      });
    }

    return { activities, approvals };
  }
}

const simulated = new SimulatedProvider();

export function getProvider(): EngineProvider {
  // NEXT_PUBLIC_MODEL_PROVIDER could select a real, server-backed provider here.
  // For now everything routes through the offline simulated engine.
  return simulated;
}
