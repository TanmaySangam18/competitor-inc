#!/usr/bin/env bash
# scripts/activate-prod.sh — set every Production env var competitor.inc needs, in one run.
#
# WHY THIS EXISTS: `vercel env ls production` showed exactly ONE variable (GROQ_API_KEY), so the
# deployed site had no database (sign-in impossible), no CRON_SECRET (the nightly heartbeat 401s and
# has never run), and no build tokens. Setting these by hand failed twice: the interactive prompt is
# easy to abandon at the environment multi-select, and running the CLI from ~/competitor.inc (the DOT
# directory) never reaches this project because only ~/competitor-inc (DASH) carries the .vercel link.
# This script hardcodes the correct path and pipes values on stdin so nothing can be half-done.
#
# WHAT IT DOES NOT DO (by design, these are the six hard-stops):
#   - create any account, accept any terms, or enter payment details
#   - set NEXT_PUBLIC_CHECKOUT_URL* (that is R1: Polar products must exist first)
#   - apply migrations or deploy — those are separate, deliberate steps (see docs/ACTIVATION-RUNBOOK.md)
#
# Values you paste are read with `read -s` (never echoed, never in your shell history).
# Generated secrets are appended to .env.local, which IS gitignored (.gitignore:23).

set -euo pipefail

REPO="$HOME/competitor-inc"   # the DASH directory — the only one linked to the Vercel project
cd "$REPO"

if [ ! -f .vercel/project.json ]; then
  echo "FATAL: $REPO has no .vercel/project.json. Run 'npx vercel link' first." >&2
  exit 1
fi

SUPABASE_URL="https://nfxqlyidxrncfawakhuw.supabase.co"
ENVFILE="$REPO/.env.local"

# ── helpers ──────────────────────────────────────────────────────────────────
# put NAME VALUE SENSITIVITY   (SENSITIVITY = --sensitive | --no-sensitive)
put() {
  local name="$1" value="$2" sens="$3"
  if [ -z "$value" ]; then
    printf '  skip   %-32s (no value given)\n' "$name"
    return 0
  fi
  if printf '%s' "$value" | npx --yes vercel env add "$name" production --force "$sens" >/dev/null 2>&1; then
    printf '  set    %-32s %s\n' "$name" "$sens"
  else
    printf '  FAILED %-32s (see: npx vercel env add %s production)\n' "$name" "$name" >&2
  fi
}

# read a value into the named variable without echoing it (read -rs assigns directly)
ask() {
  local prompt="$1" __var="$2"
  printf '%s' "$prompt" >&2
  read -rs "$__var"
  printf '\n' >&2
}

# pull an already-present value out of .env.local (the Slack app you already built)
from_envfile() {
  local key="$1"
  [ -f "$ENVFILE" ] || return 0
  grep -E "^${key}=" "$ENVFILE" | tail -1 | cut -d= -f2- | tr -d '"' | tr -d "'"
}

echo
echo "ACTIVATE PRODUCTION — competitor.inc"
echo "Target: projecttattva1-4009s-projects/competitor-inc (Production)"
echo

# ── 1. the two values only you can supply ────────────────────────────────────
echo "Supabase → Settings → API Keys → the 'Legacy anon, service_role API keys' TAB."
echo "(Your code reads the legacy names, not the new publishable/secret ones.)"
echo
ask "  paste the legacy ANON key (hidden): " ANON_KEY
ask "  paste the legacy SERVICE_ROLE key (hidden): " SERVICE_KEY

# ── 2. optional extras — press Enter to skip any ─────────────────────────────
echo
echo "Optional (press Enter to skip):"
ask "  GITHUB_TOKEN, needed before the org can commit or build (hidden): " GH_TOKEN
ask "  FOUNDER_USER_ID, your Supabase auth.users id, routes ritual escalations to your queue: " FOUNDER_ID

# ── 3. secrets we generate ───────────────────────────────────────────────────
CRON_SECRET="$(openssl rand -hex 32)"
RECEIPT_SECRET="$(openssl rand -hex 32)"

# ── 4. Slack: already in .env.local from the app you built ───────────────────
SLACK_BOT="$(from_envfile SLACK_BOT_TOKEN)"
SLACK_SIG="$(from_envfile SLACK_SIGNING_SECRET)"
SLACK_DIGEST="$(from_envfile SLACK_DIGEST_CHANNEL)"
SLACK_LOOP="$(from_envfile SLACK_LOOP_CHANNEL)"
CONN_SECRET="$(from_envfile CONNECTIONS_SECRET)"

echo
echo "Writing to Vercel Production:"

# NEXT_PUBLIC_* MUST be non-sensitive. A Sensitive NEXT_PUBLIC_* var is never inlined into the client
# bundle: the server sees it, the browser does not, and auth half-works while looking configured.
put NEXT_PUBLIC_SUPABASE_URL      "$SUPABASE_URL"   --no-sensitive
put NEXT_PUBLIC_SUPABASE_ANON_KEY "$ANON_KEY"       --no-sensitive
put NEXT_PUBLIC_SITE_PUBLIC       "1"               --no-sensitive

# server-only secrets
put SUPABASE_SERVICE_ROLE_KEY     "$SERVICE_KEY"    --sensitive
put CRON_SECRET                   "$CRON_SECRET"    --sensitive
put RECEIPT_SIGNING_SECRET        "$RECEIPT_SECRET" --sensitive
put GITHUB_TOKEN                  "$GH_TOKEN"       --sensitive
put SLACK_BOT_TOKEN               "$SLACK_BOT"      --sensitive
put SLACK_SIGNING_SECRET          "$SLACK_SIG"      --sensitive
put CONNECTIONS_SECRET            "$CONN_SECRET"    --sensitive

# non-secret config
put SLACK_DIGEST_CHANNEL          "$SLACK_DIGEST"   --no-sensitive
put SLACK_LOOP_CHANNEL            "$SLACK_LOOP"     --no-sensitive
put FOUNDER_USER_ID               "$FOUNDER_ID"     --no-sensitive

# ── 5. keep the generated secrets where you can find them again ──────────────
{
  echo
  echo "# ── generated by scripts/activate-prod.sh on $(date -u +%Y-%m-%dT%H:%M:%SZ) ──"
  echo "# CRON_SECRET is needed to fire the heartbeat by hand (step 4 of the runbook)."
  echo "CRON_SECRET=$CRON_SECRET"
  echo "RECEIPT_SIGNING_SECRET=$RECEIPT_SECRET"
} >> "$ENVFILE"

echo
echo "Generated secrets appended to .env.local (gitignored). CRON_SECRET is in there for step 4."
echo
echo "── what Production holds now ──"
npx --yes vercel env ls production 2>&1 | sed -n '3,60p'

cat <<'NEXT'

NEXT, in order (each is deliberate, none of it happens automatically):

  1. Redeploy — env vars only bind at build time, so nothing above is live yet:
       cd ~/competitor-inc && npm run ship

  2. Migrations — paste this whole file into Supabase Studio → SQL Editor:
       supabase/migrations/LAUNCH_BUNDLE_0032-0035.sql

  3. First heartbeat — the moment company #0 births its own loop:
       source ~/competitor-inc/.env.local
       curl -s -H "Authorization: Bearer $CRON_SECRET" \
         https://competitor-inc-zeta.vercel.app/api/cron | jq

  4. Verify honestly — reload /connect; it reads the real environment and
     will name whatever is still dark.

STILL NOT DONE, on purpose: R1 (Polar products + NEXT_PUBLIC_CHECKOUT_URL* +
POLAR_WEBHOOK_SECRET). Account creation, accepting terms, and payout details
are four of the six hard-stops. Until then the company cannot take money, and
the forecast will keep reporting no committed inflows, because that is true.
NEXT
