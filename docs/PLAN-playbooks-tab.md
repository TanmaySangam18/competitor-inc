# Plan — Public "Playbooks" tab (living, agent-maintained methodology + freemium)

> Playbooks *are* competitor.inc's DNA — every decision runs on a proven or newly-created playbook. So make
> them a public, living library: read live on the site, **first paragraph free**, the rest behind a **~$3
> one-time unlock** (micro-ebook). Documents the methodology, drives SEO/authority/trust, and adds a small
> revenue stream. **Design doc (freeze-safe); seed now, paid-unlock + agent-authoring post-launch.**

## What it is
- **`/playbooks`** (list) + **`/playbooks/[slug]`** (detail) — public, **server-rendered, SEO-first**.
- Each playbook: **first paragraph free**, rest gated behind a **$3 one-time unlock** (per playbook).
- **Living:** the agents draft + update playbooks over time (adapt a proven framework or create a new one).
- **Seed library:** the ~20 existing `/docs` playbooks (path-to-10k, distribution, conviction-voice,
  gtm-niche, etc.) become the launch content; restated for a public reader.

## Honest reframe (read before sizing the revenue)
- **Primary value = SEO + authority + trust + lead-gen.** Free first paragraph → reader → waitlist →
  customer. This is a **distribution asset** first.
- **The $3 is secondary micro-revenue** — *not* a $10K path on its own (~3,300 sales/mo would be unrealistic).
  Treat it as a tip-jar/credibility signal, not a revenue pillar.
- **Publish the methodology; keep the proprietary internals private** (exact prompts, agent code, customer
  data) — balances our transparency brand against handing rivals the keys.
- **Don't reproduce others' copyrighted text** (Walling, Moore, etc.) — cite + restate in our own words.
- **Quality bar:** no AI-slop behind a paywall — selling thin content would betray the honesty wedge.
  Every published playbook is founder-approved.

## How it's built (reuses existing pieces)
1. **Store:** playbooks as rows (Supabase) or markdown with frontmatter; fields: slug, title, free-intro,
   body, status (draft/approved/published), price, updatedBy.
2. **Authoring (agents, approval-gated):** **Quill** (or a new **"Librarian"** role in
   `lib/roomie/delegation.ts` + the `AGENTS` map in `lib/roomie/types.ts`) drafts/updates a playbook →
   it lands in the **Approval Inbox** → founder approves → it publishes. **No public auto-publish.**
3. **Payments:** reuse the Stripe hook (`createPaymentLink` / `STRIPE_*` in `lib/roomie/execution.ts`) for the
   $3 unlock; record a per-(user, playbook) **entitlement** (reuse `lib/roomie/sync.ts`). Gate the body
   server-side on entitlement; show the free intro + a paywall otherwise.
4. **Routes:** `app/playbooks/page.tsx` (list, SSR for SEO) + `app/playbooks/[slug]/page.tsx` (detail,
   intro public, body gated). Paper-&-Ink styling; on-brand.

## Build phases
- **Phase 1 (now, freeze-safe):** this design doc + seed/restate the first 3–5 playbooks as public-ready
  content (no code).
- **Phase 2 (post-launch):** the public `/playbooks` routes + the free-intro/paywall split (read-only, no
  payments yet — just "unlock coming soon").
- **Phase 3:** Stripe unlock + entitlements.
- **Phase 4:** agent-authoring loop (Librarian drafts → approval → publish) on the dynamic-agents engine.

## Verify (when built)
- `/playbooks` renders + is indexable (SSR, meta tags); free intro shows, body gated.
- A test unlock grants access to exactly that playbook for that user; others stay gated.
- Nothing publishes without founder approval; no copyrighted text reproduced; QA gate green.
