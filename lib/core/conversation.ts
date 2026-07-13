// lib/core/conversation.ts — THE TEAM ROOM, made watchable.
//
// Turns a governed deliberation (deliberate.ts) into a CONVERSATION the customer can watch: the chair opens
// the room, each convened role weighs in, the chair calls the decision. Same honest scope as the underlying
// deliberation — the convening, the roles, their mandates, and the governed proceed/escalate call are REAL;
// the stances are mandate-derived until a model key wakes real reasoning (the `simulated` flag rides along).
// This is a PRESENTATION over the real Decision Record — it invents no dialogue that didn't happen.
//
// Two renderings, one source of truth: `conversationFrom` for the website (the /room feed + the cockpit),
// and `conversationSlackText` for a Slack channel post. Both keyless; Slack transmit wires at connect.

import { deliberate, type DecisionRecord, type Reasoner } from "./deliberate";

export interface Turn {
  order: number;
  roleId: string;
  title: string;
  initials: string;
  kind: "open" | "position" | "decision";
  text: string;
}

export interface Conversation {
  task: string;
  turns: Turn[];
  decision: DecisionRecord["decision"];
  decidedBy: string;
  simulated: boolean;
}

// Avatar initials from a role title: first letter of each word, up to three. "Chief Executive Officer" →
// "CEO", "Product Manager" → "PM", "Software Engineer" → "SE". Any of the 66 org titles resolves cleanly.
export function initialsOf(title: string): string {
  const letters = (title || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase();
  return letters.slice(0, 3) || "?";
}

// A Decision Record → a watchable conversation. The chair (positions[0]) opens and closes; the panel
// (positions[1..]) each state their stance. Deterministic: same record → same conversation.
export function conversationFrom(record: DecisionRecord): Conversation {
  const chair = record.positions[0];
  const panel = record.positions.slice(1);
  const turns: Turn[] = [];
  let order = 0;

  const chairTitle = chair?.title ?? record.decidedBy;
  const chairId = chair?.roleId ?? "chair";

  // Open — the chair frames what the room is deciding.
  turns.push({
    order: order++,
    roleId: chairId,
    title: chairTitle,
    initials: initialsOf(chairTitle),
    kind: "open",
    text: `Let's settle this: ${record.task || "(no task given)"}. Where does everyone land?`,
  });

  // Positions — each convened role weighs in with its real mandate-grounded stance.
  for (const p of panel) {
    turns.push({
      order: order++,
      roleId: p.roleId,
      title: p.title,
      initials: initialsOf(p.title),
      kind: "position",
      text: p.stance,
    });
  }

  // Decision — the chair calls it, governed. Escalate-to-founder is surfaced plainly, never hidden.
  const call = record.decision === "escalate-to-founder" ? "This one goes to the founder." : "We proceed.";
  turns.push({
    order: order++,
    roleId: chairId,
    title: chairTitle,
    initials: initialsOf(chairTitle),
    kind: "decision",
    text: `${call} ${record.rationale}`,
  });

  return {
    task: record.task,
    turns,
    decision: record.decision,
    decidedBy: record.decidedBy,
    simulated: record.simulated,
  };
}

// Convenience: deliberate a task AND render the room in one call (the API + CLI entry point).
export async function conversation(
  task: string,
  opts: { size?: number; reasoner?: Reasoner } = {},
): Promise<Conversation> {
  return conversationFrom(await deliberate(task, opts));
}

// The SAME conversation, formatted for a Slack channel post (plain text; no blocks dependency). Keyless —
// this only renders the text; the governed transmit (with a bot token) wires at the connect phase.
export function conversationSlackText(convo: Conversation): string {
  const header = `*Team room — ${convo.task || "(no task)"}*`;
  const body = convo.turns
    .map((t) => (t.kind === "decision" ? `\n:checkered_flag: *${t.title}:* ${t.text}` : `*${t.title}:* ${t.text}`))
    .join("\n");
  const foot = convo.simulated
    ? "\n_Structure + governance are real; live reasoning wakes when a model key is connected._"
    : "";
  return `${header}\n${body}${foot}`;
}
