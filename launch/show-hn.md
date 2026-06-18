# Show HN

**Title (≤80 chars, no emoji, no "Show HN: " is added by the form):**

> Show HN: competitor.inc – an AI co-founder that tells you not to build your idea

**URL:** https://[yourdomain]

**Body (first comment — keep it plain and honest, HN hates hype):**

I kept seeing "AI that builds and runs your whole company" tools. They're fast, but they'll happily
spend weeks (and your money) building something nobody wants — the reviews are full of it.

So I flipped it. competitor.inc is validation-first: you describe an idea, and before it writes a line of
product code it runs real demand experiments — a landing page + waitlist, a fake-door test, a small
ad smoke-test (on *your* budget), and search-demand — then gives you an evidence-backed verdict with
a confidence score. Sometimes that verdict is "don't build this," and it means it.

Only after you approve does it build the winner, and everything it does lands in a "Glass Box" audit
log — every action, every dollar — with approvals required for anything consequential (spend,
outreach, deploys) and one-click undo.

Some deliberate choices:
- BYOK: bring your own model key (Anthropic or any OpenAI-compatible endpoint). Your tokens, your
  bill — so it costs me ~nothing to run and there's no incentive to burn your money.
- No revenue rake, full export, no lock-in.
- Next.js + a small typed engine; the whole thing runs offline in a simulated mode for the demo.

It's early and I'd love the brutal version of your feedback — especially on whether the validation
signals are believable. Happy to answer anything.
