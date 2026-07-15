// lib/core/domains.ts — LEGAL DOMAIN PROVISIONING (the domain-agent's brain).
//
// The agent that helps a customer get an address: suggest names, then register on a LEGAL rail. We do NOT
// use "free domain forever" projects (is-a.dev and friends) — their terms forbid commercial use, so using
// them for the platform or a paying customer would be a violation. Only two rails:
//   1. platform-subdomain — free, `name.competitor.inc` via Vercel for Platforms (commercial use allowed).
//   2. custom-registrar — the customer's own domain on a real registrar (~$10/yr), on their account.
// Keyless: this proposes names + the ordered plan; the actual DNS/registrar calls wire at the connect phase.

export function slugify(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

// Suggest available-looking name options from a product idea (deterministic; the agent offers these or the
// customer types their own). Subdomain candidates are what we can actually grant for free.
export function suggestNames(product: string): string[] {
  const base = slugify(product) || "app";
  const head = base.split("-")[0];
  const cands = [base, `${base}-app`, `get-${head}`, `${head}-hq`, `try-${head}`, `use-${head}`];
  return [...new Set(cands)].filter(Boolean).slice(0, 6);
}

export type DomainRail = "platform-subdomain" | "custom-registrar";

export interface DomainPlan {
  choice: string;
  rail: DomainRail;
  address: string; // the resulting URL host
  steps: string[];
  legalNote: string;
}

export function provisionPlan(choice: string, opts: { rail?: DomainRail; platformRoot?: string } = {}): DomainPlan {
  const name = slugify(choice) || "app";
  const rail = opts.rail ?? "platform-subdomain";
  const root = opts.platformRoot ?? "competitor.inc";
  if (rail === "custom-registrar") {
    return {
      choice: name, rail, address: `${name}.com`,
      steps: [
        `Check ${name}.com availability at a real registrar (Cloudflare/Namecheap).`,
        "Customer registers it on THEIR OWN account (~$10/yr) — they own it outright.",
        "Point DNS at the product deploy; certificate is automatic.",
        "Record it in REGISTRY.md (owner = customer; we hold only a scoped DNS token).",
      ],
      legalNote: "Customer-owned on a commercial-OK registrar. We never hold their domain (liability + clean exit).",
    };
  }
  return {
    choice: name, rail, address: `${name}.${root}`,
    steps: [
      `Reserve ${name}.${root} (free) via Vercel for Platforms.`,
      "Bind it to the customer's product deploy; certificate is automatic.",
      "Record it in REGISTRY.md; the customer can upgrade to a custom domain anytime.",
    ],
    legalNote: "Vercel for Platforms subdomains allow commercial use. NOT a free-domain-repo (those forbid commercial use).",
  };
}
