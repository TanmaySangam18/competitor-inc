// lib/core/capabilities.ts — WHAT CAN THIS ORG DO RIGHT NOW, and what is the honest reason it cannot.
//
// THE A1 FIX (docs/NAIVE-GAP-LIST.md). We required four connections before anything ran: a model key,
// GitHub, hosting and a database. Naive and Wix require zero, Jules requires one, and onboarding was our
// worst measured number in the category.
//
// The diagnosis was not that we needed to hold customer credentials or pay vendor bills. It was a
// CATEGORY ERROR in the connection map: T0 conflated "what competitor.inc needs in order to run" with
// "what a shipped product needs in order to exist." Those are different questions.
//
//   - The org needs ONE thing to work: something to think with. That is the model key, and it cannot be
//     managed for the customer because inference is a real per-token cost and our API budget is zero.
//   - GitHub, hosting and a database are not needed to think, plan, research, deliberate, decide, draft
//     or produce a reviewable artifact. They are needed to COMMIT, to DEPLOY and to PERSIST.
//
// So the fix is honest re-tiering plus this module: capabilities are declared, each names the connections
// it needs, and the org runs every capability whose connections exist while saying plainly which ones are
// dark and why. One key gets a customer a working org. Each further key lights a specific, named ability.
//
// This is deliberately NOT the managed-credentials model our competitors use. Holding a customer's keys
// and paying their vendor bills is how you win onboarding and how you acquire a cost base we cannot
// carry. The graduation path stays open: if we ever can afford managed provisioning, a capability whose
// connections we supply is the same shape as one the customer supplies.

export type CapabilityId =
  | "think"
  | "commit"
  | "deploy"
  | "persist"
  | "store"
  | "publish"
  | "correspond"
  | "transact";

export interface Capability {
  id: CapabilityId;
  name: string;
  /** Connection ids from CONNECTION_MAP. ALL must be configured for the capability to be live. */
  needs: string[];
  /** What the customer can do once it is live. */
  gives: string;
  /** The honest line while it is dark. Never implies the org is broken, because it is not. */
  without: string;
}

/**
 * Ordered from "works with one key" outwards. The order is the onboarding story: think, then build, then
 * ship, then remember, then speak, then take money.
 */
export const CAPABILITIES: readonly Capability[] = [
  {
    id: "think",
    name: "Think",
    needs: ["ai-model"],
    gives: "Plan, research, deliberate, decide, draft, and produce artifacts you can read and sign.",
    without: "Nothing runs. A model key is the one thing that cannot be substituted, because inference is a real cost and we do not pay it on your behalf.",
  },
  {
    id: "commit",
    name: "Write code",
    needs: ["ai-model", "github"],
    gives: "Real code in a real repository, with commit history and CI you own.",
    without: "Builds are designed and reviewed but never committed. You get the plan and the diff to read, not a repo.",
  },
  {
    id: "deploy",
    name: "Ship it live",
    needs: ["ai-model", "github", "hosting"],
    gives: "A real URL, with previews, verification and rollback.",
    without: "Work stops at the repository. Nothing reaches a live address.",
  },
  {
    id: "persist",
    name: "Store product data",
    needs: ["ai-model", "database"],
    gives: "Products that keep data, isolated per tenant by row-level security.",
    without: "Only stateless products can ship. Anything that needs to remember a user cannot be built yet.",
  },
  {
    id: "store",
    name: "Handle files",
    needs: ["ai-model", "object-storage"],
    gives: "Uploads, images, documents and exports, with signed URLs rather than public buckets.",
    without: "Products cannot accept an upload or hand back a generated file.",
  },
  {
    id: "publish",
    name: "Publish outbound",
    needs: ["ai-model", "social"],
    gives: "Posts that actually reach a platform, each one through the publishing mandate first.",
    without: "Outbound is drafted and queued for approval but never sent. The draft is real; the reach is not.",
  },
  {
    id: "correspond",
    name: "Send mail",
    needs: ["ai-model", "email-sending"],
    gives: "Receipts, reports and support replies delivered from your own domain.",
    without: "Mail renders and queues. It does not leave the building.",
  },
  {
    id: "transact",
    name: "Take money",
    needs: ["ai-model", "payments"],
    gives: "A working checkout, so a product can have customers rather than users.",
    without: "No cash register. Everything downstream of revenue is a rehearsal.",
  },
] as const;

/**
 * THE HEADLINE NUMBER. One connection, not four. Everything else is additive and each addition names
 * exactly what it turns on, so nobody has to guess what a key buys them.
 */
export const MINIMUM_TO_START: readonly string[] = ["ai-model"] as const;

export interface CapabilityState extends Capability {
  live: boolean;
  /** Connection ids still absent. Empty when live. */
  missing: string[];
  /** `gives` when live, `without` when dark. One field the UI can print without branching. */
  line: string;
}

export interface CapabilityReport {
  /** True once the org can think, which is the only hard requirement. */
  ready: boolean;
  live: CapabilityState[];
  dark: CapabilityState[];
  /** One honest sentence for the front door. Never overstates and never sulks. */
  headline: string;
}

/** Resolve every capability against the connections actually configured in this deployment. */
export function capabilityStatus(configured: Iterable<string>): CapabilityReport {
  const have = new Set(configured);
  const states: CapabilityState[] = CAPABILITIES.map((c) => {
    const missing = c.needs.filter((n) => !have.has(n));
    const live = missing.length === 0;
    return { ...c, live, missing, line: live ? c.gives : c.without };
  });
  const live = states.filter((s) => s.live);
  const dark = states.filter((s) => !s.live);
  const ready = have.has("ai-model");

  const headline = !ready
    ? "Connect one model key and the org starts working. Nothing else is required to begin."
    : dark.length === 0
      ? "Every capability is live."
      : `${live.length} of ${states.length} capabilities are live. The rest are dark for a named reason, not a hidden one.`;

  return { ready, live, dark, headline };
}

/**
 * What is the single most useful next connection? Ranked by how many dark capabilities it unblocks
 * outright, so the answer to "what should I connect next" is derived rather than asserted.
 */
export function nextBestConnection(configured: Iterable<string>): { id: string; unlocks: CapabilityId[] } | null {
  const have = new Set(configured);
  const counts = new Map<string, CapabilityId[]>();
  for (const c of CAPABILITIES) {
    const missing = c.needs.filter((n) => !have.has(n));
    // Only count capabilities that ONE more connection would complete. Suggesting a key that leaves the
    // capability still dark is how onboarding checklists lose people.
    if (missing.length !== 1) continue;
    const id = missing[0];
    counts.set(id, [...(counts.get(id) ?? []), c.id]);
  }
  let best: { id: string; unlocks: CapabilityId[] } | null = null;
  for (const [id, unlocks] of [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (!best || unlocks.length > best.unlocks.length) best = { id, unlocks };
  }
  return best;
}
