// Distribution-first GTM drafts for imported (already-built) products.
// Every item is a ready-to-copy approval — the founder reviews, copies, and posts manually.
// No auto-posting. No fabricated engagement numbers.
import type { ApprovalItem, Company } from "./types";

const uid = () => crypto.randomUUID();

// Five proven first-customer channels as approval drafts.
// "detail" = the actual post/email copy, ready to copy-paste.
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
      kind: "twitter",
      title: `X/Twitter launch post for ${name}`,
      detail:
        `I built ${name} — ${idea}.\n\n` +
        `I couldn't sell it at first. Here's what I learned:\n\n` +
        `• The positioning was too broad\n` +
        `• I was pitching features, not the outcome\n` +
        `• The first paying customer came from one honest DM, not ads\n\n` +
        `If you've hit [specific pain point], it's worth a look.${urlLine}`,
    },
    {
      id: uid(),
      night,
      agent: "growth",
      kind: "linkedin",
      title: `LinkedIn post for ${name}`,
      detail:
        `6 months ago I started building ${name}.\n\n` +
        `The idea: ${idea}.\n\n` +
        `What I got wrong: I spent 80% of my time building and 20% talking to people who had the problem.\n\n` +
        `Flipping that ratio is what got us the first customers.\n\n` +
        `If you're a [target user] dealing with [specific pain], I'd love to hear what's not working for you — no pitch, just curiosity.${urlLine}`,
    },
    {
      id: uid(),
      night,
      agent: "growth",
      kind: "outreach",
      title: `Trigger-based DM template for ${name}`,
      detail:
        `Hey [name],\n\n` +
        `Saw you posted about [specific pain] last week — that's exactly the problem ${name} is built for.\n\n` +
        `${idea}.\n\n` +
        `Would a 15-min call make sense? No deck, just want to understand if what we built actually solves it for you.${urlLine}`,
    },
    {
      id: uid(),
      night,
      agent: "marketing",
      kind: "outreach",
      title: `r/SideProject honest story post`,
      detail:
        `Title: I built ${name} but couldn't sell it — here's what actually got the first customer\n\n` +
        `Body:\n` +
        `[${idea}]\n\n` +
        `I built the whole thing before talking to anyone. Classic mistake.\n\n` +
        `What finally worked: I found 10 people who tweeted about [the specific pain], sent each a handwritten note (no pitch), ` +
        `and asked if I could watch them try to solve it. Three replied. One became a paying customer.\n\n` +
        `The product is live at: ${url || "[your url]"}\n\n` +
        `Happy to share more about what worked / what didn't if useful.`,
    },
  ];
}

// Activities that go into the glass box for the first distribution shift (no approval needed).
export function generateDistributionActivities(company: Company, night = 1) {
  const name = company.name || "the product";
  return [
    {
      id: uid(),
      night,
      agent: "growth" as const,
      action: `Mapped 5 distribution channels with the highest ROI for ${name}`,
      meta: "positioning · trigger outreach · programmatic SEO · community · referral",
      cost: 0,
      status: "done" as const,
      proof: { kind: "metric" as const, value: "channel map ready" },
    },
    {
      id: uid(),
      night,
      agent: "marketing" as const,
      action: "Drafted headline variants narrowed to ONE user and ONE job (April Dunford positioning)",
      meta: "vague positioning is the #1 reason first sales stall",
      cost: 0,
      status: "done" as const,
    },
  ];
}
