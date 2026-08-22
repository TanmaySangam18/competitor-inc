// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES AND THREADS — the shape of a conversation, kept pure.
//
// No I/O here on purpose: the same model serves the in-memory store, the API route and the eventual
// database table, and a pure model is the only kind you can test exhaustively.
//
// The approval card is part of the message model rather than a separate system because that is where
// it has to appear. Goal step 5 is "agents build, ask to check, human approves" and an approval that
// lives on another screen is a second inbox the founder has to remember to visit.
// ─────────────────────────────────────────────────────────────────────────────

export type Author = { kind: "founder" } | { kind: "agent"; agentId: string; title: string };

export interface Message {
  id: string;
  channel: string;
  author: Author;
  text: string;
  createdAt: string; // ISO
  /**
   * Monotonic tiebreaker. `createdAt` alone is NOT enough: an agent replying inside the same
   * millisecond as the founder's message produced a genuinely unstable order (found by the test in
   * this file, not in review). Chat that reorders itself is broken chat, so ordering is explicit.
   */
  seq: number;
  parentId?: string; // set when this is a threaded reply
  /** Set when the agent is asking the founder to approve something before it happens. */
  approval?: {
    what: string;
    detail: string;
    /** Why this needs a human: quoted from the role's own humanApprovalFor / escalatesWhen. */
    because: string;
    state: "pending" | "approved" | "declined";
  };
  /** Set when the message reports something the agent actually DID, with its result. */
  action?: { tool: string; ok: boolean; summary: string };
}

let counter = 0;
/** One monotonic counter behind both ids and ordering, so the two can never disagree. */
function tick(): number {
  counter += 1;
  return counter;
}

/** Deterministic-enough ids without pulling in a uuid dependency. */
export function newId(prefix = "m"): string {
  return `${prefix}_${Date.now().toString(36)}_${tick().toString(36)}`;
}

/** The one comparator. Every ordered read in this module goes through it. */
export function byTime(a: Message, b: Message): number {
  return a.createdAt.localeCompare(b.createdAt) || a.seq - b.seq;
}

export function founderMessage(channel: string, text: string, parentId?: string): Message {
  return { id: newId(), channel, author: { kind: "founder" }, text, createdAt: new Date().toISOString(), seq: tick(), parentId };
}

export function agentMessage(
  channel: string,
  agentId: string,
  title: string,
  text: string,
  extra: Partial<Pick<Message, "parentId" | "approval" | "action">> = {}
): Message {
  return {
    id: newId(),
    channel,
    author: { kind: "agent", agentId, title },
    text,
    createdAt: new Date().toISOString(),
    seq: tick(),
    ...extra,
  };
}

/** Messages in a channel, oldest first, top-level only (thread replies nest under their parent). */
export function topLevel(messages: Message[], channel: string): Message[] {
  return messages.filter((m) => m.channel === channel && !m.parentId).sort(byTime);
}

export function repliesTo(messages: Message[], parentId: string): Message[] {
  return messages.filter((m) => m.parentId === parentId).sort(byTime);
}

/** Every approval still waiting on the founder. This is the thing that must never be silently long. */
export function pendingApprovals(messages: Message[]): Message[] {
  return messages.filter((m) => m.approval?.state === "pending");
}

/**
 * The last N turns of a channel, formatted for a model's context window. Oldest first so the model
 * reads it as a transcript. Titles rather than ids, because the agent should see "the QA Lead said"
 * exactly as a person would.
 */
export function transcriptFor(messages: Message[], channel: string, limit = 12): string {
  return messages
    .filter((m) => m.channel === channel)
    .sort(byTime)
    .slice(-limit)
    .map((m) => `${m.author.kind === "founder" ? "Founder" : m.author.title}: ${m.text}`)
    .join("\n");
}
