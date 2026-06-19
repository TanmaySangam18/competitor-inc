import { runAction, capabilities } from "@/lib/roomie/execution";

// Runs a real, gated agent action (build / deploy / outreach / spend / payments / delete) server-side.
// Every executor is OFF unless its key is set, in which case it returns { disabled: true } and the
// client keeps its simulated behavior. Defensive: never throws a 5xx at the client.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const b = (body ?? {}) as {
    action?: unknown;
    company?: { name?: unknown; idea?: unknown };
    item?: { kind?: unknown; title?: unknown; detail?: unknown; amount?: unknown };
    ownerEmail?: unknown;
  };
  const action = typeof b.action === "string" ? b.action : "";
  if (!action) return Response.json({ ok: false, error: "no action" }, { status: 400 });

  const company = { name: String(b.company?.name ?? ""), idea: String(b.company?.idea ?? "") };
  const item = b.item && typeof b.item === "object"
    ? {
        kind: String(b.item.kind ?? ""),
        title: typeof b.item.title === "string" ? b.item.title : undefined,
        detail: typeof b.item.detail === "string" ? b.item.detail : undefined,
        amount: typeof b.item.amount === "number" ? b.item.amount : undefined,
      }
    : undefined;
  const ownerEmail = typeof b.ownerEmail === "string" ? b.ownerEmail : undefined;

  try {
    const result = await runAction(action, { company, item, ownerEmail });
    return Response.json(result);
  } catch (err) {
    console.error("[/api/execute] error:", err instanceof Error ? err.message : "unknown");
    return Response.json({ ok: false, error: "execution error" }); // 200 — never 5xx the client
  }
}

// Lets the UI show which integrations are live (which keys are set).
export function GET() {
  return Response.json({ capabilities: capabilities() });
}
