import { COMPETITOR_TOOLS, dispatchTool, type ToolDef } from "@/lib/mcp/tools";

export const runtime = "nodejs";

// THE MCP TRANSPORT (Phase 4). Serves the governed company OS to any MCP client — the coworker app, or any
// agent — over JSON-RPC 2.0: initialize · tools/list · tools/call. Every call routes through the ONE gate
// (dispatchTool): unknown tool → denied, missing input → denied, human-reserved acts → approval_required
// (prepared, never executed), else done within governance. Keyless + no side effects here — this is the
// contract; the heavy execution wires behind the individual tools at the connect phase.

const SERVER = { name: "competitor.inc", version: "1" };

function toInputSchema(input: ToolDef["input"], requires: readonly string[]) {
  const properties: Record<string, { type: string }> = {};
  for (const [field, hint] of Object.entries(input)) {
    properties[field] = { type: hint.includes("[]") ? "array" : "string" };
  }
  return { type: "object", properties, required: [...requires] };
}

const rpc = (id: unknown, result: unknown) => Response.json({ jsonrpc: "2.0", id: id ?? null, result });
const rpcError = (id: unknown, code: number, message: string) =>
  Response.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

// Discovery for humans / health.
export async function GET() {
  return Response.json({
    ok: true,
    transport: "mcp",
    methods: ["initialize", "tools/list", "tools/call"],
    tools: COMPETITOR_TOOLS.map((t) => t.name),
  });
}

export async function POST(req: Request) {
  let body: { id?: unknown; method?: string; params?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return rpcError(null, -32700, "parse error");
  }
  const { id = null, method, params } = body ?? {};

  switch (method) {
    case "initialize":
      return rpc(id, { protocolVersion: "2024-11-05", serverInfo: SERVER, capabilities: { tools: {} } });

    case "tools/list":
      return rpc(id, {
        tools: COMPETITOR_TOOLS.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: toInputSchema(t.input, t.requires),
        })),
      });

    case "tools/call": {
      const name = String((params as { name?: unknown })?.name ?? "");
      const args = ((params as { arguments?: Record<string, unknown> })?.arguments ?? {}) as Record<string, unknown>;
      const requestedAction = (params as { requestedAction?: string })?.requestedAction;
      const outcome = dispatchTool({ name, input: args, requestedAction });
      const text =
        outcome.status === "done" ? `✓ ${outcome.tool}: ${outcome.note}`
        : outcome.status === "approval_required" ? `⛳ ${outcome.tool}: ${outcome.summary}`
        : `⛔ ${outcome.tool}: ${outcome.reason}`;
      return rpc(id, { content: [{ type: "text", text }], isError: outcome.status === "denied" });
    }

    default:
      return rpcError(id, -32601, `method not found: ${method ?? "(none)"}`);
  }
}
