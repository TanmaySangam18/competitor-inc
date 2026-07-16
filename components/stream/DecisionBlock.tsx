"use client";

// The pinned decision block (Connect-First Reset §2) — the ONE thing on the page that waits for a
// human. It carries the heaviest border on the page (1.5px solid near-black): visual weight goes to
// the signature, not the noise. When the queue is empty the block does not exist — no empty-state
// theater.
//
// Honesty rails preserved from the old ApprovalCard: social/video drafts are COPY-FIRST (we never
// post to the founder's accounts or generate on their credits — they copy the draft and act;
// "Done" clears the item). Spend approvals say plainly they spend trial credits, not dollars.

import { AGENTS, type ApprovalItem, type ApprovalKind } from "@/lib/engine/types";
import { rationaleFor } from "@/lib/engine/rationale";
import { useCopy } from "@/components/useCopy";

const SOCIAL_KINDS: ApprovalKind[] = ["twitter", "linkedin", "bluesky", "mastodon", "reddit"];

const KIND_LABEL: Partial<Record<ApprovalKind, string>> = {
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
  bluesky: "Bluesky",
  mastodon: "Mastodon",
  reddit: "Reddit",
  video: "Video ad",
  spend: "Spend",
  deploy: "Deploy",
  outreach: "Outreach",
  delete: "Delete",
};

const BTN_PRIMARY =
  "border border-text bg-text px-3.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-bg transition hover:bg-bg hover:text-text";
const BTN_SECONDARY =
  "border border-border px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition hover:border-text hover:bg-text hover:text-bg";

export function DecisionBlock({ approvals, onResolve }: { approvals: ApprovalItem[]; onResolve: (id: string, approve: boolean) => void }) {
  if (approvals.length === 0) return null;
  return (
    <section aria-label="Decisions waiting on you" className="border-[1.5px] border-text bg-bg">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-4 py-2.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text">
          Needs you — {approvals.length} decision{approvals.length === 1 ? "" : "s"}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-2">the only block that waits on a human</span>
      </div>
      <div className="divide-y divide-border">
        {approvals.map((ap) => (
          <DecisionItem key={ap.id} ap={ap} onResolve={onResolve} />
        ))}
      </div>
    </section>
  );
}

function DecisionItem({ ap, onResolve }: { ap: ApprovalItem; onResolve: (id: string, approve: boolean) => void }) {
  const { copied, copy } = useCopy(2000);
  const isVideo = ap.kind === "video";
  const isSocial = SOCIAL_KINDS.includes(ap.kind) || isVideo;
  const why = rationaleFor(ap.agent, ap.title, ap.detail);
  return (
    <div className="p-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text">{AGENTS[ap.agent].name}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-2">{AGENTS[ap.agent].label} · night {ap.night}</span>
        {KIND_LABEL[ap.kind] && (
          <span className="ml-auto border border-border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">{KIND_LABEL[ap.kind]}</span>
        )}
      </div>
      <div className="mt-1.5 text-sm font-semibold text-text">{ap.title}</div>
      {isSocial ? (
        <pre className="mt-2 whitespace-pre-wrap border border-border bg-surface-2 p-3 font-sans text-xs leading-relaxed text-muted">{ap.detail}</pre>
      ) : (
        <p className="mt-1 text-xs leading-relaxed text-muted">{ap.detail}</p>
      )}
      {ap.kind === "spend" && (
        <p className="mt-2 border border-border px-2.5 py-1.5 text-[11px] leading-relaxed text-muted-2">
          Approving spends <span className="font-medium text-muted">trial credits</span> (play-money), never real dollars. It becomes real
          spend on your <em>own</em> connected account only when you open the payment gates.
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {isSocial ? (
          <>
            <button onClick={() => copy(ap.detail)} className={BTN_PRIMARY}>
              {copied ? "Copied" : isVideo ? "Copy brief" : "Copy post"}
            </button>
            <button onClick={() => onResolve(ap.id, true)} className={BTN_SECONDARY}>Done</button>
            <button onClick={() => onResolve(ap.id, false)} className={BTN_SECONDARY}>Skip</button>
          </>
        ) : (
          <>
            <button onClick={() => onResolve(ap.id, true)} className={BTN_PRIMARY}>{ap.kind === "spend" ? "Approve spend" : "Approve"}</button>
            <button onClick={() => onResolve(ap.id, false)} className={BTN_SECONDARY}>Hold</button>
          </>
        )}
        <span
          title={`${why.why} Principle: ${why.principle}`}
          className="ml-auto cursor-help font-mono text-[10px] uppercase tracking-[0.16em] text-muted-2 underline decoration-dotted underline-offset-2"
        >
          why?
        </span>
      </div>
    </div>
  );
}
