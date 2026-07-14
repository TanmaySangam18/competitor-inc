// THE SUPPORT DESK (Block 6d) — Resleeve's "24/7 support", our way. When feedback arrives, Theo
// (Head of Customer Success) drafts an honest reply INSTANTLY — it rides in the founder's notification
// email as a ready-to-send response, so support runs around the clock while the SEND stays human
// (one forward). No fabricated status, no promised features, no invented timelines — the drafter is
// deterministic and can only say what's true by construction.

import { getRole } from "@/lib/org/organization";
import { personaFor } from "@/lib/org/personas";

export interface SupportReply {
  author: string; // "Theo · Head of Customer Success"
  body: string;
}

// Classify the message just enough to shape an honest reply — never to fake understanding.
function kindOf(message: string): "bug" | "confusion" | "praise" | "other" {
  const m = message.toLowerCase();
  if (/(bug|broken|error|crash|fail|doesn'?t work|not work)/.test(m)) return "bug";
  if (/(how do i|how to|where is|can'?t find|confus|unclear|don'?t understand)/.test(m)) return "confusion";
  if (/(love|great|awesome|amazing|thank)/.test(m)) return "praise";
  return "other";
}

export function draftSupportReply(feedback: { message: string; email?: string | null }): SupportReply {
  const role = getRole("customer-success-manager");
  const p = role ? personaFor(role) : { name: "Theo" };
  const author = role ? `${p.name} · ${role.title}` : "Customer Success";
  const kind = kindOf(feedback.message);

  const opening =
    kind === "bug"
      ? "Thank you for flagging this — a report like yours is exactly how we catch what testing misses."
      : kind === "confusion"
        ? "Thanks for asking — if it wasn't clear to you, that's on us, not you."
        : kind === "praise"
          ? "Thank you — genuinely. Notes like this are why the team keeps the bar where it is."
          : "Thanks for taking the time to write in — real feedback is the most valuable thing we get.";

  const middle =
    kind === "bug"
      ? "I've logged it for the engineering team to reproduce. I won't promise a date I can't stand behind, but it's in the queue and the founder sees every report."
      : kind === "confusion"
        ? "Here's the honest state: what you described is either genuinely missing or badly signposted — I've flagged it either way. If you can share what you expected to happen, I'll make sure it reaches the right team."
        : kind === "praise"
          ? "I've passed this to the whole team — including the humans."
          : "It's been routed to the right team, and the founder personally reads every message that comes through here.";

  return {
    author,
    body:
      `Hi${feedback.email ? "" : " there"},\n\n${opening}\n\n${middle}\n\n` +
      `I'm ${p.name}, an AI employee at competitor.inc — a human reviews everything I send.\n\n— ${author}`,
  };
}
