import { runChat, runShift, runValidate, realModelConfigured, detectChatApproval, streamChatReply } from "@/lib/engine/server";
import { capabilities } from "@/lib/engine/execution";
import { rateLimited, clientIp } from "@/lib/engine/ratelimit";
import type { ByokConfig, Company } from "@/lib/engine/types";

export const runtime = "nodejs";

// Health/status — confirms the engine is reachable and whether a real model is wired.
export async function GET() {
  return Response.json({
    ok: true,
    provider: process.env.MODEL_PROVIDER ?? "simulated",
    realModelConfigured: realModelConfigured(),
    capabilities: capabilities(),
  });
}

type Body =
  | { kind: "validate"; idea: string; nonce?: number; byok?: ByokConfig }
  | { kind: "shift"; company: Company; byok?: ByokConfig }
  | { kind: "chat"; company: { name: string; idea: string }; message: string; soul?: string; byok?: ByokConfig };

export async function POST(req: Request) {
  // Cost/abuse guard: soft per-IP rate limit. Active only on Vercel (real deployments) so the local
  // dev server + QA smoke harness aren't throttled. A 429 makes the clients fall back to the free
  // simulated engine, so a flooding IP can't keep spending model tokens.
  if (process.env.VERCEL && rateLimited(clientIp(req))) {
    return new Response("You're going a bit fast — give it a moment and try again.", {
      status: 429,
      headers: { "content-type": "text/plain; charset=utf-8", "retry-after": "60" },
    });
  }

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
      const salt = typeof body.nonce === "number" && Number.isFinite(body.nonce) ? String(body.nonce) : undefined;
      const validation = await runValidate(body.idea.trim(), body.byok, salt);
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
      const message = body.message.trim();
      // Consequential asks get a real ApprovalItem queued client-side; pass the seed in a header so
      // the reply can still stream. (encodeURIComponent keeps the value header-safe + unicode-safe.)
      const approval = detectChatApproval(message);
      const headers: Record<string, string> = {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      };
      if (approval) headers["x-approval"] = encodeURIComponent(JSON.stringify(approval));
      // Real model → stream its tokens as they arrive (model speed). No model / any failure →
      // fake-stream the simulated reply with a typewriter cadence so it still feels live.
      const live = await streamChatReply(body.company, message, body.soul, body.byok);
      const stream = live
        ? streamTokens(live)
        : streamText(await runChat(body.company, message, body.soul, body.byok));
      return new Response(stream, { headers });
    }

    return Response.json({ error: "Unknown `kind` (expected 'validate' | 'shift' | 'chat')" }, { status: 400 });
  } catch (err) {
    // Log only the message — never the raw error/body, since this path handles the BYOK key.
    console.error("[/api/engine] engine error:", err instanceof Error ? err.message : "unknown");
    return Response.json({ error: "Engine failure" }, { status: 500 });
  }
}

// Simulated path: the reply is already resolved, so fake-chunk it word-by-word with a small delay
// to mimic a live typewriter. (Used only when no real model is configured / it failed.)
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

// Real path: forward the model's token deltas as they arrive — no artificial delay (the model's own
// pace is the cadence). If the upstream stream drops mid-reply, end cleanly with what we have.
function streamTokens(gen: AsyncGenerator<string>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await gen.next();
        if (done) {
          controller.close();
          return;
        }
        if (value) controller.enqueue(encoder.encode(value));
      } catch {
        controller.close();
      }
    },
    async cancel() {
      await gen.return?.(undefined);
    },
  });
}
