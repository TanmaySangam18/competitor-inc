import type { Company } from "./types";

// 2.7 Founder-coaching view (PDR §1). The moat is GROUNDING, not advice: generic startup tips are a
// commodity; coaching wired to THIS company's live numbers + stage is not. So every insight cites a real
// number from the company and names the ONE metric to obsess over at this stage — never vague nagging.

export interface CoachInsight {
  headline: string;
  detail: string;
  metric: string; // the one thing to obsess over at this stage
}

export function coachFor(c: Company): CoachInsight {
  // Pre-build stages: the question is demand.
  if (c.status === "validating" || c.status === "validated") {
    const conf = Math.round(c.validation?.confidence ?? 0);
    return conf >= 70
      ? {
          headline: `Strong demand signal (${conf}%) — you've earned the build.`,
          detail: "Ship the winner, then prove delivery with a real, checkable receipt. Don't add features before the first one resolves.",
          metric: "Obsess over: shipping one real, openable artifact.",
        }
      : {
          headline: `Demand signal is ${conf}% — sharpen before you scale.`,
          detail: "Run a costly commitment test (a pre-order or deposit), not more free signups. Commitment is the honest validation; a weak signal you ignore becomes a month you won't get back.",
          metric: "Obsess over: one costly commitment (a real yes).",
        };
  }

  // Operating: shipped yet?
  if (c.product?.status !== "live") {
    return {
      headline: `${c.night} night${c.night === 1 ? "" : "s"} in, no live artifact yet.`,
      detail: "Activity isn't proof — a live, checkable link is. Approve the build so a real receipt lands on the proof board; that's what converts and what proves the company is real.",
      metric: "Obsess over: your first Proven Paying User (paid ∩ a verified outcome).",
    };
  }

  // Shipped + operating: now it's a conversion problem.
  const spent = Math.round((c.ledger?.spent ?? 0) * 100) / 100;
  return {
    headline: "You've shipped — now it's a conversion game.",
    detail: `You have a live product${spent ? ` and $${spent} of logged spend` : ""}. Point ONE compliant channel at it and watch the unit economics; scale only what converts under target.`,
    metric: "Obsess over: free→paid conversion at a bounded cost-per-PPU.",
  };
}
