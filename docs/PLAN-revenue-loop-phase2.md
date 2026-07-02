# Revenue Loop — Phase 2: Meta Pixel + Ads (design stub, DO NOT build pre-validation)

Phase 1 (shipped) measures the funnel on signals we own: our first-party pixel (`/api/track`),
demand-test signups, and verified Polar revenue. Phase 2 adds the customer's **Meta surface** —
where ~30% of the web already reports — so the loop can see and optimize paid acquisition.

## What Phase 2 adds

1. **Meta Pixel installer** — extend `components/PixelSnippet.tsx` to also emit the customer's Meta
   Pixel base code + a Conversions-API forwarder, so the same page view feeds BOTH our loop and
   Meta's ad optimization. The pixel itself is free; no spend involved.
2. **Marketing API reader** — `lib/engine/connectors/meta.ts`: nightly pull of ad spend, impressions,
   clicks, and attributed conversions for the customer's campaigns → new `ad_spend` rows keyed by
   slug + day. Feeds CAC/ROAS into `readFunnel()` as a fifth signal (basis "real").
3. **Budget actions — always QUEUE.** Any campaign create/pause/budget change routes as a
   `kind:"spend"` approval through `decide()` (the policy matrix already QUEUEs all spend). The loop
   may *recommend* "kill campaign X, shift $Y to Z" — a human clicks approve. No exceptions.

## Credential model (the existing BYOK trust pattern)

`Connections` (lib/engine/types.ts) gains `metaPixelId`, `metaCapiToken`, `metaAdAccountId`,
`metaAccessToken` — stored client-side like `githubToken` (config.ts getConnections), sent
per-request, never persisted server-side. Same posture, no new trust surface.

## Why this is Phase 2, not now

- Requires the customer's Meta Business assets + token — an account-connection funnel we shouldn't
  build before customers exist to connect it.
- The Marketing API needs an approved Meta app (review process, weeks).
- Honesty cost of doing it early: an ads integration nobody has connected is a dead "Off" badge —
  exactly what the integration audit flagged as trust-eroding.

**Trigger to build:** ≥3 real customers with live products asking for paid acquisition, or the first
customer already running Meta ads who wants the loop to see them.
