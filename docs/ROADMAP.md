# Roadmap — what's left, shaped into blocks (for tomorrow)

Everything still open, sorted by whether it needs **your approval/keys** or is **mine to build**, then shaped
into executable blocks (Shape Up: fixed appetite, clear "done", names the charter metric it moves). Pick the
order tomorrow; I'll execute.

## A. Needs YOU (approval / keys — ~15 min, unblocks "100% real")
These are built + gated; they flip on the moment you paste keys in Vercel (I'll drive the browser setup once
Claude in Chrome is connected). All from `docs/GO-LIVE.md` / `docs/CHATOPS.md`.
- **Telegram** (`TELEGRAM_BOT_TOKEN` + `TELEGRAM_WEBHOOK_SECRET` + setWebhook) → ChatOps approvals + reminders live.
- **LemonSqueezy** (`NEXT_PUBLIC_CHECKOUT_URL` + `LEMONSQUEEZY_WEBHOOK_SECRET`) → real subscriptions (lifecycle already built).
- **Resend** (`RESEND_API_KEY` + `RESEND_FROM`) → founder-notify + customer emails.
- **`CRON_SECRET`** → nightly heartbeat (now required, fail-closed).
- **Bluesky / Mastodon** roomie accounts → autonomous marketing.
- **Decision:** host-by-default cost model (we carry tenant infra, covered by Operator) — your nod before Block B-host.

## B. Mine to build — shaped blocks

**Block B1 — host-by-default provisioning engine** · metric: Activation · appetite: L (the big one)
The thing that makes "type an idea → it's actually running" literally true. Sub-slices (from `docs/PROVISIONING.md`):
- B1.1 per-customer tenant model (schema/namespace isolation in our Supabase + a deploy target) + `provisionTenant(company)` contract, gated + fail-soft.
- B1.2 deploy orchestration (Forge ships the MVP into the tenant; verify-before-done; live URL as Glass-Box proof).
- B1.3 per-tenant cost guardrails + unit-economics watch (the Operator sub must cover infra).

**Block B2 — one-click OAuth connect** · metric: Activation · appetite: M
Replace token-paste with one-click Authorize for Vercel (integration API), Supabase (Management API), GitHub (App).
Needs OAuth apps registered on your accounts (a YOU step) → then automatic. + one-click **eject** ("own everything").

**Block C — playbook library (continue)** · metric: Customer ROI · appetite: M
Have 19. Add the next elite, customer-deployable tier: follow-up cadence, referrals, renewals/expansion, pricing
negotiation. Each: psychology, cadence, templates, KPIs, mistakes.

**Block E — Pitch/Surge boundary sharpen** · metric: Defensibility · appetite: XS
From the agent audit: sharpen Pitch = pre-launch demand, Surge = post-launch loops (copy only).

**Block F — audit backlog (non-blocking polish)** · metric: Reliability/UX · appetite: M (batchable)
From `docs/AUDIT.md`: tests on the money/cron routes; mobile nav menu (hamburger) so sign-in shows < lg;
relabel `/live` "Demo workspace" (honesty); proof-type tagging; BYOK shape validation; Founding seats-left counter.

**Block G — full visual QA pass (browser-driven)** · metric: UX polish · appetite: S
Once Claude in Chrome is connected: render every page at mobile/tablet/desktop widths, catch overlaps/overflow
like the nav one. (I can reason about layout from code, but pixel-perfect needs a real render.)

## C. Launch gates (only at the surprise launch — NOT before)
- Custom domain + flip `NEXT_PUBLIC_SITE_PUBLIC=1` (lets Google index; keep OFF until launch day).
- Final go-live checklist (`docs/GO-LIVE.md`), then the success-story post when it hits ~$10K.

## Suggested order for tomorrow (charter priority: ROISC → Revenue → Activation)
1. **A** (you, ~15 min) — unblocks real payments + ChatOps. 2. **Block B1** (the host-by-default engine — biggest
activation lever). 3. **Block C** (more playbooks). 4. **E + F** (quick polish, batched). G whenever the browser's connected.
