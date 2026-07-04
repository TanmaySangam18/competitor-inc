// Slack ChatOps helpers — posting messages + approval cards to Slack.
// Same trust model as Telegram (lib/engine/notify.ts): inert until SLACK_BOT_TOKEN is set, fail-soft.

export async function postToSlack(channelId: string, text: string, threadTs?: string): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return;
  try {
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ channel: channelId, text, thread_ts: threadTs }),
    });
  } catch {
    /* fail-soft */
  }
}

// Approval card with Approve/Reject buttons; button value encodes "approvalId:decision" and comes
// back through the interactivity webhook, mirroring the Telegram callback flow.
export async function sendSlackApproval(
  channelId: string,
  approval: { id: string; title: string; detail: string; amount?: number }
): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return;
  try {
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({
        channel: channelId,
        text: `Approval needed: ${approval.title}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${approval.title}*\n${approval.detail}${approval.amount ? `\n💰 Amount: $${approval.amount}` : ""}`,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "✅ Approve" },
                value: `${approval.id}:approved`,
                action_id: `approve_${approval.id}`,
                style: "primary",
              },
              {
                type: "button",
                text: { type: "plain_text", text: "❌ Reject" },
                value: `${approval.id}:rejected`,
                action_id: `reject_${approval.id}`,
                style: "danger",
              },
            ],
          },
        ],
      }),
    });
  } catch {
    /* fail-soft */
  }
}
