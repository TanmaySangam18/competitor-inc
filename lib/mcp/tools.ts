// ─────────────────────────────────────────────────────────────────────────────
// THE GOVERNED TOOL SURFACE — how the autonomous company exposes itself to a caller
// (e.g. Rowboat, via MCP), with the human-principal gate on EVERY request.
//
// This is system #7 (human approval workflows) + #3/#4 (specialized agents / planning) made concrete
// as one callable contract. A coworker (Rowboat) or any MCP client asks the company to do something;
// autonomous, low-risk work executes; anything legally reserved to the human is PREPARED and routed for
// approval — never done autonomously. This is the "Zuckerberg gets a Slack summary to approve" model,
// as code. Pure + deterministic so it's unit-tested; the live MCP transport is a thin shell on top.
// ─────────────────────────────────────────────────────────────────────────────

export interface ToolDef {
  name: string;
  description: string;
  /** field → doc/type, for the MCP inputSchema the transport shell will generate. */
  input: Record<string, string>;
  requires: string[]; // required input fields (deny-by-default validation)
}

// What the company offers a caller. Building/operating/answering are autonomous; business actions PREPARE.
export const COMPETITOR_TOOLS: readonly ToolDef[] = [
  { name: "build_and_run_software", description: "Describe software; the governed AI org builds, reviews, deploys, and runs it — returns a verifiable receipt.", input: { goal: "string", groundOn: "string[]?" }, requires: ["goal"] },
  { name: "grounded_query", description: "Answer a question from the company's own records only — cite sources or abstain, never guess.", input: { question: "string" }, requires: ["question"] },
  { name: "operate_product", description: "Run, monitor, and maintain an already-built product.", input: { productId: "string" }, requires: ["productId"] },
  { name: "prepare_business_action", description: "Draft a contract / invoice / campaign / report for the human principal to approve — never executes it.", input: { kind: "string", details: "string" }, requires: ["kind", "details"] },
] as const;

// Actions legally reserved to the human principal — the org may PREPARE these, never perform them.
export const HUMAN_RESERVED = [
  "sign_contract", "approve_payment", "move_money", "hire", "fire",
  "tax_filing", "legal_signoff", "policy_change", "delete_data", "share_externally",
] as const;

export type ToolOutcome =
  | { status: "done"; tool: string; note: string }
  | { status: "approval_required"; tool: string; action: string; summary: string }
  | { status: "denied"; tool: string; reason: string };

export interface ToolRequest {
  name: string;
  input: Record<string, unknown>;
  /** if the request would trigger a reserved action, name it here so the gate can catch it. */
  requestedAction?: string;
}

export function isReserved(action?: string): action is (typeof HUMAN_RESERVED)[number] {
  return !!action && (HUMAN_RESERVED as readonly string[]).includes(action);
}

/**
 * The single gate every request passes. Order matters:
 *   1. unknown tool → denied
 *   2. missing required input → denied (deny-by-default, fail-closed)
 *   3. a human-reserved action (or the prepare_* tool) → approval_required (prepared, never executed)
 *   4. otherwise → done (the org executes autonomously within governance)
 */
export function dispatchTool(req: ToolRequest): ToolOutcome {
  const tool = COMPETITOR_TOOLS.find((t) => t.name === req.name);
  if (!tool) return { status: "denied", tool: req.name, reason: "unknown tool" };

  for (const field of tool.requires) {
    const v = req.input?.[field];
    if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
      return { status: "denied", tool: req.name, reason: `missing required field: ${field}` };
    }
  }

  // The human-principal floor — non-bypassable.
  if (isReserved(req.requestedAction)) {
    return { status: "approval_required", tool: req.name, action: req.requestedAction, summary: `Prepared "${req.requestedAction}" for human approval — the org will NOT perform it autonomously.` };
  }
  if (req.name === "prepare_business_action") {
    const kind = String(req.input.kind);
    return { status: "approval_required", tool: req.name, action: kind, summary: `Drafted a ${kind} for the human principal to review and approve.` };
  }

  return { status: "done", tool: req.name, note: "executed autonomously within governance" };
}
