import { runChat, runShift, runValidate, realModelConfigured } from "@/lib/roomie/server";
import type { ByokConfig, Company } from "@/lib/roomie/types";

export const runtime = "nodejs";

// Health/status — confirms the engine is reachable and whether a real model is wired.
export async function GET() {
  return Response.json({
    ok: true,
    provider: process.env.ROOMIE_PROVIDER ?? "simulated",
    realModelConfigured: realModelConfigured(),
  });
}

type Body =
  | { kind: "validate"; idea: string; byok?: ByokConfig }
  | { kind: "shift"; company: Company; byok?: ByokConfig }
  | { kind: "chat"; company: { name: string; idea: string }; message: string; soul?: string; byok?: ByokConfig };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Body must be an object" }, { status: 400 });
  }

  try {
    if (body.kind === "validate") {
      if (typeof body.idea !== "string" || !body.idea.trim()) {
        return Response.json({ error: "`idea` (non-empty string) is required" }, { status: 400 });
      }
      const validation = await runValidate(body.idea.trim(), body.byok);
      return Response.json({ validation });
    }

    if (body.kind === "shift") {
      const c = body.company;
      if (
        !c || typeof c !== "object" ||
        typeof c.id !== "string" ||
        typeof c.idea !== "string" ||
        typeof c.night !== "number" ||
        !c.ledger || typeof c.ledger !== "object"
      ) {
        return Response.json({ error: "`company` (id, idea, night, ledger) is required" }, { status: 400 });
      }
      const result = await runShift(c, body.byok);
      return Response.json(result);
    }

    if (body.kind === "chat") {
      if (!body.company || typeof body.message !== "string" || !body.message.trim()) {
        return Response.json({ error: "`company` and `message` are required" }, { status: 400 });
      }
      const reply = await runChat(body.company, body.message.trim(), body.soul, body.byok);
      return new Response(streamText(reply), {
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
      });
    }

    return Response.json({ error: "Unknown `kind` (expected 'validate' | 'shift' | 'chat')" }, { status: 400 });
  } catch (err) {
    // Log only the message — never the raw error/body, since this path handles the BYOK key.
    console.error("[/api/roomie] engine error:", err instanceof Error ? err.message : "unknown");
    return Response.json({ error: "Engine failure" }, { status: 500 });
  }
}

// Streams a reply token-by-token so the chat feels live. (The model reply is resolved first,
// then streamed; swap to true model token-streaming when a provider key is set.)
function streamText(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const tokens = text.split(/(\s+)/).filter(Boolean);
  let i = 0;
  return new ReadableStream({
    async pull(controller) {
      if (i >= tokens.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(tokens[i++]));
      await new Promise((r) => setTimeout(r, 28));
    },
  });
}
