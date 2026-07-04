# Slack ChatOps — 5-minute setup

The code is shipped (`app/api/slack/webhook/route.ts`); Slack just needs an app pointed at it.

## 1. Create the app (one click)
1. Go to https://api.slack.com/apps → **Create New App** → **From an app manifest**.
2. Pick your workspace, paste the contents of [`slack-app-manifest.json`](./slack-app-manifest.json) (adjust the domain if not the zeta deployment).
3. Create, then **Install to Workspace**.

## 2. Copy two secrets into Vercel env
| Env var | Where to find it |
|---|---|
| `SLACK_SIGNING_SECRET` | App page → Basic Information → App Credentials |
| `SLACK_BOT_TOKEN` | App page → OAuth & Permissions → Bot User OAuth Token (`xoxb-…`) |
| `SLACK_DIGEST_CHANNEL` (optional) | Channel ID for the Friday weekly review (right-click channel → copy link → last segment) |

Redeploy after setting env vars.

## 3. Verify
1. Slack will ping the `request_url` for URL verification — the route answers the challenge automatically once `SLACK_SIGNING_SECRET` is set.
2. Invite the bot to a channel: `/invite @competitor-crew`.
3. Type a message — the crew replies in-thread. Ask for something consequential ("run a $50 test") and it queues an approval instead of acting.
4. Approvals sent to Slack carry Approve/Reject buttons; taps land in `approval_decisions` (same table as Telegram — one audit trail).

## Notes
- The webhook is fail-closed without the signing secret and fail-soft everywhere else (never retry-storms).
- Same trust posture as Telegram: Slack records *decisions*; execution still passes the policy floor + RLS on the next sync.
