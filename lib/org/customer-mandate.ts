// ─────────────────────────────────────────────────────────────────────────────
// THE STANDING MANDATE — collapsing the CUSTOMER'S "2%" to one signature (Block 3: Consent Rails).
//
// The founder's 2% was dozens of account signups + keys — acceptable for the person BUILDING the
// platform, unacceptable for a customer who's hiring "a company built and operated by AI employees."
// The invention: the platform ABSORBS every absorbable act onto its OWN rails —
//   repos/hosting under competitor.inc's infrastructure · model compute on platform keys ·
//   agent identities (Slack/numbers) platform-owned · outreach through platform identities under the
//   consent gates · collecting THEIR customers' money through the platform's merchant-of-record.
// What remains is only what is LEGALLY irreducible (a human must bind themselves):
//   1. ONE signature at signup — the mandate itself (ToS + scoped agency authorization + caps).
//   2. ONE payout connection (KYC) — only when real money first flows TO them.
//   3. Rare, clearly-labeled NEEDS-YOU acts: their money above cap, binding contracts, deletion.
// Autonomy with a floor: the mandate is scoped, capped, and revocable INSTANTLY (the kill switch).
// This is the PURE decision core — no I/O; onboarding signs it, the engine consults it before acting.
// ─────────────────────────────────────────────────────────────────────────────

// Every act class the company can perform on a customer's behalf. Platform-railed acts are absorbable
// under the mandate; the irreducible ones can NEVER be automated regardless of scopes or caps.
export type MandateAct =
  | "build_software" // repos/hosting on platform rails
  | "deploy" // platform infrastructure
  | "publish_content" // through PLATFORM identities, consent-gated
  | "outreach" // through PLATFORM identities, opt-in rails only
  | "spend_platform_budget" // model/compute/services within the cap
  | "collect_revenue" // through the platform's merchant-of-record INTO the customer's balance
  | "payout_setup" // KYC — legally the human's own act
  | "sign_contract" // binding the customer — irreducible
  | "spend_above_cap" // their money beyond the standing cap
  | "delete_company"; // destructive + irreversible

// The signed mandate: which act classes the customer authorized, with hard caps. Revocable instantly.
export interface CustomerMandate {
  signedAt: number | null; // null ⇒ nothing is authorized (no signature, no autonomy)
  scopes: MandateAct[]; // what the ONE signature authorized
  monthlySpendCapCents: number; // hard ceiling on platform-budget spend
  killSwitch: boolean; // customer said STOP — everything halts except reading their own data
}

export type MandateDecision =
  | { decision: "auto"; reason: string } // proceeds on platform rails, logged with proof
  | { decision: "needs-you"; reason: string } // clearly-labeled human act, queued to the customer
  | { decision: "forbidden"; reason: string }; // never performable right now, mandate or not

// The irreducible floor — no scope, cap, or founder override makes these automatic. A human binds
// themself, connects their own payout, or confirms destruction. This list is the whole point.
const IRREDUCIBLE: ReadonlySet<MandateAct> = new Set(["payout_setup", "sign_contract", "spend_above_cap", "delete_company"] as MandateAct[]);

// Decide whether an act may proceed autonomously under a customer's mandate. Deny-by-default:
// kill switch ⇒ forbidden; unsigned ⇒ nothing; irreducible ⇒ needs-you ALWAYS (even if "authorized");
// unscoped ⇒ needs-you; spend beyond cap ⇒ needs-you. Only a signed, scoped, capped, un-killed act runs.
export function decideMandate(
  act: MandateAct,
  mandate: CustomerMandate,
  opts: { spendCents?: number; spentThisMonthCents?: number } = {},
): MandateDecision {
  if (mandate.killSwitch) return { decision: "forbidden", reason: "kill switch is on — everything is halted until you turn it back off" };
  if (!mandate.signedAt) return { decision: "needs-you", reason: "no signed mandate — one signature at signup authorizes the company to work" };
  if (IRREDUCIBLE.has(act)) return { decision: "needs-you", reason: "legally yours alone — a human must do this, clearly labeled, never automated" };
  if (!mandate.scopes.includes(act)) return { decision: "needs-you", reason: `"${act}" is outside your signed scopes — approve it once or add the scope` };
  if (act === "spend_platform_budget") {
    const total = (opts.spentThisMonthCents ?? 0) + (opts.spendCents ?? 0);
    if (total > mandate.monthlySpendCapCents) {
      return { decision: "needs-you", reason: `this would put the month at $${(total / 100).toFixed(2)} — above your $${(mandate.monthlySpendCapCents / 100).toFixed(2)} cap` };
    }
  }
  return { decision: "auto", reason: "inside your signed mandate — proceeding on platform rails, logged with proof" };
}

// The default mandate offered at signup — every ABSORBABLE act, a modest cap, nothing irreducible.
export function defaultMandate(now = Date.now()): CustomerMandate {
  return {
    signedAt: now,
    scopes: ["build_software", "deploy", "publish_content", "outreach", "spend_platform_budget", "collect_revenue"],
    monthlySpendCapCents: 5000, // $50/mo of platform budget until the customer raises it
    killSwitch: false,
  };
}
