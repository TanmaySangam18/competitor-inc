# Pre-flight Procedure — catch every crack before we ship

> **Playbook:** *The Checklist Manifesto* (Gawande) — checklists catch the "obvious but critical"
> misses experts skip under load; use **hard-stop pause points**, separate **[AUTO]** (machine-checked)
> from **[EYES]** (human judgment), and our house rule: **grep every instance, don't eyeball.**
> Supporting: **Testing Trophy** (the QA harness), **Nielsen heuristics** (flow/UX), **Bezos two-way
> doors** (reversibility). Tags: **[AUTO]** runnable · **[EYES]** human read · **[KILLER]** = has bitten
> us before / most dangerous if missed.
>
> **Cadence:** Blocks 1–2 on every change. The full Block 0→9 before any ship, handoff, or "update
> GitHub." Each block is a **pause point** — do not advance with a red item open.

---

## Block 0 · Freeze & baseline *(pause point)*
- [ ] **[KILLER]** Confirm you're in the real repo: **`~/competitor-inc`** (dash), not `~/competitor.inc` (dot).
- [ ] `git status` — working tree understood (clean, or every change intentional).
- [ ] State the change in one line + its "done" definition. If scope is fuzzy, stop and define it.
- [ ] Baseline is green: last `npm run qa` ended **`SMOKE PASSED ✓`**.

## Block 1 · Automated gates *(the Testing Trophy floor)* — [AUTO]
- [ ] `npm run qa` → **must end `SMOKE PASSED ✓`**: `tsc --noEmit` clean · all vitest pass · `next build` ok · smoke sweeps every route (200/404) + API happy paths + 400s + **60-payload fuzz with zero 5xx**.
- [ ] Run `npx vitest run` **twice** — no flakiness; identical pass count both times.
- [ ] Pass criteria: zero type errors, zero failing tests, build succeeds, smoke passes. **No advance on red.**

## Block 2 · Consistency sweep *(grep every instance, don't eyeball)* — [AUTO]/[EYES]
- [ ] **[KILLER] Env ⇄ code parity.** Every `process.env.X` used in code is documented in `.env.example`, and every `.env.example` var is actually read by code (no phantom vars — we shipped that bug once).
  `grep -rhoE "process\.env\.[A-Z_]+" lib app | sort -u` ⇄ the keys in `.env.example`.
- [ ] **[KILLER] Terminology.** `grep -rni "refund" lib app` → only **Guard's customer-refund** copy; the ledger field is **`credited`**, never `refunded`. No "refund" used to mean work-credit.
- [ ] **No build-in-public in the product/strategy.** `grep -rni "build.in.public" lib app README.md` → **none** (allowed only in superseded/research docs).
- [ ] **Model IDs valid + current.** `grep -rnoE "claude-[a-z0-9.-]+" lib app .env.example` → only real current IDs (`claude-opus-4-8`, `claude-sonnet-4-6`, `claude-haiku-4-5`); no dated/retired strings.
- [ ] **Brand.** No stray old working titles in user-facing UI/docs (internal `roomie:`/`ROOMIE_` namespace is fine).
- [ ] **Doc ⇄ code parity.** `capabilities()` keys == Settings → Integrations rows == `.env.example` engine/integration vars == runbook list.

## Block 3 · Flow-logic trace *(no dead ends, no illogical transitions)* — [EYES]
Walk the state machine end-to-end; every transition must have **visible status (Nielsen H1)** and **a way back/out (H3)**:
- [ ] Onboard → **validating** (steps visibly progress) → **validated** (gate shows verdict) → **decide**.
- [ ] **Approve build** → status `operating` **+ redirect to `/delegation` + auto first shift** (you SEE agents working). **Hold** → `rejected` with a path back (build-anyway / new idea).
- [ ] **[KILLER] Idempotency:** double-click **Approve build** ships **one** MVP (not two); double-click **Approve** on an item charges **once**; **undo** can't double-credit.
- [ ] **Chat → approval:** a consequential chat ("spend $300…") actually creates an ApprovalItem in the Inbox (not just text); **approve** fires `executeAction` (gated); **reject** fires nothing.
- [ ] **Autopilot** pauses *visibly* at the threshold and resumes when the Inbox clears.
- [ ] **[KILLER] Gated-off behavior:** with **no keys**, every `runAction` returns `disabled` and the app behaves **exactly** as the simulated demo — **no live network calls**. (This is what keeps the offline demo honest.)

## Block 4 · Money-model integrity — [EYES]
- [ ] Subscription = **tool access + work allowance**, NOT a spend budget. Real external spend = **the user's own connected accounts**.
- [ ] **Credit, not cash:** failed *work* is **credited back to the allowance** (we eat the compute); an ad that ran-but-didn't-convert is a **result, not refundable**.
- [ ] Every real-money action is **approval-gated**; `net = spent − credited` can never go negative; **0% revenue share** anywhere it's stated.

## Block 5 · Security & data integrity — [AUTO]/[EYES]
- [ ] **Secrets server-only:** `grep -rniE "process\.env\.(ANTHROPIC|SUPABASE_SERVICE|CRON|ROOMIE_API|AI_GATEWAY|GITHUB_TOKEN|STRIPE|RESEND)" app components --include=*.tsx` → **nothing** (no secret in client files).
- [ ] **Logs leak nothing:** server `console.error` logs **`err.message` only**, never raw error/body.
- [ ] **SSRF guard** on the BYOK base URL holds (https-only; blocks loopback/private/metadata/IPv4-mapped-IPv6) — covered by `server.test.ts`.
- [ ] **No `innerHTML` with user data:** `grep -rn "innerHTML" app lib` → none (use `textContent`).
- [ ] **Every `JSON.parse` of localStorage is guarded** (try/catch or shape-checked); **export is per-key resilient** (one bad key can't drop the bundle).
- [ ] Run the **`/security-review` skill** from inside the repo on the diff.

## Block 6 · Accessibility & UX *(Nielsen quick pass)* — [EYES]
- [ ] **Visibility of status** everywhere work happens (validation steps, "Working…", autopilot-paused banner, Integrations Live/Off).
- [ ] **Feedback** on every action; **error recovery** for corrupted storage + engine failure (graceful degrade to simulated).
- [ ] **Consistency** of copy/labels; honors `prefers-reduced-motion` / `prefers-reduced-transparency`; focus rings + AA contrast intact.

## Block 7 · Handoff readiness — [EYES]
- [ ] `launch/runbook.md` steps are accurate end-to-end (clone → `npm install` → `npm run qa` → deploy → env → domain → go-live) and every env var it names matches `.env.example`.
- [ ] **LICENSE** + README founder credit present; repo is **private**; commit author identity correct.
- [ ] **[KILLER] `local == origin/main`** before sharing the link: `git rev-parse HEAD` == `git rev-parse origin/main`, and `git status` clean.

## Block 8 · Reversibility *(Bezos two-way doors)* — [EYES]
- [ ] Every outward/consequential action is **gated by approval**, **reversible** (Vercel rollback, `git revert`, credit-not-charge), or **explicitly flagged one-way**. No silent destructive op.
- [ ] Demo/seed data is clearly labeled as demo; "delete" actions acknowledge but don't auto-fire destructive APIs.

## Block 9 · Sign-off ritual *(DO-CONFIRM — hard stop)* — [EYES]
Read each aloud; only ship when all are **yes**:
- [ ] QA green (Block 1)? · Consistency sweep clean (2)? · Flow trace: no dead ends, idempotent, gated-off honest (3)?
- [ ] Money model coherent (4)? · Security sweep clean (5)? · UX/a11y pass (6)? · Handoff ready + in sync (7)? · Everything reversible/gated (8)?
- [ ] Record the shipped **commit SHA + date** here, then commit/push.

---

### The six "killer items" (the ones that bite — check these even when rushed)
1. Wrong working dir (dash vs dot). 2. Env ⇄ code parity (phantom vars). 3. Terminology drift (credit≠refund).
4. Gated-OFF-without-keys (no live calls in the demo). 5. Idempotency on double-click. 6. `local == origin/main` before sharing.

*A checklist is only useful if it's actually run. Run Blocks 1–2 every change; the full sweep before every ship.*
