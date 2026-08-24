// ─────────────────────────────────────────────────────────────────────────────
// THE MAINTENANCE BRAIN. Writing code is one thing; keeping it alive is the other half.
//
// Building is prompted by a human. Maintenance is triggered by an event at 3am with nobody watching,
// which makes it a fundamentally different safety problem: an agent that can autonomously rewrite a
// live product is the single highest-risk capability in this system, and a bad patch applied unattended
// is worse than the outage it was trying to fix.
//
// So this module does NOT decide how to fix things. It decides WHAT IS ALLOWED TO HAPPEN WITHOUT A
// HUMAN, and the whole design turns on one judgement:
//
//   A REVERT TO A KNOWN-GOOD DEPLOY IS SAFER TO DO AUTOMATICALLY THAN TO WAIT FOR.
//
// It restores a state that provably worked minutes ago, it is reversible, and it needs no reasoning
// about the bug. Writing a NEW patch is the opposite on all three counts. That asymmetry, not the
// severity of the outage, is what decides whether a human is required. Deciding by severity is the
// tempting error: the worse the outage, the more tempting unattended repair becomes, and the worse the
// consequence of getting it wrong.
// ─────────────────────────────────────────────────────────────────────────────

export type Health = "up" | "degraded" | "down" | "unknown";

export interface Probe {
  at: string; // ISO
  health: Health;
  status?: number;
  ms?: number; // response time
  detail?: string;
}

export interface Deploy {
  id: string;
  at: string; // ISO
  /** Did this deploy ever serve a healthy probe? Only a deploy that DID is a rollback candidate. */
  provenHealthy: boolean;
}

/** What the machine may do on its own, ordered by how much it is allowed to change. */
export type Act =
  | { do: "nothing"; because: string }
  | { do: "watch"; because: string; recheckInSeconds: number }
  | { do: "revert"; because: string; toDeploy: string; reversible: true }
  | { do: "propose-patch"; because: string; needsHuman: true }
  | { do: "page-human"; because: string; needsHuman: true };

export interface Verdict {
  act: Act;
  /** Consecutive failing probes this decision is based on. */
  consecutiveFailures: number;
  /** Stated plainly so a human reading the incident later can check the reasoning, not just the action. */
  reasoning: string[];
}

/** One bad probe is noise. This many in a row is an outage. */
export const FAILURES_BEFORE_ACTING = 3;
/** Below this, keep watching rather than acting, and recheck fast. */
export const RECHECK_SECONDS = 60;
/** A revert is only sane if the bad deploy is recent enough to be the plausible cause. */
export const REVERT_WINDOW_MINUTES = 90;

const isFailing = (h: Health) => h === "down" || h === "degraded";

/** Trailing run of failing probes. Probes are expected newest-last. */
export function consecutiveFailures(probes: readonly Probe[]): number {
  let n = 0;
  for (let i = probes.length - 1; i >= 0; i--) {
    if (!isFailing(probes[i].health)) break;
    n++;
  }
  return n;
}

/**
 * Decide what may happen without a human.
 *
 * Pure, and takes `now` as an argument so the time-window logic is testable rather than dependent on
 * when the suite happens to run.
 */
export function decide(input: {
  probes: readonly Probe[];
  deploys: readonly Deploy[]; // newest first
  now: Date;
  /** Reverts already attempted for this incident. A second one is thrashing, not repair. */
  revertsAlready?: number;
}): Verdict {
  const { probes, deploys, now } = input;
  const revertsAlready = input.revertsAlready ?? 0;
  const reasoning: string[] = [];
  const fails = consecutiveFailures(probes);

  if (probes.length === 0) {
    return {
      act: { do: "nothing", because: "There are no probes yet, so there is no evidence of anything." },
      consecutiveFailures: 0,
      reasoning: ["Refusing to act on an absence of data."],
    };
  }

  const latest = probes[probes.length - 1];

  if (latest.health === "unknown") {
    reasoning.push("The latest probe could not determine health, which is not the same as a failure.");
    return {
      act: { do: "watch", because: "Health is unknown, and acting on an unknown state could cause the outage.", recheckInSeconds: RECHECK_SECONDS },
      consecutiveFailures: fails,
      reasoning,
    };
  }

  if (fails === 0) {
    return {
      act: { do: "nothing", because: "The latest probe is healthy." },
      consecutiveFailures: 0,
      reasoning: ["Nothing is wrong right now."],
    };
  }

  if (fails < FAILURES_BEFORE_ACTING) {
    reasoning.push(`${fails} failing probe${fails === 1 ? "" : "s"} in a row, and ${FAILURES_BEFORE_ACTING} is the threshold. A single bad probe is usually the network.`);
    return {
      act: { do: "watch", because: `Not yet confirmed as an outage (${fails} of ${FAILURES_BEFORE_ACTING} failures).`, recheckInSeconds: RECHECK_SECONDS },
      consecutiveFailures: fails,
      reasoning,
    };
  }

  reasoning.push(`${fails} consecutive failing probes. This is an outage, not noise.`);

  // Thrashing guard, checked BEFORE looking for a rollback target: if a revert already happened and
  // things are still down, the deploy was not the cause and reverting again just adds churn.
  if (revertsAlready > 0) {
    reasoning.push(`A revert was already attempted (${revertsAlready}) and the service is still failing, so the last deploy was not the cause.`);
    return {
      act: { do: "page-human", because: "Reverting did not fix it, so this needs a person.", needsHuman: true },
      consecutiveFailures: fails,
      reasoning,
    };
  }

  const current = deploys[0];
  const lastGood = deploys.slice(1).find((d) => d.provenHealthy);

  if (!current) {
    reasoning.push("No deploy history is available, so there is nothing to roll back to.");
    return {
      act: { do: "propose-patch", because: "The service is down and there is no known-good deploy to return to.", needsHuman: true },
      consecutiveFailures: fails,
      reasoning,
    };
  }

  const deployAgeMin = (now.getTime() - new Date(current.at).getTime()) / 60000;
  if (!Number.isFinite(deployAgeMin) || deployAgeMin < 0) {
    reasoning.push("The current deploy's timestamp is unusable, so its age cannot be established.");
    return {
      act: { do: "page-human", because: "The deploy history cannot be trusted, so no automatic action is safe.", needsHuman: true },
      consecutiveFailures: fails,
      reasoning,
    };
  }

  if (deployAgeMin > REVERT_WINDOW_MINUTES) {
    reasoning.push(`The running deploy is ${Math.round(deployAgeMin)} minutes old, past the ${REVERT_WINDOW_MINUTES} minute window, so it is unlikely to be what broke. Something changed outside our code.`);
    return {
      act: { do: "page-human", because: "The outage is not explained by a recent deploy, so a revert would change the wrong thing.", needsHuman: true },
      consecutiveFailures: fails,
      reasoning,
    };
  }

  if (!lastGood) {
    reasoning.push("No earlier deploy has ever served a healthy probe, so there is no state known to work.");
    return {
      act: { do: "propose-patch", because: "There is no proven-good deploy to return to, so a fix has to be written and signed for.", needsHuman: true },
      consecutiveFailures: fails,
      reasoning,
    };
  }

  reasoning.push(`Deploy ${current.id} went out ${Math.round(deployAgeMin)} minutes ago and ${lastGood.id} is proven healthy.`);
  reasoning.push("Reverting restores a state that provably worked, is itself reversible, and requires no reasoning about the bug. That is why it does not need a signature and writing a new patch does.");
  return {
    act: { do: "revert", because: `Returning to ${lastGood.id}, which is known to have served healthy traffic.`, toDeploy: lastGood.id, reversible: true },
    consecutiveFailures: fails,
    reasoning,
  };
}

/** What gets posted into the channel. Plain words, no jargon, says what it did and what it did not. */
export function incidentMessage(v: Verdict, siteName: string): string {
  const head = {
    nothing: `${siteName} is fine.`,
    watch: `Watching ${siteName}.`,
    revert: `${siteName} went down. Rolling back to the last version that worked.`,
    "propose-patch": `${siteName} is down and I cannot fix it safely on my own.`,
    "page-human": `${siteName} is down and needs you.`,
  }[v.act.do];

  const tail =
    v.act.do === "revert"
      ? "\n\nI did not write any new code. I put back the version that was serving traffic before, which is reversible."
      : "needsHuman" in v.act
        ? "\n\nI have not changed anything. Writing a new fix to a live product is not something I will do without your approval."
        : "";

  return [head, "", v.act.because, "", ...v.reasoning.map((r) => `- ${r}`), tail].join("\n").trim();
}
