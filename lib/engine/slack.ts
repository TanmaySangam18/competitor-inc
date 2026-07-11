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

