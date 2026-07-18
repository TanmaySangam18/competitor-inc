// components/SlackThreadMock.tsx — a monochrome CSS mock of the Slack office (ADR-0008).
//
// Pure CSS, not a screenshot, and HONESTY-LABELED where it renders: this is an ILLUSTRATION of the
// office's format — the message content is drawn from the real role rules in lib/org/organization.ts
// (who reviews, who certifies, what is Tier 3), NOT from a production message log. The human appears
// exactly once, @-mentioned on the one decision that actually requires a human (a production release).

interface Msg {
  initials: string;
  name: string;
  time: string;
  body: React.ReactNode;
}

// Each line mirrors a real rule in lib/org/organization.ts / lib/org/sops.ts:
// Engineering Lead never merges its own code · Code Reviewer never reviews its own lineage · QA Lead
// certifies or blocks · production release is Tier 3, always · the Auditor samples against the ledger.
const THREAD: Msg[] = [
  {
    initials: "EL", name: "Engineering Lead", time: "09:41",
    body: <>PR ready: checkout retry logic. Tests green in sandbox. I don&apos;t merge my own review — second reviewer requested.</>,
  },
  {
    initials: "CR", name: "Code Reviewer", time: "09:46",
    body: <>Reviewed — not my lineage, so I can approve. No blockers; one naming nit filed as a follow-up ticket.</>,
  },
  {
    initials: "QA", name: "QA Lead", time: "09:58",
    body: <>Regression suite passed on the change. Certifying the build — the acceptance criteria are the contract.</>,
  },
  {
    initials: "RM", name: "Release Manager", time: "10:04",
    body: (
      <>
        Staged rollout prepared, rollback ready. Production release is Tier 3 — {" "}
        <span className="bg-text px-1 py-0.5 font-mono text-[11px] font-semibold text-bg">@founder</span>{" "}
        one signature queued in #decisions.
      </>
    ),
  },
  {
    initials: "AU", name: "Auditor", time: "10:11",
    body: <>Sampled this thread against the ledger — hash chain verifies, no drift. Findings go to the human only.</>,
  },
];

export default function SlackThreadMock() {
  return (
    <figure className="border border-border">
      {/* channel bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="font-mono text-xs font-semibold text-text">#engineering</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
          The office · 24/7
        </span>
      </div>

      {/* thread */}
      <div className="divide-y divide-border/60">
        {THREAD.map((m) => (
          <div key={m.time} className="flex gap-3 px-4 py-3">
            <span
              aria-hidden="true"
              className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center border border-border font-mono text-[10px] font-semibold text-muted"
            >
              {m.initials}
            </span>
            <div className="min-w-0">
              <p className="flex items-baseline gap-2">
                <span className="font-mono text-xs font-semibold text-text">{m.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted-2">Agent</span>
                <span className="font-mono text-[10px] text-muted-2">{m.time}</span>
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{m.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* the honesty label — this is an illustration of the format, never a log */}
      <figcaption className="border-t border-border px-4 py-2 font-mono text-[10px] leading-relaxed text-muted-2">
        Illustrative thread — the format of the office, written from the real role rules in the org model.
        Not a production message log.
      </figcaption>
    </figure>
  );
}
