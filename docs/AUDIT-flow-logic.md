# Flow-Logic Audit — competitor.inc

> **The playbook:** [**Jakob Nielsen's 10 Usability Heuristics**](https://www.nngroup.com/articles/ten-usability-heuristics/)
> (Nielsen Norman Group) — the most widely used, battle-tested checklist for finding the *minute logical
> gaps* in an interaction flow. Complemented by Google's **People + AI (PAIR) Guidebook** for the
> agent-specific feedback expectations.
>
> This audit walks competitor.inc's core flow — **idea → validate → decide → build → operate → shift →
> approve → undo** — and checks each transition against the heuristics. The headline finding (and the
> example that prompted it): *approving a build was silent.* That's now fixed.

- **Reviewed:** the `main` snapshot + the `/delegation` work.
- **Date:** 2026-06-19

---

## 1 · The heuristics we leaned on

| # | Heuristic | What it demands of a flow |
| --- | --- | --- |
| H1 | **Visibility of system status** | The user is always told what's happening, with timely feedback. |
| H2 | **Match between system & real world** | The system does what it says; words map to reality. |
| H3 | **User control & freedom** | Clear exits, undo, a way back. |
| H4 | **Consistency & standards** | The same action means the same thing everywhere. |
| H5 | **Error prevention** | Risky/duplicate actions are blocked or confirmed before they commit. |
| H6 | **Recognition over recall** | Options are visible; the user needn't remember state. |
| H9 | **Recover from errors** | Plain-language messages with a way forward. |

---

## 2 · Findings — FIXED this pass

### ✅ G1 — Approving a build was invisible (H1, H2)

**Before:** `Approve build` → `decideBuild(true)` flipped status to `operating`, shipped the MVP
**instantly and silently**, and left the founder staring at a stats panel. The product's whole promise —
"a crew of agents builds and operates the winner" — was never *shown*. The user's words: *"the moment
approve hits, the page should redirect to the agents, working on laptops, talking to each other, and
show real-time working."*

**After:**
- Approving (from the gate, the "build anyway", or the held-idea screen) now routes straight to
  [`/delegation`](../app/delegation/page.tsx) — the live 3D agent floor. ([dashboard `goBuild`](../app/dashboard/page.tsx))
- On arrival the room plays a short **"Shipping your MVP"** beat, then **auto-runs the first shift**, so
  you literally watch the crew converge and work — no extra click. ([delegation page effect](../app/delegation/page.tsx))
- The acting agent gets a **speech bubble** showing what they're doing right now, plus a status line in
  the header (`Building the MVP` → `Running night 2`). ([`DelegationScene.tsx`](../app/delegation/DelegationScene.tsx))

### ✅ G2 — `resolveApproval` wasn't idempotent (H5)

A rapid double-click (or any double-fire) on **Approve** re-charged the ledger and logged the action
twice, because the reducer never checked whether the item was already resolved.
**Fix:** `if (item.resolved) return s;`. ([useRoomie.ts](../lib/roomie/useRoomie.ts))

### ✅ G3 — `decideBuild` could build twice (H5)

No status guard meant a second approve (now more likely, since approve also navigates) would ship a
**second MVP** and double-charge. **Fix:** `if (approve && c.status === "operating") return s;`.
([useRoomie.ts](../lib/roomie/useRoomie.ts))

### ✅ G4 — No status on the agent floor (H1)

`/delegation` didn't show when **approvals are waiting**, when a shift is **blocked** by the free-tier
cap, or that work was in flight. Added a pending-approvals pill (→ dashboard), a blocked banner, and a
busy state on the Run button. ([delegation page](../app/delegation/page.tsx))

### ✅ G5 — Run button under-guarded (H5)

The dashboard Run button only disabled on `working === "shift"`; tightened to `working !== null` so it
can't fire mid-transition. ([dashboard Operating](../app/dashboard/page.tsx))

---

## 3 · Findings — also FIXED (follow-up pass)

### ✅ N1 — Chat now actually queues approvals (H2 — the most important one)

**Before:** the co-founder replied *"I'll queue it for your approval"* but **no `ApprovalItem` was ever
created** — the system claimed an action it didn't take. **After:** [`detectChatApproval`](../lib/roomie/server.ts)
runs deterministic intent detection (spend / deploy / outreach / delete) on every chat message; the API
passes the approval seed back in an `x-roomie-approval` header alongside the streamed reply
([route.ts](../app/api/roomie/route.ts)); [`ChatTab`](../app/dashboard/page.tsx) calls the new
[`useRoomie.addApproval`](../lib/roomie/useRoomie.ts) so the item **really lands in the Approval Inbox**,
with an in-thread confirmation and a count badge on the Operations tab. Covered by the smoke suite
(`chat queued an approval` / `benign chat queued nothing`).

### ✅ N2 — Autopilot pause is now visible (H1)

Extracted `AUTOPILOT_PAUSE_AT` (= 3) so the interval guard and a new derived `autopilotPaused` flag
can't drift ([useRoomie.ts](../lib/roomie/useRoomie.ts)). The dashboard shows an amber
*"Autopilot paused — N approvals are waiting"* banner + toggle state, and `/delegation` mirrors it.

### ✅ N3 — Validation steps now reflect real progress (H1)

[`ValidationRunning`](../app/dashboard/page.tsx) walks its five steps over the actual ~1.9s validate
window — done (✓) / current (spinner) / pending (dim) — instead of showing everything checked instantly.

### 🟡 N4 — "Hold for now" has a quiet exit, "Approve" now doesn't return (H3)

Approve correctly takes you to the floor; add a persistent "← Back to the Glass Box" affordance there
(the top-bar Dashboard link covers this, but a post-shift "Review in the Glass Box →" nudge would close
the loop).

---

## 4 · Verification

- `tsc --noEmit` → ✅ clean.
- `npm run qa` → ✅ **SMOKE PASSED** (all routes 200 incl. `/delegation`, 60 fuzz payloads → zero 5xx).
- Browser walkthrough: onboard an idea → validate → **Approve build** → lands on `/delegation`, MVP
  ships, first shift auto-runs, the acting agent speaks, the live ticker updates. Double-clicking
  Approve no longer double-charges (G2/G3).

---

*Audited against Nielsen's 10 Usability Heuristics. Every transition should tell the user what just
happened — and do exactly what it says.*
