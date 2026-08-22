// ─────────────────────────────────────────────────────────────────────────────
// TOOLS — what an agent can actually DO, scoped to the role that owns the work.
//
// An agent that can only describe a change is a chatbot. An agent that can do anything is a hazard.
// So access is per-role, derived from the role's own responsibilities: the Product Designer owns
// "design-system tokens", so the Product Designer gets the token tool and nobody else does. That is
// the same governance idea the rest of the company runs on, applied to conversation.
//
// The protocol is deliberately dumb. The agent ends its reply with one fenced block:
//     ```action
//     {"tool":"design.set","changes":[{"name":"--color-bg","to":"#1a1a1a"}]}
//     ```
// We parse exactly that, validate against the tool's own schema, and refuse anything else. No
// free-form function calling, no eval, no shell. The parser is the security boundary and it is small
// enough to read in one sitting.
// ─────────────────────────────────────────────────────────────────────────────

import { applyChanges, paletteSummary, readTokens, type TokenChange } from "./design-tokens";
import { plan } from "@/lib/core/plan";
import { fullstackConfigured } from "@/lib/engine/fullstack-build";
import { coverageReport } from "@/lib/org/coverage";
import { getRole, ROLES } from "@/lib/org/organization";
import { getAgent, type Agent } from "./agents";

export type ToolId = "design.read" | "design.set" | "org.coverage" | "org.who" | "build.plan" | "build.start";

export interface ToolSpec {
  id: ToolId;
  /** Role ids allowed to call it. Empty means every agent may. */
  allowedRoles: readonly string[];
  describe: string;
  /** Does calling it change something? */
  mutates: boolean;
  /**
   * Tier 3: the founder signs, always. A tool marked here NEVER executes from an agent's own block.
   * It returns a proposal that the founder has to approve, which is goal step 5 ("agents build, ask
   * to check, human approves") expressed as a type rather than as a promise.
   */
  needsFounder?: boolean;
}

export const TOOLS: readonly ToolSpec[] = [
  { id: "design.read", allowedRoles: ["product-designer", "head-of-product"], mutates: false,
    describe: `design.read — read every current design token. No arguments.` },
  { id: "design.set", allowedRoles: ["product-designer"], mutates: true,
    describe: `design.set — change design token values. Arguments: {"changes":[{"name":"--color-bg","to":"#1a1a1a"}]}. Only existing --color-* / --ripple-* tokens, and only hex / rgb / rgba / hsl / hsla / transparent values.` },
  { id: "org.coverage", allowedRoles: [], mutates: false,
    describe: `org.coverage — the measured share of company work that runs unattended. No arguments.` },
  { id: "org.who", allowedRoles: [], mutates: false,
    describe: `org.who — look up which colleague owns something. Arguments: {"roleId":"qa-lead"}. Ids are kebab-case job titles like qa-lead, frontend-engineer, product-designer. A near miss returns the closest ids, so guess and refine.` },
  // PLANNING IS KEYLESS. It is deterministic and needs no model and no vendor, so a prompt turns into
  // real work with named owners tonight, whether or not anything is connected.
  { id: "build.plan", allowedRoles: ["chief-of-staff", "head-of-product", "engineering-lead", "program-manager"], mutates: false,
    describe: `build.plan — turn a goal into a real ordered plan with named owners and the sign-off chain. Arguments: {"goal":"a tool that ..."}.` },
  // BUILDING IS NOT. It spends money, writes to a repo and deploys, so it is the founder's call.
  { id: "build.start", allowedRoles: ["engineering-lead"], mutates: true, needsFounder: true,
    describe: `build.start — actually build and deploy a product. Arguments: {"goal":"..."}. This ALWAYS goes to the founder for approval first; you never start one yourself.` },
] as const;

export function toolsFor(agentId: string): ToolSpec[] {
  return TOOLS.filter((t) => t.allowedRoles.length === 0 || t.allowedRoles.includes(agentId));
}

/** The tool section of an agent's system prompt. Absent entirely when a role has no tools. */
export function toolPrompt(agentId: string): string {
  const mine = toolsFor(agentId);
  if (!mine.length) return "";
  return [
    ``,
    `TOOLS YOU CAN ACTUALLY RUN. To use one, end your reply with a single fenced block exactly like this:`,
    "```action",
    `{"tool":"<id>", ...arguments}`,
    "```",
    `Say in plain words what you are about to do BEFORE the block. Use a tool only when the founder asked for the change, never speculatively. One block per reply.`,
    ...mine.map((t) => `  - ${t.describe}`),
  ].join("\n");
}

// ── The parser. The security boundary. ───────────────────────────────────────

export type ParsedCall = { tool: string; args: Record<string, unknown> } | null;

/**
 * Pull the single trailing action block out of a reply. Returns null for anything malformed, which
 * is treated as "the agent just talked" rather than as an error: a mangled block must never become a
 * guessed action.
 */
export function parseAction(reply: string): ParsedCall {
  const m = reply.match(/```action\s*\n([\s\S]*?)\n?```/);
  if (!m) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(m[1].trim());
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.tool !== "string" || !obj.tool) return null;
  const { tool, ...args } = obj;
  return { tool, args };
}

/** The reply with the action block stripped, which is what a person should read. */
export function stripAction(reply: string): string {
  return reply.replace(/```action\s*\n[\s\S]*?\n?```/, "").trim();
}

export interface ToolResult {
  tool: string;
  ok: boolean;
  summary: string;
  /** Set when the tool changed something, so the UI can say so loudly. */
  mutated?: boolean;
  /**
   * Set instead of acting when the tool is founder-signed. Nothing has happened yet: this is the
   * request for a signature, and the UI renders it as a card with Approve and Decline.
   */
  proposal?: { tool: string; what: string; detail: string; because: string; args: Record<string, unknown> };
  /**
   * Set once an approved build has cleared every gate and the caller should now actually dispatch it.
   * Present ONLY on the approved path, so its existence is itself the proof that a human signed.
   */
  dispatch?: { goal: string };
}

/**
 * Run a parsed call as a specific agent. Every refusal path returns ok:false with a reason the agent
 * can read back to the founder, because "it didn't work" is not an acceptable thing for a colleague
 * to say.
 */
export function runTool(agentId: string, call: ParsedCall): ToolResult | null {
  if (!call) return null;
  const agent = getAgent(agentId);
  if (!agent) return { tool: call.tool, ok: false, summary: `No such agent: ${agentId}.` };

  const spec = TOOLS.find((t) => t.id === call.tool);
  if (!spec) return { tool: call.tool, ok: false, summary: `There is no tool called "${call.tool}".` };
  if (!toolsFor(agentId).some((t) => t.id === spec.id)) {
    const owners = spec.allowedRoles.map((r) => getRole(r)?.title ?? r).join(" or ");
    return { tool: spec.id, ok: false, summary: `The ${agent.title} is not allowed to run ${spec.id}. That belongs to the ${owners}.` };
  }

  // THE TIER-3 GATE. Checked before the switch so no future case can accidentally bypass it: a
  // founder-signed tool returns a proposal and NOTHING runs. There is deliberately no argument that
  // turns this off, which is the same shape as the six hard-stops.
  if (spec.needsFounder) {
    const role = getRole(agentId);
    return {
      tool: spec.id,
      ok: true,
      summary: `Waiting on your approval. Nothing has run.`,
      proposal: {
        tool: spec.id,
        what: spec.id === "build.start" ? `Build and deploy: ${String(call.args.goal ?? "").slice(0, 160)}` : spec.id,
        detail: spec.describe,
        because: role?.humanApprovalFor.length
          ? `The ${agent.title} needs your sign-off for: ${role.humanApprovalFor.join(", ")}.`
          : `This spends money and publishes something, so it is yours to sign.`,
        args: call.args,
      },
    };
  }

  switch (spec.id) {
    case "design.read":
      return { tool: spec.id, ok: true, summary: paletteSummary() };

    case "design.set": {
      const raw = call.args.changes;
      if (!Array.isArray(raw) || raw.length === 0) {
        return { tool: spec.id, ok: false, summary: `design.set needs a non-empty "changes" array.` };
      }
      const changes: TokenChange[] = [];
      for (const c of raw) {
        if (!c || typeof c !== "object") return { tool: spec.id, ok: false, summary: `Each change must be an object with "name" and "to".` };
        const o = c as Record<string, unknown>;
        if (typeof o.name !== "string" || typeof o.to !== "string") {
          return { tool: spec.id, ok: false, summary: `Each change needs a string "name" and a string "to".` };
        }
        changes.push({ name: o.name, to: o.to });
      }
      const res = applyChanges(changes);
      if (!res.ok) {
        const why = res.results.filter((r) => !r.ok).map((r) => (r.ok ? "" : `${r.name}: ${r.reason}`)).join(" ");
        return { tool: spec.id, ok: false, summary: `Nothing was changed. ${why}` };
      }
      const applied = res.results.map((r) => (r.ok ? `${r.name} ${r.from} to ${r.to}` : "")).filter(Boolean);
      return { tool: spec.id, ok: true, mutated: true, summary: `Changed ${applied.length}: ${applied.join("; ")}. Reload to see it.` };
    }

    case "org.coverage": {
      const c = coverageReport();
      return {
        tool: spec.id, ok: true,
        summary: `${c.coverageOfAutomatableWork}% of automatable company work runs unattended, counted across ${c.total} functions. ${c.humanOnly} stay human by design and ${c.uncovered} are not covered yet.`,
      };
    }

    case "build.plan": {
      const goal = typeof call.args.goal === "string" ? call.args.goal.trim() : "";
      if (!goal) return { tool: spec.id, ok: false, summary: `build.plan needs a "goal" string.` };
      if (goal.length > 500) return { tool: spec.id, ok: false, summary: `That goal is too long. Keep it under 500 characters.` };
      const p = plan(goal);
      // orgTitle is the POSITION NAME, which is what the founder mandate says to show ("names are
      // positions"). Fall back to the execution role only when a task has no org attribution.
      const head = p.tasks.slice(0, 8).map((t, i) => `${i + 1}. ${t.goal} (${t.orgTitle ?? t.role})`);
      return {
        tool: spec.id,
        ok: true,
        summary: [
          `${p.tasks.length} tasks, owners assigned:`,
          ...head,
          p.tasks.length > head.length ? `and ${p.tasks.length - head.length} more.` : "",
          ``,
          `Sign-off chain: ${p.chain.slice(0, 4).join(" then ")}`,
        ].filter(Boolean).join("\n"),
      };
    }

    // build.start never reaches here: the Tier-3 gate above returns a proposal first. The case exists
    // so the switch is exhaustive and a future edit cannot silently drop it.
    case "build.start":
      return { tool: spec.id, ok: false, summary: `build.start is founder-signed and cannot run directly.` };

    case "org.who": {
      const q = (typeof call.args.roleId === "string" ? call.args.roleId : "").trim().toLowerCase();
      if (!q) return { tool: spec.id, ok: false, summary: `org.who needs a "roleId".` };
      const exact = getRole(q);
      if (exact) {
        return { tool: spec.id, ok: true, summary: `${exact.title} (${exact.department}) owns: ${exact.mandate} Escalates when: ${exact.escalatesWhen}` };
      }
      // A DEAD-END REFUSAL IS A DEFECT, observed 2026-08-22: an agent asked for "frontend", got
      // "no colleague with id frontend", and had no way to recover because it could not see the
      // valid ids. Near-matches turn a dead end into the next step, which is the whole point.
      const near = ROLES.filter((r) => {
        const hay = `${r.id} ${r.title} ${r.department}`.toLowerCase();
        return q.split(/[\s-]+/).some((w) => w.length > 2 && hay.includes(w));
      }).slice(0, 6);
      return near.length
        ? { tool: spec.id, ok: false, summary: `No colleague with id "${q}". Closest matches: ${near.map((r) => `${r.id} (${r.title})`).join(", ")}. Ask again with one of those ids.` }
        : { tool: spec.id, ok: false, summary: `No colleague with id "${q}", and nothing close. There are ${ROLES.length} colleagues across ${new Set(ROLES.map((r) => r.department)).size} departments.` };
    }
  }
}

/** Facts worth putting in front of an agent before it answers. Only measured ones. */
export function contextFor(agent: Agent): string {
  const bits: string[] = [];
  const c = coverageReport();
  bits.push(`Measured coverage: ${c.coverageOfAutomatableWork}% of automatable work automated, across ${c.total} company functions.`);
  bits.push(`Company revenue: $0 settled. Customers: zero. Users outside the founder: zero.`);
  if (toolsFor(agent.id).some((t) => t.id.startsWith("design"))) {
    bits.push(`Current design tokens (${readTokens().length} total) are readable with design.read.`);
  }
  return bits.join("\n");
}

/**
 * RUN AN APPROVED PROPOSAL. The only path by which a founder-signed tool actually executes, and it
 * is reachable only after the founder has said yes to a specific proposal.
 *
 * Kept separate from runTool on purpose: runTool is what an AGENT can reach, and it can never get
 * here. Two functions with two callers is a boundary you can see; one function with a boolean is a
 * boundary you have to trust.
 */
export function runApproved(agentId: string, tool: string, args: Record<string, unknown>): ToolResult {
  const spec = TOOLS.find((t) => t.id === tool);
  if (!spec) return { tool, ok: false, summary: `There is no tool called "${tool}".` };
  if (!spec.needsFounder) {
    // A non-signed tool has no business coming through the approval door.
    return { tool, ok: false, summary: `${tool} does not need approval. Ask the agent to run it.` };
  }
  if (!toolsFor(agentId).some((t) => t.id === spec.id)) {
    return { tool, ok: false, summary: `${getAgent(agentId)?.title ?? agentId} is not allowed to run ${tool}.` };
  }

  if (spec.id === "build.start") {
    const goal = typeof args.goal === "string" ? args.goal.trim() : "";
    if (!goal) return { tool, ok: false, summary: `Nothing to build: the goal is empty.` };

    // The honest configuration check. Naming BOTH missing pieces matters: "not configured" sends
    // someone hunting, and the whole point of this company is that a refusal tells you what to do.
    if (!fullstackConfigured()) {
      const missing: string[] = [];
      if (process.env.FULLSTACK_BUILDS !== "1") missing.push("FULLSTACK_BUILDS=1");
      if (!process.env.GITHUB_TOKEN) missing.push("GITHUB_TOKEN (a token with repo and workflow scope)");
      return {
        tool,
        ok: false,
        summary: `Approved, but I cannot build yet. Missing: ${missing.join(" and ")}. Add them to .env.local and restart, then approve again. Nothing was started and nothing was spent.`,
      };
    }

    // Reached only when builds are configured AND the route has already identified the caller
    // (lib/workspace/who.ts). Dispatch is still the caller's job rather than this pure module's: the
    // actual GitHub call is async and this function is deliberately synchronous and side-effect free
    // so it stays exhaustively testable.
    return {
      tool,
      ok: true,
      mutated: true,
      summary: `Approved and ready to dispatch: ${goal}`,
      dispatch: { goal },
    };
  }

  return { tool, ok: false, summary: `${tool} has no approved-execution path yet.` };
}
