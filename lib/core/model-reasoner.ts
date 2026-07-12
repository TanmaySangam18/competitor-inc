import type { Reasoner } from "./deliberate";
import { getRole } from "@/lib/org/organization";

// THE BRAIN, WIRED TO THE SOCKET. A model-backed reasoner for the deliberation seam: each participant
// speaks a real, reasoned stance from their own seat instead of a mandate template. Uses the engine's
// model layer (runChat, which routes to the real model when a key is present and falls back to the offline
// provider otherwise). Imported LAZILY (dynamic import of server.ts) so the CLI + tests never pull the
// heavy model layer — this only loads when a key is actually present (see deliberate's auto-select).
// Fail-soft: any error → the role's mandate, so a meeting never crashes.
export const modelReasoner: Reasoner = async ({ roleId, title, mandate, task }) => {
  try {
    const { runChat } = await import("@/lib/engine/server");
    const role = getRole(roleId);
    const agent = role?.execFn ?? "ceo";
    const soul =
      `You are ${title} at competitor.inc. Your mandate: ${mandate}. ` +
      `Give your honest position on the task from YOUR seat — what you'd do and the one risk you'd flag. ` +
      `Concrete, first person, ≤ 55 words. No preamble.`;
    const out = await runChat({ name: "competitor.inc", idea: task }, task, soul, undefined, agent);
    return (out || "").trim() || mandate;
  } catch {
    return mandate;
  }
};
