# Slack app — create-from-manifest (your 4 clicks)

Your workspace is already made (team `T0BGZHMFC80`). I can't log into it or create the app for you — that
needs your identity + an OAuth install. But I've pre-built the entire app config as a **manifest**, so your
side is: paste → pick workspace → install → copy two values back to me. ~2 minutes.

## Steps
1. Go to **https://api.slack.com/apps** → **Create New App** → **From an app manifest**.
2. Select your workspace (**competitor.inc**, `T0BGZHMFC80`).
3. Paste the YAML below → **Next** → **Create**.
4. On the app's page → **Install App** (left sidebar) → **Install to Workspace** → **Allow**.

## Then paste these two back to me (secret field / DM — never public)
- **`SLACK_BOT_TOKEN`** — after install, *OAuth & Permissions* → "Bot User OAuth Token" (starts `xoxb-…`).
- **`SLACK_SIGNING_SECRET`** — *Basic Information* → App Credentials → "Signing Secret" (Show → copy).

(That's it — no app-level token needed. The app talks to our deployed webhook over HTTPS, so there's no
Socket Mode step.) I already have your team id `T0BGZHMFC80` and your `#general`-ish channel `C0BG37UHHSS`
from the link — I'll use the latter as the founder briefing channel unless you tell me otherwise.

## The manifest (paste this exactly)
```yaml
display_information:
  name: competitor.inc
  description: Your autonomous software company — the crew posts here as themselves.
  background_color: "#111111"
features:
  bot_user:
    display_name: competitor.inc
    always_online: true
  app_home:
    home_tab_enabled: false
    messages_tab_enabled: true
    messages_tab_read_only_enabled: false
oauth_config:
  scopes:
    bot:
      - chat:write            # post messages
      - chat:write.customize  # post AS each agent (per-title name + icon)
      - channels:read         # find department channels
      - channels:manage       # create department channels
      - channels:join         # join the channels it posts to
      - groups:read           # private channels, if any
      - users:read            # resolve members for @mentions
      - app_mentions:read     # hear when you @ an agent
      - im:write              # DM the founder
settings:
  interactivity:
    is_enabled: true
    request_url: https://competitor-inc-zeta.vercel.app/api/slack/webhook
  event_subscriptions:
    request_url: https://competitor-inc-zeta.vercel.app/api/slack/webhook
    bot_events:
      - app_mention
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```

## What the app does once installed (built + waiting on the two values)
- Provisions one channel per department (`#exec`, `#engineering`, `#product`, `#design`, `#quality`,
  `#revenue`, `#customer`, `#licensing`, `#finance`, `#legal`, `#data`).
- The crew posts **as themselves** — each message shows the agent's *title* as the sender (e.g.
  "Backend Team Lead") with a department icon, so the room reads like a real company channel.
- Daily **standup** + end-of-day **wrap** in each channel; the CEO posts a founder briefing to your
  channel (`C0BG37UHHSS`).
- The few founder-gated actions arrive as **Approve / Reject** cards (already built) — one tap, from Slack.

> Note (your checklist #5): WhatsApp has **no group chats** on its API — so Slack *is* the team room.
> WhatsApp stays for 1:1 founder briefings + approvals via Twilio.
