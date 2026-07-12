"use client";

import { motion } from "framer-motion";
import { Check, Copy, X } from "lucide-react";
import { type AgentRole, type ApprovalKind } from "@/lib/engine/types";
import { ROLE_TITLE } from "@/lib/org/role-titles";
import { useCopy } from "@/components/useCopy";

// Copy-first kinds: WE never post to the founder's accounts or generate on their credits — they
// copy the draft/brief and act themselves ("Done" just clears the approval). "video" is the
// claymation-film creative brief (script + shot prompts); generating is theirs, and RUNNING it as
// a paid ad routes through a separate spend approval — always.
const SOCIAL_KINDS: ApprovalKind[] = ["twitter", "linkedin", "bluesky", "mastodon", "reddit"];

export function ApprovalCard({ title, detail, agent, kind, onApprove, onReject }: { title: string; detail: string; agent: AgentRole; kind?: ApprovalKind; onApprove: () => void; onReject: () => void }) {
  const { copied, copy: copyText } = useCopy(2000);
  const isVideo = kind === "video";
  const isSocial = (kind && SOCIAL_KINDS.includes(kind)) || isVideo;
  const kindLabel = kind === "twitter" ? "X / Twitter" : kind === "linkedin" ? "LinkedIn" : kind === "bluesky" ? "Bluesky" : kind === "mastodon" ? "Mastodon" : kind === "reddit" ? "Reddit" : isVideo ? "Video ad" : null;

  const copyPost = () => copyText(detail);

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-coral/30 bg-coral/[0.05] p-4">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wide text-muted-2">{ROLE_TITLE[agent]} · needs your ok</div>
        {kindLabel && <div className="rounded-md bg-coral/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-coral">{kindLabel}</div>}
      </div>
      <div className="mt-1 text-sm font-semibold">{title}</div>
      {isSocial ? (
        <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-border bg-bg/60 p-3 text-xs text-muted font-sans leading-relaxed">{detail}</pre>
      ) : (
        <p className="mt-1 text-xs text-muted">{detail}</p>
      )}
      {kind === "spend" && (
        <p className="mt-2 rounded-lg border border-border bg-bg/50 px-2.5 py-1.5 text-[11px] leading-relaxed text-muted-2">
          Approving spends <span className="font-medium text-muted">trial credits</span> (play-money), never real dollars. It becomes real spend on your <em>own</em> connected account only when you open the payment gates.
        </p>
      )}
      <div className="mt-3 flex gap-2">
        {isSocial ? (
          <>
            <button onClick={copyPost} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-coral py-2 text-xs font-semibold text-bg transition hover:brightness-110">
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied!" : isVideo ? "Copy brief" : "Copy post"}
            </button>
            <button onClick={onApprove} className="inline-flex items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition hover:text-text">
              <Check size={13} /> Done
            </button>
            <button onClick={onReject} className="inline-flex items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition hover:text-text">
              <X size={13} /> Skip
            </button>
          </>
        ) : (
          <>
            <button onClick={onApprove} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-coral py-2 text-xs font-semibold text-bg transition hover:brightness-110">
              <Check size={13} /> {kind === "spend" ? "Approve spend" : "Approve"}
            </button>
            <button onClick={onReject} className="inline-flex items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition hover:text-text">
              <X size={13} /> Reject
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
