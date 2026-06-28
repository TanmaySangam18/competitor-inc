# Founder Playbook — competitor.inc (private)

A compounding operating manual for the founder: strategic lessons captured during the build, written to
help you lead a company 100× larger. **Internal — not the public Playbooks tab** (that's a neutral user
resource; this is for you). Newest notes on top. Each is practical and rooted in a real decision we made.

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
