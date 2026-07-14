# REGISTRY.md — Accounts · Domains · Keys (the live inventory)

**What this is (INFRASTRUCTURE §8):** the single source of truth for every account, domain, and key the
company uses — what it is, who holds root, which agents get scoped access, its renewal date, and how to kill
it. The Auditor (ORG role) samples this monthly against reality. **No credential is ever created outside the
vault; no secret ever appears in this file, in code, in prompts, or in logs — names and ownership only.**

**Status legend:** ✅ provisioned · ⬜ not yet · 🔒 founder-only (KYC/ToS/legal).

_Founder fills the real rows; I keep the structure + the "agents receive" column honest to each role's JD._

---

## Crown jewels — human-only, never agent-accessible
| Resource | Status | Root held by | Agents receive | Kill procedure |
|---|---|---|---|---|
| Business entity / EIN | ⬜ 🔒 | Human (+lawyer) | Nothing | n/a |
| Business bank account + payment rails | ⬜ 🔒 | Human (KYC) | Read-only feed → Bookkeeper | Freeze at bank |
| Domain registrar | ⬜ 🔒 | Human (registry lock + hw 2FA) | Nothing | Registrar lock (on paper + vault kit) |
| DNS (e.g. Cloudflare) | ⬜ 🔒 | Human | Scoped token: subdomain records only | Revoke token |
| Email domain (Workspace super-admin) | ⬜ 🔒 | Human | Per-agent send-as mailboxes | Suspend mailbox |
| Secrets vault root / unseal keys | ⬜ 🔒 | Human (unseal keys offline) | Scoped short-lived tokens | **Seal vault = global stop** |
| Model-provider org accounts (≥2) | ⬜ 🔒 | Human (ToS) | Per-agent keys w/ spend caps | Revoke key = agent cognition stops |
| Cloud org root (AWS/GCP) | ⬜ 🔒 | Human (root sealed) | IAM roles per agent; staging ≠ prod | IAM deny-all on agent roles |
| GitHub/GitLab org owner | ⬜ 🔒 | Human | Per-agent machine accounts, repo-scoped, branch-protected | Revoke machine account |
| Insurance policies | ⬜ 🔒 | Human | Policy summaries in ground truth | n/a |
| Two hardware keys (owner + sealed backup) | ⬜ 🔒 | Human | Nothing | n/a |

## Operational accounts (agent-scoped per JD)
| Resource | Status | Root held by | Agents receive | Kill procedure |
|---|---|---|---|---|
| Transactional email (Resend/Postmark) | ⬜ 🔒 (T3 contract) | Human approves | Scoped API key, rate-limited | Revoke key |
| Stripe (Connect) | ⬜ 🔒 (verification) | Human | **Restricted keys only** (charge-create ≠ refund ≠ payout) | Pause restricted keys = money stops |
| Accounting (QuickBooks/Xero) | ⬜ 🔒 | Human | Read-only for Finance Controller + Bookkeeper | Revoke read token |
| Monitoring/logging (Sentry/Grafana) | ⬜ | Agent proposes, T3 approve | Write keys for SRE; read for Auditor | Revoke keys |
| Analytics / CRM / status page | ⬜ | Agent proposes T2/T3 | Role-scoped per JD | Revoke keys |

## Platform-owned (competitor.inc as company #0)
| Resource | Status | Notes |
|---|---|---|
| Primary domain | ⬜ 🔒 | registry-locked, auto-renew ON, calendar the renewal |
| Per-customer subdomains (`customer.platform.com`) | ⬜ | isolated per customer; custom domains stay customer-owned (task #79) |
| Supabase project (nfxqlyidxrncfawakhuw) | ✅ | per-user RLS; the current data layer |
| Vercel deploy (competitor-inc-zeta) | ✅ | see [[founder-vercel-deploy]] |

---

## Break-glass order (INFRASTRUCTURE §6 — write it, print it, test it quarterly)
1. **Seal the vault** → all agent credentials die within token TTL.
2. **Revoke model-provider API keys** → all agent cognition stops.
3. **Pause Stripe restricted keys** → money stops moving.
4. **Cloud IAM deny-all on agent roles** → infrastructure actions stop.
5. Registrar + DNS untouched by design (agents never had them). Backup human has a sealed copy + hardware key
   + recovery codes. **Test the full sequence quarterly in the simulation harness** (Tier A3).

_The software counterpart of steps 1–4 is the out-of-band kill switch (Tier A1). This file is the human/paper
side; the kill switch is the code side. Both must exist._
