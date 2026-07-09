import { mobilize } from "@/lib/org/kickoff";
import { ensureDepartmentChannels, postAsAgent } from "@/lib/org/slack-org";
import { rateLimited, clientIp } from "@/lib/engine/ratelimit";

export const runtime = "nodejs";

// THE KICKOFF endpoint — fired the instant a project is described (from createCompany). Mobilizes the
// whole company: every role gets a day-1 task, and each department head posts its team's standup into the
// department's Slack channel, with a founder briefing to the founder's channel. Fail-soft: no Slack token
// ⇒ it still returns the plan (the dashboard can render it) but posts nothing. Rate-limited so repeated
// company-creates can't spam the workspace.

export async function POST(req: Request) {
  if (rateLimited(`kickoff:${clientIp(req)}`)) {
    return Response.json({ ok: false, error: "rate limited" }, { status: 429 });
  }
  let brief = "";
  try {
    const body = (await req.json()) as { brief?: unknown };
    brief = typeof body.brief === "string" ? body.brief.trim().slice(0, 200) : "";
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  if (brief.length < 4) return Response.json({ ok: false, error: "brief too short" }, { status: 400 });

  const k = mobilize(brief);

  // Post to Slack only if configured. ensureDepartmentChannels resolves name → id (creating any missing).
  let posted = 0;
  if (process.env.SLACK_BOT_TOKEN) {
    try {
      const chMap = await ensureDepartmentChannels();
      for (const post of k.standupPosts) {
        const id = chMap[post.channel];
        if (!id) continue;
        await postAsAgent(id, { roleId: post.headRoleId }, post.text);
        posted++;
      }
      const founderCh = process.env.SLACK_DIGEST_CHANNEL;
      if (founderCh) { await postAsAgent(founderCh, { roleId: "chief-executive-officer" }, k.founderBriefing); posted++; }
    } catch (e) {
      console.error("[/api/kickoff] slack post failed:", e instanceof Error ? e.message : "unknown");
    }
  }

  return Response.json({ ok: true, mobilized: k.totalAgents, departments: k.plans.length, posted });
}
