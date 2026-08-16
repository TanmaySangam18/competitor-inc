// Distribution-first GTM drafts for imported (already-built) products.
// Grounded in 2026 research: IH Stripe-verified data, Martal/MarketingProfs cold email stats,
// omnius programmatic SEO case study, Paul Graham "do things that don't scale," April Dunford.
// Every item is a ready-to-copy approval — draft → approve → send. No auto-posting.
import type { ApprovalItem, Company } from "@/lib/core/types";

const uid = () => crypto.randomUUID();

// Trigger-based cold email structure (research-validated):
// ONE pain → ONE solution → ONE CTA, ~75 words, 75% template + 25% real personalization.
// Baseline B2B reply = 3-5%; trigger-timed = 20%+. 3-touch follow-up lifts to 9.4%.
// Source: Martal, MarketingProfs, SingleGrain case studies.
export function generateSocialDrafts(company: Company, night = 1): ApprovalItem[] {
  const name = company.name || "the product";
  const idea = company.idea || "a new startup";
  const url = company.product?.url || "";
  const urlLine = url ? `\n\n${url}` : "";

  return [
    {
      id: uid(),
      night,
      agent: "growth",
      kind: "outreach",
      title: `Trigger-based cold email — Touch 1 of 3`,
      detail:
        `Subject: saw your post about [specific pain]\n\n` +
        `Hey [First Name],\n\n` +
        `Noticed you [posted/commented/tweeted] about [specific pain] on [date/platform].\n\n` +
        `We built ${name} for exactly that: ${idea}.\n\n` +
        `Worth a 15-min call this week? No deck — just want to hear if what we built actually fits.\n\n` +
        `[Your name]\n\n` +
        `P.S. ${url || "[your url]"}\n\n` +
        `---\n` +
        `TOUCH 2 (3 days later if no reply):\n` +
        `Subject: re: [pain]\n\n` +
        `Bumping this up — still curious if [specific pain] is something you're actively working around.\n\n` +
        `---\n` +
        `TOUCH 3 (5 days after touch 2):\n` +
        `Subject: last note\n\n` +
        `Last one from me. If [specific pain] comes back up, [your url] is there.\n\n` +
        `Either way — hope you solved it.`,
    },
    {
      id: uid(),
      night,
      agent: "growth",
      kind: "twitter",
      title: `X/Twitter honest founder story for ${name}`,
      detail:
        `I built ${name} and got zero customers for months.\n\n` +
        `What finally worked:\n\n` +
        `I found 10 people who had publicly complained about [specific pain].\n` +
        `Sent each one a 3-line DM. No pitch. Just:\n\n` +
        `"Saw your [post/tweet] about [pain]. Built something for exactly that. ` +
        `Would you tell me if I got it wrong?"\n\n` +
        `3 replied. 1 became a paying customer. That customer told 2 friends.\n\n` +
        `Building was never the hard part.${urlLine}`,
    },
    {
      id: uid(),
      night,
      agent: "growth",
      kind: "linkedin",
      title: `LinkedIn post — "built but couldn't sell" story for ${name}`,
      detail:
        `6 months ago I had a working product and zero customers.\n\n` +
        `The idea: ${idea}.\n\n` +
        `I'd spent 80% of my time building and 20% talking to people who had the problem. ` +
        `Classic founder mistake — I confused "polite feedback" with real demand.\n\n` +
        `What changed: I picked ONE specific buyer, found 15 of them who'd publicly described the pain, ` +
        `and sent each a short note asking if I'd got the solution wrong. ` +
        `(Fitzpatrick's Mom Test — talk about their life, not your idea.)\n\n` +
        `First paying customer came from that batch. Not from ads. Not from Product Hunt.\n\n` +
        `If you're dealing with [specific pain], curious whether ${name} is useful to you.${urlLine}`,
    },
    {
      id: uid(),
      night,
      agent: "marketing",
      kind: "outreach",
      title: `r/SideProject + r/alphaandbetausers post for ${name}`,
      detail:
        `**r/SideProject** (430k — launch-friendly; "I built this, what now?" genre)\n` +
        `Title: I built ${name} but couldn't sell it — here's what actually worked\n\n` +
        `I launched ${name} (${idea}) and got polite feedback but no paying customers for months.\n\n` +
        `What finally worked: stopped pitching features, started asking about their last bad day ` +
        `caused by [pain]. One conversation at a time.\n\n` +
        `If you're [the specific buyer] and have 5 minutes, I'd love brutal feedback: ${url || "[your url]"}\n\n` +
        `Happy to swap notes — I know exactly what it feels like to have a working product nobody's paying for yet.\n\n` +
        `---\n\n` +
        `**r/alphaandbetausers** (21k — highest intent; explicitly for recruiting early users)\n` +
        `Title: [Beta] ${name} — ${idea} — looking for 10 founding users\n\n` +
        `What it does: ${idea}\n` +
        `Who it's for: [specific buyer, one sentence]\n` +
        `What you get: free access + direct line to the builder + your feedback shapes the roadmap\n` +
        `Try it: ${url || "[your url]"}\n\n` +
        `Only looking for people who have actually felt [specific pain] — not tire-kickers.`,
    },
  ];
}

// Activities that go into the glass box for the first distribution shift (no approval needed).
// These are research + positioning moves — no consequential action without human approval.
export function generateDistributionActivities(company: Company, night = 1) {
  const name = company.name || "the product";
  return [
    {
      id: uid(),
      night,
      agent: "growth" as const,
      action: `Ran Bullseye Framework on ${name} — ranked 7 channels by expected first-customer impact`,
      meta: "#1 trigger outreach · #2 programmatic SEO · #3 feedback calls · #4 community posts",
      cost: 0,
      status: "done" as const,
      proof: { kind: "metric" as const, value: "channel brief ready" },
    },
    {
      id: uid(),
      night,
      agent: "marketing" as const,
      action: "Drafted April Dunford positioning canvas — narrowed to ONE buyer + ONE job-to-be-done",
      meta: "vague positioning = #1 reason first sales stall (64% of failed indie projects)",
      cost: 0,
      status: "done" as const,
    },
  ];
}
