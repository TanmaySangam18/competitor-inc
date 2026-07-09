# The 2% — founder account checklist (paste-ready)

Everything the autonomous company needs that only YOU can create (identity + card). For each: where to go,
what to grab, and the EXACT env var name to paste it under in **Vercel → Project → Settings → Environment
Variables → Production** (mark keys Sensitive; also mirror into local `.env.local` if you run dev). Set them
as you get them — each block activates automatically as its code lands and its keys exist.

⏱️ = has a multi-day lead time. **Do the ⏱️ steps TODAY** even though the code isn't there yet.

---

## P1 — The brain (unblocks every agent) — do first
**1. Anthropic API** — console.anthropic.com → API Keys → create key. Add ~$25 starting credit.
- `ANTHROPIC_API_KEY` = `sk-ant-…`
- Also flip on Vercel: `MODEL_PROVIDER` = `anthropic` · `MODEL_ID` = `claude-opus-4-8` · `MODEL_MID` = `claude-sonnet-5` · `MODEL_CHEAP` = `claude-haiku-4-5` (this supersedes the Groq setup — delete `MODEL_BASE_URL`/`MODEL_API_KEY` or leave, they're ignored on provider=anthropic)
- ⏱️ **Apply for Claude for Startups credits today** (anthropic.com → startups; $25–100k credits; review takes time). Cost until then: usage, ~$50–300/mo at pilot volume.

## P2 — The team room + identities (Block 2)
**2. Slack** — slack.com → create the workspace (free plan fine to start). Then api.slack.com/apps →
"Create New App" (from scratch) → OAuth & Permissions → Bot Token Scopes:
`chat:write`, `chat:write.customize`, `channels:manage`, `channels:read`, `groups:write`, `users:read`, `im:write`, `app_mentions:read`
→ Install to workspace.
- `SLACK_BOT_TOKEN` = `xoxb-…` (