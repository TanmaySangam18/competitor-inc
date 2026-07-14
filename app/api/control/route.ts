import { killSwitch, auditLog } from "@/lib/core";

export const runtime = "nodejs";

// /api/control — the out-of-band control plane surface (Tier A1).
//   GET  → status: the kill-switch state + the audit ledger's integrity + entry count. Read-only, keyless.
//   POST → throw/clear a switch. HUMAN-RESERVED: guarded by CONTROL_SECRET (a bearer that is NOT an agent
//          credential — out-of-band by design). Fails CLOSED: no secret configured, or a wrong/missing
//          bearer → 401. Every control action is written to the audit ledger as actor "human".
//
// Honest keyless caveat: with the in-memory sink each serverless invocation starts fresh, so state does not
// persist across requests in production until the durable store is wired at connect. The contract + the
// governance semantics are real and exercised in-process (tests, CLI, smoke).

type Op =
  | "engage_global" | "disengage_global" | "break_glass"
  | "stop_agent" | "resume_agent"
  | "freeze_customer" | "unfreeze_customer";

export async function GET() {
  return Response.json({
    ok: true,
    killSwitch: killSwitch.status(),
    audit: { ...auditLog.verifyIntegrity() },
  });
}

function authorized(req: Request): boolean {
  const secret = process.env.CONTROL_SECRET;
  if (!secret) return false; // fail closed: no secret configured → no mutations
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return token.length > 0 && token === secret;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return Response.json({ ok: false, error: "control is human-reserved — a valid CONTROL_SECRET bearer is required" }, { status: 401 });
  }

  let body: { op?: unknown; agent?: unknown; customer?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const op = String(body?.op ?? "") as Op;
  const agent = typeof body?.agent === "string" ? body.agent : undefined;
  const customer = typeof body?.customer === "string" ? body.customer : undefined;

  switch (op) {
    case "engage_global": killSwitch.engageGlobal(); break;
    case "disengage_global": killSwitch.disengageGlobal(); break;
    case "break_glass": killSwitch.breakGlass(); break;
    case "stop_agent": if (!agent) return Response.json({ ok: false, error: "agent required" }, { status: 400 }); killSwitch.stopAgent(agent); break;
    case "resume_agent": if (!agent) return Response.json({ ok: false, error: "agent required" }, { status: 400 }); killSwitch.resumeAgent(agent); break;
    case "freeze_customer": if (!customer) return Response.json({ ok: false, error: "customer required" }, { status: 400 }); killSwitch.freezeCustomer(customer); break;
    case "unfreeze_customer": if (!customer) return Response.json({ ok: false, error: "customer required" }, { status: 400 }); killSwitch.unfreezeCustomer(customer); break;
    default: return Response.json({ ok: false, error: `unknown op: ${op || "(none)"}` }, { status: 400 });
  }

  // Record the human control action to the black-box recorder.
  auditLog.record({
    actor: "human", action: `control:${op}`, customer, verdict: "done",
    input: agent ? `agent=${agent}` : undefined, rationale: "out-of-band control action",
  });

  return Response.json({ ok: true, op, killSwitch: killSwitch.status() });
}
