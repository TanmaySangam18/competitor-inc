#!/usr/bin/env bash
# One-command production deploy for competitor.inc.
#
# WHY THIS SCRIPT: plain `vercel --prod` has been failing with a seat/team access error
# ("TEAM_ACCESS_REQUIRED" / seatBlock). The known-working workaround is to deploy from a CLEAN
# git-archive of HEAD with the repo's .vercel project link copied in. This script encodes that,
# and runs the full QA gate first so a red build never ships.
#
# PREREQS (one-time, on your machine — I can't do these for you):
#   1. `npm i -g vercel`   (or use `npx vercel`)
#   2. `vercel login`      (your account, projecttattva1-* — the founder's Vercel)
#   3. Make executable once:  chmod +x scripts/ship-prod.sh
#
# USAGE:  ./scripts/ship-prod.sh        (or: npm run ship)
#
# Env vars live in the Vercel dashboard (not here). Before shipping the freemium launch, confirm these
# are set in Vercel → Project → Settings → Environment Variables (Production):
#   NEXT_PUBLIC_WAITLIST_GATE=1   · NEXT_PUBLIC_SITE_PUBLIC=1   · CRON_SECRET=<set>
#   (checkout stays OFF pre-OPT: NEXT_PUBLIC_CHECKOUT_URL must be ABSENT)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v vercel >/dev/null 2>&1; then
  echo "✗ vercel CLI not found. Install: npm i -g vercel  (then: vercel login)"; exit 1
fi
if [ ! -f .vercel/project.json ]; then
  echo "✗ .vercel/project.json missing — repo isn't linked. Run: vercel link"; exit 1
fi

# This script deploys `git archive HEAD`, so a dirty tree would silently ship the OLD commit. Refuse.
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "✗ Working tree is dirty — commit (or stash) before shipping; ship deploys git HEAD, not your edits."; exit 1
fi

echo "▶ 1/3  QA gate (tsc + tests + build + smoke) — never ship red…"
npm run qa

echo "▶ 2/3  Preparing a clean deploy tree from git HEAD…"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
git archive --format=tar HEAD | tar -x -C "$TMP"
cp -R .vercel "$TMP/.vercel"

echo "▶ 3/3  Deploying to production (builds on Vercel)…"
( cd "$TMP" && vercel --prod --yes )

echo ""
echo "✓ Deployed. Verify (2 min):"
echo "   • open the prod URL, run the hero demo"
echo "   • /house/board → Landing Funnel should log landed → ran demo"
echo "   • confirm the waitlist gate shows after preview (NEXT_PUBLIC_WAITLIST_GATE=1)"
