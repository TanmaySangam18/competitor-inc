import "server-only";

import { notifyFounder } from "./notify-founder";
import { trace } from "./observability";
import { shouldAlert, type AlertEvent } from "./policy";

// The Glass Box made ACTIVE. When the policy engine refuses an action (forbidden_attempt / cap_breach) or
// a live executor fails (failure), don't just write it down — REACT: emit a dev trace AND page the
// founder. Both legs are gated + fail-soft + non-blocking (trace no-ops without OBSERVABILITY_URL;
// notifyFounder no-ops without Resend), and the whole thing is wrapped so alerting can never throw,
// delay, or break the action path. Honors policy.observability.realTimeAlertsOn.

function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
}

export function raiseAlert(event: AlertEvent, summary: string, meta?: Record<string, unknown>): void {
  try {
    // Always trace (the developer-side record), even when paging is off.
    trace({ name: `alert:${event}`, ok: false, ms: 0, meta: { summary, ...meta } });
    if (!shouldAlert(event)) return;
    const label = event.replace(/_/g, " ");
    void notifyFounder(
      `competitor.inc — ⚠️ ${label}`,
      `<p><b>${esc(summary)}</b></p><p style="color:#888;font-size:13px">${esc(JSON.stringify(meta ?? {}))}</p>`
    ).catch(() => {
      /* paging is best-effort — never let a failed alert affect anything */
    });
  } catch {
    /* alerting must never affect the action path */
  }
}
