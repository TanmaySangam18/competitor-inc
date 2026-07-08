// Lifecycle / retention emails (Slice D). Pure template builders + a pure "who's due" selector so the logic
// is fully testable without a network or a clock. The cron wires these in behind the LIFECYCLE_EMAILS flag
// and only sends when RESEND is configured (see app/api/cron) — outward sends stay founder-controlled and
// dormant until enabled. Honest copy only: no invented metrics, no fake social proof.

export type LifecycleKind = "welcome" | "day7" | "day21";

export interface LifecycleUser {
  email: string;
  signupAt: number; // epoch ms
}

export interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

const DAY = 24 * 60 * 60 * 1000;

// Age thresholds (ms) at/after which each email becomes due. Each is sent at most once per user (deduped by
// the caller via a `${email}:${kind}` set backed by the lifecycle_sends table).
const DUE_AFTER: Record<LifecycleKind, number> = {
  welcome: 0, // the first cron after signup
  day7: 7 * DAY,
  day21: 21 * DAY,
};

const BASE = "https://competitor-inc-zeta.vercel.app";

function wrap(bodyHtml: string): string {
  return `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;color:#111;line-height:1.55">
${bodyHtml}
<hr style="border:none;border-top:1px solid #eee;margin:28px 0 14px"/>
<p style="font-size:12px;color:#888">competitor.inc · you're getting this because you started a company here.
<a href="${BASE}/api/unsubscribe" style="color:#888">Unsubscribe</a>.</p>
</div>`;
}

export function lifecycleEmail(kind: LifecycleKind): EmailContent {
  switch (kind) {
    case "welcome":
      return {
        subject: "Your crew is ready — let's validate your idea",
        text: `Welcome. Your AI crew is standing by.\n\nStart with the honest part: score your idea and see the evidence before you build anything. It takes about a minute.\n\n${BASE}/score\n\nWhen the signal's there, the crew builds it — and you approve the plan and the money. You own everything.`,
        html: wrap(
          `<h2 style="margin:0 0 12px">Your crew is ready 👋</h2>
<p>Start with the honest part: <strong>score your idea</strong> and see the evidence behind the verdict before you build anything. About a minute.</p>
<p><a href="${BASE}/score" style="display:inline-block;background:#f97362;color:#fff;text-decoration:none;padding:11px 20px;border-radius:10px;font-weight:600">Score my idea →</a></p>
<p>When the signal's there, the crew builds it — and <strong>you approve the plan and the money</strong>. You own everything, 0% revenue share.</p>`
        ),
      };
    case "day7":
      return {
        subject: "How's it going with your company?",
        text: `A week in — quick check-in.\n\nWhat's the one thing blocking you from your first real result? Reply to this email; a human reads every one.\n\nIf you haven't yet, the crew can build your MVP once your idea validates: ${BASE}/dashboard`,
        html: wrap(
          `<h2 style="margin:0 0 12px">A week in — how's it going?</h2>
<p>What's the one thing blocking your first real result? <strong>Just reply</strong> — a human reads every one.</p>
<p>Ready to move? Your crew can build the MVP the moment your idea validates.</p>
<p><a href="${BASE}/dashboard" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 20px;border-radius:10px;font-weight:600">Open your dashboard →</a></p>`
        ),
      };
    case "day21":
      return {
        subject: "Want the crew to run it for you?",
        text: `Three weeks in. If building + operating solo is a grind, that's exactly what the Operator tier is for — the crew runs the company and brings decisions to your desk for approval.\n\nSee the tiers: ${BASE}/join\n\nOr reply and tell me what's slowing you down.`,
        html: wrap(
          `<h2 style="margin:0 0 12px">Want the crew to <em>run</em> it?</h2>
<p>Three weeks in. If doing it all solo is a grind, that's what the <strong>Operator</strong> tier is for — the crew runs the company and brings decisions to your desk for approval.</p>
<p><a href="${BASE}/join" style="display:inline-block;background:#f97362;color:#fff;text-decoration:none;padding:11px 20px;border-radius:10px;font-weight:600">See the tiers →</a></p>
<p>Or just reply and tell me what's slowing you down.</p>`
        ),
      };
  }
}

// Pure selector: which lifecycle emails are due right now, once each. `sent` holds `${email}:${kind}` keys
// already delivered. Deterministic — same inputs, same output — so it's fully unit-testable.
export function dueLifecycleEmails(
  users: LifecycleUser[],
  now: number,
  sent: Set<string>,
): { email: string; kind: LifecycleKind }[] {
  const out: { email: string; kind: LifecycleKind }[] = [];
  const kinds: LifecycleKind[] = ["welcome", "day7", "day21"];
  for (const u of users) {
    if (!u.email || !Number.isFinite(u.signupAt)) continue;
    const age = now - u.signupAt;
    for (const kind of kinds) {
      if (age >= DUE_AFTER[kind] && !sent.has(`${u.email}:${kind}`)) {
        out.push({ email: u.email, kind });
      }
    }
  }
  return out;
}
