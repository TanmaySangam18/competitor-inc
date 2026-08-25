import { getRole } from "@/lib/org/organization";
import { routeMessage, agentPersona, getAgent } from "@/lib/workspace/agents";
import { getChannel, channels } from "@/lib/workspace/channels";
import { toolPrompt, parseAction, stripAction, runTool, runApproved, contextFor } from "@/lib/workspace/tools";
import { speakAsAgent } from "@/lib/engine/server";
import { authoriseApproval } from "@/lib/workspace/who";
import { saveMessage, loadChannel, firestoreConfigured } from "@/lib/engine/transcript-store";
import { realModelConfigured } from "@/lib/engine/server";

export const runtime = "nodejs";

// THE WORKSPACE DOOR (2026-08-22). POST a message into a channel; the colleague who owns that channel
// answers, and may run one of ITS OWN tools. This is goal step 4 ("give a prompt to the agents") with
// the Slack dependency removed: the prompt arrives here instead of through someone else's webhook.
//
// Honesty contract: when no model is reachable this returns modelConfigured:false and NO reply. It
// does not fabricate a colleague's answer. A simulated employee is exactly the thing this company
// exists not to ship.

export async function GET() {
  return Response.json({
    ok: true,
    capability: "workspace",
    modelConfigured: realModelConfigured(),
    channels: channels().map((c) => ({ id: c.id, purpose: c.purpose, members: c.memberCount, lead: c.lead?.title })),
    usage: 'POST { "channel": "#product", "text": "...", "history": "optional transcript" }',
  });
}

export async function POST(req: Request) {
  let body: { channel?: unknown; text?: unknown; history?: unknown; confirm?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  // THE APPROVAL DOOR. The founder signing a specific proposal. Separate from the message path
  // because an agent must not be able to reach it by writing a convincing sentence.
  if (body.confirm && typeof body.confirm === "object") {
    const c = body.confirm as Record<string, unknown>;
    const agentId = typeof c.agentId === "string" ? c.agentId : "";
    const tool = typeof c.tool === "string" ? c.tool : "";
    if (!agentId || !tool) {
      return Response.json({ ok: false, error: "confirm needs agentId and tool" }, { status: 400 });
    }
    const who = getAgent(agentId);
    if (!who) return Response.json({ ok: false, error: `no agent ${agentId}` }, { status: 400 });

    // WHO IS SIGNING. Checked before anything runs, and fail-closed: an approval from nobody is not
    // an approval. This is the gate that had to exist before build.start could ever dispatch.
    const caller = await authoriseApproval(req);
    if (!caller.ok) {
      return Response.json({ ok: false, error: caller.reason }, { status: 401 });
    }
    const args = c.args && typeof c.args === "object" && !Array.isArray(c.args) ? (c.args as Record<string, unknown>) : {};
    return Response.json({
      ok: true,
      speaker: { id: who.id, title: who.title, handle: who.handle, department: who.departmentName, why: `approved by ${caller.who}` },
      approvedBy: { who: caller.who, proof: caller.proof },
      action: runApproved(agentId, tool, args),
    });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length > 4000) {
    return Response.json({ ok: false, error: "text must be a non-empty string ≤ 4000 chars" }, { status: 400 });
  }

  const channelId = typeof body.channel === "string" ? body.channel : "#exec";
  const channel = getChannel(channelId);
  if (!channel) {
    return Response.json({ ok: false, error: `no channel ${channelId}` }, { status: 400 });
  }

  const routed = routeMessage(text, channel.id);
  if (!routed) {
    return Response.json({ ok: false, error: `nobody is in ${channel.id}` }, { status: 400 });
  }
  const agent = routed.agent;
  const role = getRole(agent.id)!;

  const speaker = {
    id: agent.id,
    title: agent.title,
    handle: agent.handle,
    department: agent.departmentName,
    why: routed.why,
  };

  if (!realModelConfigured()) {
    // The honest dead-end. Named colleague, no invented words.
    return Response.json({
      ok: true,
      modelConfigured: false,
      speaker,
      reply: null,
      note: "No model key is configured, so no colleague can answer yet. Add one key to .env.local (GROQ_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY or OPENROUTER_API_KEY) and restart. Nothing here will invent a reply in the meantime.",
    });
  }

  const history = typeof body.history === "string" ? body.history.slice(-6000) : "";
  const system = agentPersona(role, contextFor(agent)) + "\n" + toolPrompt(agent.id);
  const user = history ? `Recent conversation in ${channel.id}:\n${history}\n\nFounder: ${text}` : text;

  const spoken = await speakAsAgent(system, user, agent.execFn);
  if (!spoken || "error" in spoken) {
    return Response.json({
      ok: true,
      modelConfigured: true,
      speaker,
      reply: null,
      // The provider's own words, so a bad model id or a rate limit is readable instead of a shrug.
      note: spoken
        ? `The model could not answer: ${spoken.error} Nothing was invented in its place.`
        : "No model is reachable. Nothing was invented in its place.",
    });
  }

  // PERSIST BOTH SIDES. Fire and forget so a slow write never delays a reply, but the result is
  // recorded rather than discarded, and the response tells the caller whether it actually landed.
  const persisted = firestoreConfigured()
    ? await Promise.all([
        saveMessage({ channel: channelId, author: "you", text, at: new Date().toISOString() }),
        saveMessage({ channel: channelId, author: agent.id, authorTitle: agent.title, text: spoken.text, at: new Date().toISOString() }),
      ]).then((r) => r.every((x) => x.saved))
    : false;

  const raw = spoken.text;
  const call = parseAction(raw);
  const action = call ? runTool(agent.id, call) : null;

  return Response.json({
    ok: true,
    modelConfigured: true,
    // COMPUTED from what the write actually returned, never asserted. False means the exchange lives
    // only in this browser, which is the truth worth telling rather than hiding.
    remembered: persisted,
    speaker,
    reply: stripAction(raw) || raw,
    action: action ?? undefined,
  });
}
