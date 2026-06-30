import { POLICY, type Policy } from "./policy";

// Enforce the daily/monthly spend caps the policy DECLARES (the per-transaction cap is enforced
// separately + hard in policy.executionRefusal). Best-effort + in-memory per serverless instance — the
// same honest posture as ratelimit.ts; a durable spend_log (DB) is the v2 upgrade for cross-instance
// accuracy. At early volume most calls hit a warm instance, so this is a real guardrail today.

interface Bucket {
  day: number;
  dayStart: number;
  month: number;
  monthStart: number;
}
const store = new Map<string, Bucket>();

const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const startOfMonth = (t: number) => {
  const d = new Date(t);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

function bucket(companyId: string, now: number): Bucket {
  const ds = startOfDay(now);
  const ms = startOfMonth(now);
  let b = store.get(companyId);
  if (!b) {
    b = { day: 0, dayStart: ds, month: 0, monthStart: ms };
    store.set(companyId, b);
  }
  if (b.dayStart !== ds) {
    b.day = 0;
    b.dayStart = ds;
  }
  if (b.monthStart !== ms) {
    b.month = 0;
    b.monthStart = ms;
  }
  return b;
}

// Which cap this spend would breach, or null if it fits within both the daily and monthly ceilings.
export function spendWouldExceed(
  companyId: string,
  amount: number,
  policy: Policy = POLICY,
  now: number = Date.now(),
): "daily" | "monthly" | null {
  if (!companyId || !(amount > 0)) return null;
  const b = bucket(companyId, now);
  if (b.day + amount > policy.spend.dailyCapUsd) return "daily";
  if (b.month + amount > policy.spend.monthlyCapUsd) return "monthly";
  return null;
}

// Record a spend that actually executed, so subsequent checks in this window see it.
export function recordSpend(companyId: string, amount: number, now: number = Date.now()): void {
  if (!companyId || !(amount > 0)) return;
  const b = bucket(companyId, now);
  b.day += amount;
  b.month += amount;
}
