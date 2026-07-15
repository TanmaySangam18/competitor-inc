// lib/core/connections.ts — THE CONNECTIONS REGISTRY (answers "what do I flip when I go live?").
//
// Two sets. FOUNDER: what competitor.inc itself needs to go live (company #0). CUSTOMER (BYOK — bring your
// own keys): what each customer connects so THEY fund + own everything — their AI spend, their revenue,
// their domain, their accounts. We never hold their money or their model credits (per-customer isolation +
// Stripe Connect). Each item declares its env var(s) so `connectionStatus()` can honestly report configured
// vs pending. Manual/legal items (bank, lawyer) have no env — they're tracked, not detected.

export type Owner = "founder" | "customer";

export interface Connection {
  id: string;
  name: string;
  owner: Owner;
  purpose: string;
  env: string[]; // env var(s) that indicate it's wired ([] = manual/legal, tracked not detected)
  required: boolean; // required to go live / to run a customer
}

export const CONNECTIONS: Connection[] = [
  // ── Founder: competitor.inc's own switch ──
  { id: "entity-bank", name: "Business entity + bank (KYC)", owner: "founder", purpose: "Legal person + a place revenue can settle", env: [], required: true },
  { id: "vault", name: "Secrets vault", owner: "founder", purpose: "Hold every key; stand up BEFORE any API key", env: ["VAULT_URL", "DOPPLER_TOKEN", "INFISICAL_TOKEN"], required: true },
  { id: "model", name: "Model provider key(s)", owner: "founder", purpose: "The company's cognition (2+ for failover)", env: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY"], required: true },
  { id: "domain-email", name: "Domain + email (SPF/DKIM/DMARC)", owner: "founder", purpose: "The address + deliverable mail", env: ["NEXT_PUBLIC_SITE_URL"], required: true },
  { id: "stripe", name: "Stripe (Connect) verified", owner: "founder", purpose: "Take money to the right account, never pool", env: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"], required: true },
  { id: "legal", name: "Lawyer-signed ToS + AUP + insurance", owner: "founder", purpose: "Liability split + acceptable-use + cover", env: [], required: true },
  { id: "control-secret", name: "Control secret (out-of-band kill switch)", owner: "founder", purpose: "Human-only control-plane auth", env: ["CONTROL_SECRET"], required: true },
  { id: "go-live", name: "Flip MAINTENANCE=0", owner: "founder", purpose: "The last switch — after the gate + drills pass", env: ["MAINTENANCE"], required: true },

  // ── Customer BYOK: they add their keys, they run it ──
  { id: "c-model", name: "Their model API key", owner: "customer", purpose: "THEIR AI spend, not yours", env: [], required: true },
  { id: "c-stripe", name: "Their Stripe account", owner: "customer", purpose: "Product revenue → their own account", env: [], required: true },
  { id: "c-domain", name: "Their domain (or a *.competitor.inc subdomain)", owner: "customer", purpose: "Where their product lives", env: [], required: true },
  { id: "c-socials", name: "Their social/email accounts (consented)", owner: "customer", purpose: "Announce to THEIR OWN audience, as them, disclosed", env: [], required: false },
  { id: "c-github", name: "Their GitHub", owner: "customer", purpose: "Their product's code", env: [], required: false },
  { id: "c-data", name: "Their data sources", owner: "customer", purpose: "For the copilot-on-your-data service", env: [], required: false },
];

export interface ConnectionStatus extends Connection { configured: boolean }

export function connectionStatus(owner?: Owner): ConnectionStatus[] {
  return CONNECTIONS.filter((c) => !owner || c.owner === owner).map((c) => ({
    ...c,
    // env-detectable items report real status; manual/legal (env:[]) can't be detected → false until done.
    configured: c.env.length > 0 && c.env.some((e) => typeof process.env[e] === "string" && process.env[e] !== ""),
  }));
}

// A one-line honest summary for the founder's switch.
export function goLiveReadiness(): { required: number; configured: number; pending: string[] } {
  const founder = connectionStatus("founder").filter((c) => c.required);
  const pending = founder.filter((c) => !c.configured).map((c) => c.name);
  return { required: founder.length, configured: founder.length - pending.length, pending };
}
