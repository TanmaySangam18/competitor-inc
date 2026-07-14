// lib/core/showcase.ts — THE PROOF STRIP source (the scrolling product banner).
//
// HONESTY FLOOR ([[crack-audit-and-no-fake-proof]]): this shows ONLY what is real. Pre-launch there are no
// customer products, so we do NOT invent any — the marquee shows the platform's OWN real, live surfaces
// (competitor.inc runs on itself), each a real route you can open. When real customer products ship, they
// join here from a real registry; until then the `customer` bucket is honestly empty and the UI says so.

export interface ShowcaseItem {
  name: string;
  blurb: string;
  href: string;
  kind: "platform" | "customer";
}

// Platform surfaces — every one is a real route built in this repo (the company, running on itself).
export const SHOWCASE: ShowcaseItem[] = [
  { name: "The Team Room", blurb: "Watch the AI company deliberate a decision, live", href: "/room", kind: "platform" },
  { name: "Services", blurb: "Hire the company — build, support, sales & more", href: "/services", kind: "platform" },
  { name: "The Org", blurb: "All 56 agents, their jobs, and who they report to", href: "/org", kind: "platform" },
  { name: "Control Room", blurb: "The safety gate, kill switch, and audit ledger", href: "/review", kind: "platform" },
];

export function listShowcase(): ShowcaseItem[] {
  return SHOWCASE;
}

// True until a real customer product is live — the UI uses this to stay honest ("customer products ship
// here"), never to fake a portfolio.
export function hasCustomerProducts(): boolean {
  return SHOWCASE.some((s) => s.kind === "customer");
}
