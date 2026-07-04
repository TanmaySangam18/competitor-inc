// Honest reversibility — the truth about whether an action can actually be undone.
//
// The old UI offered a "undo" button on every done action with a cost, and the marketing said
// "one-click undo." That's an overclaim: a sent email can't be recalled, and ad spend can't be
// returned. This classifier is the single source of truth the UI uses to (a) offer a real undo only
// where a reversal genuinely exists, and (b) say plainly "can't recall" where it doesn't. It's pure
// and deterministic so the UI and any server-side reversal path agree on what's reversible.

import type { Activity } from "./types";

export type ReversalMethod =
  | "ledger" // internal action, no external side effect — safe to mark undone
  | "rollback_deploy" // a deploy/site can be rolled back to the previous version
  | "archive_repo" // a created repo can be archived/reverted
  | "delete_post" // a public post can be deleted (impressions may remain)
  | "none"; // truly irreversible — a sent email, committed ad spend

export interface Reversibility {
  reversible: boolean;
  method: ReversalMethod;
  reason: string;
}

const has = (s: string, words: string[]) => words.some((w) => s.includes(w));

export function reversibility(a: Activity): Reversibility {
  const action = (a.action || "").toLowerCase();
  const kind = a.proof?.kind;

  // 1) Truly irreversible external effects — the honest "no". Checked first: these verbs win.
  if (has(action, ["email", "e-mail", "emailed", "outreach", "reached out", "newsletter", "dm ", "sent a message", "messaged"])) {
    return { reversible: false, method: "none", reason: "A sent email can't be recalled — it's already in their inbox." };
  }
  // Specific ad tokens only — a bare "ad " would false-match "thread ", "lead ", "read ".
  if (has(action, ["ads", "advertis", "boosted the", "paid promotion", "ad spend", "ad campaign", "ran an ad", "placed an ad", "paid ad"])) {
    return { reversible: false, method: "none", reason: "Ad spend is committed — money already paid can't be returned." };
  }

  // 2) Deploys / builds — a real rollback exists (Vercel redeploy previous, GitHub archive/revert).
  if (kind === "build" || has(action, ["deployed", "deploy", "shipped the", "shipped to", "went live", "published the site", "launched the site", "pushed to prod"])) {
    return { reversible: true, method: "rollback_deploy", reason: "A deploy can be rolled back to the previous version (needs the connected host)." };
  }
  if (kind === "url" || has(action, ["created repo", "created the repo", "scaffolded"])) {
    return { reversible: true, method: "archive_repo", reason: "The site/repo can be taken down or archived (needs the connected account)." };
  }

  // 3) Public social posts — deletable, though people may have already seen it.
  if (has(action, ["posted", "tweet", "published a post", "shared on", "announced on"])) {
    return { reversible: true, method: "delete_post", reason: "The post can be deleted, though anyone who already saw it still did." };
  }

  // 4) Internal / no external side effect (analysis, drafts, proposals, closed experiments).
  if (a.cost === 0 || has(action, ["drafted", "proposed", "analyzed", "diagnosed", "planned", "closed experiment", "reviewed", "researched"])) {
    return { reversible: true, method: "ledger", reason: "Internal action — nothing left your systems, so it's safe to mark undone." };
  }

  // 5) Unknown action that cost real money — be honest: assume it may not be reversible.
  return { reversible: false, method: "none", reason: "This may have had a real external effect that can't be automatically reversed — check before assuming." };
}

/** Should the UI show a clickable undo? Only when a real reversal exists beyond a ledger flag. */
export function canOfferUndo(a: Activity): boolean {
  if (a.undone || a.status !== "done") return false;
  const r = reversibility(a);
  return r.reversible && r.method !== "ledger";
}
