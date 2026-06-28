# Founder Playbook — competitor.inc (private)

A compounding operating manual for the founder: strategic lessons captured during the build, written to
help you lead a company 100× larger. **Internal — not the public Playbooks tab** (that's a neutral user
resource; this is for you). Newest notes on top. Each is practical and rooted in a real decision we made.

---

**Founder Playbook Note — Kill setup friction, but never trade the trust wedge for it.** (2026-06-27)
The question "when a customer enters an idea, do we auto-provision their Vercel/Supabase, or guide them
once?" is really a strategy question in disguise. For *first-time founders*, setup friction is the #1 killer
of activation — every account they have to create is a place they quit. So the default must be **zero-setup:
validation needs nothing (we host the demand test on our domain), and to build, we host their app on our
infra so it "just works."** BUT our wedge is *own everything / 0% rev share* — so we preserve it with
**one-click eject + a one-time OAuth "connect your own Vercel/Supabase"** for those who want ownership from
day one. The hard line: **never silently create accounts in a user's name or enter their credentials** —
that's a ToS + trust violation, and it's the exact thing our own product refuses to do. So the honest answer
is "automated *after* a one-time Authorize *you* click," and the product guides that one step, once. Lesson:
when "make it effortless" collides with a core promise, don't pick one — find the design (host-by-default +
eject) that delivers both. The moat is the promise; the growth is the friction you remove around it.

**Founder Playbook Note — Plan in blocks before you build (shape the work).** (2026-06-27)
The founder's instinct — "decide and plan things into blocks before proceeding" — is the **Shape Up**
discipline, and it's right. Before touching code: shape each piece into a fixed-appetite bet with a clear
"done," slice it vertically (ship something usable, not a half-built layer), and set a circuit-breaker so no
block balloons. It keeps the C-suite honest: every block must name the metric it moves (activation / revenue
/ ROI / retention / defensibility) or it doesn't get built. Planning first isn't bureaucracy — it's how you
avoid building the wrong thing well.

---

**Founder Playbook Note — Build the cash register before the showroom.** (2026-06-27)
We had a polished product — validation, the crew, the Glass Box, ChatOps — and **$0 of revenue plumbing**
that actually worked end-to-end. The charter was right to make LemonSqueezy priority #1. Lesson: revenue
infrastructure is not a "later" task you bolt on once the product is pretty. It's the instrument that lets
every *other* decision be judged against willingness-to-pay. Build it early, make it lifecycle-complete
(renewals, failed payments, cancellations — not just "first checkout"), and design it so production creds
are an env-var swap. A product with no working way to charge is a hobby, however good it looks.

**Founder Playbook Note — Own the path from commit to live.** (2026-06-27)
We nearly couldn't ship: the Vercel CLI silently stalled every deploy at `UNKNOWN` from this environment,
and we burned real time before switching to **Git push → server-side build (~24s)**. Lesson: your shipping
pipeline is business-critical infrastructure, not a convenience. If you can't reliably get code from commit
to customers, nothing else matters. Pick the most robust path (Git-triggered builds), make it the default,
and don't let a flaky tool become a single point of failure. Shipping reliability compounds — it's how fast
you can respond to customers and competitors.

**Founder Playbook Note — Eat your own philosophy.** (2026-06-27)
Our product's wedge is *validate before you build* + *human approves the irreversible move*. We applied both
to ourselves: a competitor-radar that validates the market daily before we react; a "I drive, you click the
final button" model for account setup that mirrors our own Approval Inbox; and an agent audit that asks
"would we build this agent today?" before defending it. Lesson: the disciplines you sell are the disciplines
that make *you* durable. When your internal operating system and your product thesis are the same thing, the
company gets more coherent and the story gets more credible — you're the first proof case.
