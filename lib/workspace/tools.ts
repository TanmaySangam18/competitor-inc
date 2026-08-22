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
import { coverageReport } from "@/lib/org/coverage";
import { getRole } from "@/lib/org/organization";
import { getAgent, type Agent } from "./agents";

export type ToolId = "design.read" | "design.set" | "org.coverage" | "org.who";

export interface ToolSpec {
  id: ToolId;
  /** Role ids allowed to call it. Empty means every agent may. */
  allowedRoles: readonly string[];
  describe: string;
  /** Does calling it change something the founder would want to have approved first? */
  mutates: boolean;
}

export const TOOLS: readonly ToolSpec[] = [
  { id: "design.read", allowedRoles: ["product-designer", "head-of-product"], mutates: false,
    describe: `design.read — read every current design token. No arguments.` },
  { id: "design.set", allowedRoles: ["product-designer"], mutates: true,
    describe: `design.set — change design token values. Arguments: {"changes":[{"name":"--color-bg","to":"#1a1a1a"}]}. Only existing --color-* / --ripple-* tokens, and only hex / rgb / rgba / hsl / hsla / transparent values.` },
  { id: "org.coverage", allowedRoles: [], mutates: false,
    describe: `org.coverage — the measured share of company work that runs unattended. No arguments.` },
  { id: "org.who", allowedRoles: [], mutates: false,
    describe: `org.who — look up which colleague owns something. Arguments: {"roleId":"qa-lead"}.` },
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

    case "org.who": {
      const id = typeof call.args.roleId === "string" ? call.args.roleId : "";
      const r = getRole(id);
      if (!r) return { tool: spec.id, ok: false, summary: `No colleague with id "${id}".` };
      return { tool: spec.id, ok: true, summary: `${r.title} (${r.department}) owns: ${r.mandate} Escalates when: ${r.escalatesWhen}` };
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
