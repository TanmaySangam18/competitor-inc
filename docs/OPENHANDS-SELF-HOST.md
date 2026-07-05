# OpenHands — self-host (Path B, the durable foundation)

_Decision (2026-07-04): **self-host is the long-term reliable base** for competitor.inc's build muscle —
no vendor rug-pull / lock-in / pricing risk, and code/IP stays in your environment. It's safe because
OpenHands is **MIT-licensed** (survives the vendor) and our build seam (`lib/engine/build-executor.ts` →
`makeBuildExecute`) is **provider-agnostic** — so you can start on Cloud and migrate here with a one-line
switch. Use **Cloud (app.all-hands.dev) as the fast on-ramp**; move here as the base._

## Why self-host (not a hobby box)
Run it on a **proper managed container host** — a cloud VM (AWS/GCP/Fly/Railway) or your VPC — with
auto-restart + monitoring. A Mac-mini / old-phone works for a personal demo but is NOT production
infra (uptime, security, scale, liability). The whole point is durability.

## Prerequisites
- A Linux host with **Docker** (OpenHands runs each build in a Docker sandbox → it needs the Docker socket).
- An **LLM API key** (BYOK) — a Claude/Anthropic key is the strongest for coding today.
- Outbound network + a port to expose the API (behind auth / a reverse proxy).

## Stand it up
OpenHands ships as a container. The canonical shape (confirm the **current image tag + flags** at
`docs.openhands.dev` — they version it):

```bash
docker run -d --name openhands --restart unless-stopped \
  -e LLM_API_KEY="$ANTHROPIC_API_KEY" \
  -e LLM_MODEL="anthropic/claude-<current>" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v ~/.openhands:/.openhands \
  -p 3000:3000 \
  docker.all-hands.dev/all-hands-ai/openhands:<current-tag>
```

- The `docker.sock` mount lets OpenHands spawn isolated **runtime sandboxes** for each task.
- Put it **behind auth** (an API key / reverse proxy) — never expose the raw API publicly.
- For programmatic use, prefer the **REST API** (the GUI ships with one) or the **OpenHands SDK** (Python).

## Wire it into competitor.inc (the one-line switch — already built)
The adapter is `lib/engine/openhands.ts` (shipped, gated). Set two env vars in Vercel and it takes over:

```
OPENHANDS_API_URL = https://<your-openhands-host>
OPENHANDS_API_KEY = <the API key you protect it with>
```

Then a `build:true` goal-run routes **OpenHands → GitHub → simulated** automatically (see the route +
`/orchestrator` "Build for real"). **Two things to confirm against your live deployment** (both isolated
in `openhands.ts` for a one-spot change):
1. **Request/response shape** — the `startBuild` body + `extractUrl()` mapping (Cloud vs self-host differ).
2. **Long builds** — a real app can take minutes; the current synchronous poll only fits the serverless
   function window. For multi-minute builds, promote to an **async job** (fire → status endpoint /
   Vercel Workflow). Flagged in-file.

## Verify
Run a goal with build on:
```bash
curl -s -X POST "$SITE/api/engine" -H "content-type: application/json" \
  -d '{"kind":"goal","goal":"a small CRUD app","build":true}' | jq '.mode, .outcome.artifacts'
```
`mode: "openhands"` + a resolving `artifacts[].url` = the full-app build muscle is live.

## Cost discipline
Keep per-agent model routing (cheap agents → cheap models); cap tokens; the sandbox is the expensive part,
so gate real builds behind approval + a wallet budget (already enforced by the governance spine).
