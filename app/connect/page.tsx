import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { connectionMapStatus, TIER_LABELS, TIER_ORDER, type ConnectionStatus, type ConnectionTier } from "@/lib/core/connections";
import { mcpStatus } from "@/lib/core/mcp-connect";
import { accountSummary, nextStep } from "@/lib/core/accounts";
import { trialOffer } from "@/lib/core/trial";
import { oauthProviderFor, getProvider } from "@/lib/core/oauth";
import { envelopeStatus, spendDepartments } from "@/lib/core/treasury";
import { listEnvelopes } from "@/lib/engine/treasury-db";
import { getServerSupabase } from "@/lib/supabase/server";
import { POLICY } from "@/lib/core/policy";
import TreasuryPanel, { type EnvelopeView } from "@/components/connect/TreasuryPanel";

// /connect — THE FRONT DOOR (Block B, CONNECT-FIRST-RESET §2.1, ADR-0004).
// The 17-service connection map as a checklist with LIVE status. Connect T0 and the company starts;
// everything else the org ASKS for when a task truly needs it. Monochrome dark canvas (ADR-0016):
// charcoal, light ink, hairlines, mono uppercase labels — token classes only.
//
// HONESTY RULES (load-bearing):
//  - A service shows connected ONLY when its env var is actually present in this deployment — never assumed.
//  - Entries with no env detection say so ("tracked, not detected") instead of pretending.
//  - OAuth buttons render ONLY for ARMED providers (founder registered the app + client env vars set,
//    ADR-0010) — an unarmed provider shows the env-var path instead. No dead buttons, ever.
//  - Server component reading process.env at REQUEST time (force-dynamic): this page reflects the FOUNDER
//    deployment's state (company #0). Per-customer key vaults come later.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "competitor.inc — connect",
  description: "Connect your accounts. The company runs itself. The full connection map, with live status.",
};

const INK = "text-text";
const HAIR = "border-border";

function Dot({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${on ? "bg-text" : "border border-text bg-transparent"}`}
    />
  );
}

function Row({ c }: { c: ConnectionStatus }) {
  return (
    <li className={`border-t ${HAIR} py-5`}>
      <div className="flex items-start gap-3">
        <Dot on={c.configured} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[15px] font-semibold tracking-tight">{c.name}</span>
            {c.required && (
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2">required</span>
            )}
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.2em]">
              {c.configured ? "connected" : "not connected"}
              <span className="sr-only">{c.configured ? " — env var present" : " — env var absent"}</span>
            </span>
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{c.purpose}</p>
          <p className="mt-2 text-[13px] leading-relaxed">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2">
              {c.configured ? "unlocked — " : "without it — "}
            </span>
            {c.configured ? c.unlocks : c.degraded}
          </p>
          {/* OAuth: the "2 minutes" path — button renders ONLY when the founder armed the provider
              (client env vars present), so it can never dead-end. Env keys remain the always-works path. */}
          {!c.configured && oauthProviderFor(c.id) && (
            <p className="mt-3">
              <a
                href={`/api/oauth/${oauthProviderFor(c.id)!.id}/start`}
                className="inline-block border border-text px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors hover:bg-text hover:text-bg"
              >
                Connect {oauthProviderFor(c.id)!.name} →
              </a>
              <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2">
                ~2 minutes · token stored encrypted, yours to revoke
              </span>
            </p>
          )}
          {c.env.length > 0 ? (
            <p className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2">
                {c.env.length > 1 ? "set any of" : "set"}
              </span>
              {c.env.map((e) => (
                <code key={e} className={`border ${HAIR} px-1.5 py-0.5 font-mono text-[11px]`}>{e}</code>
              ))}
            </p>
          ) : (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2">
              no env detection — tracked, not detected
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

export default async function ConnectPage({ searchParams }: { searchParams: Promise<{ connected?: string; error?: string }> }) {
  const sp = await searchParams;
  const justConnected = sp.connected ? getProvider(sp.connected)?.name ?? null : null;
  const oauthError = typeof sp.error === "string" ? sp.error.slice(0, 200) : null;
  const map = connectionMapStatus();
  const connected = map.filter((c) => c.configured).length;
  const total = map.length;
  const pct = Math.round((connected / total) * 100);
  const mcp = mcpStatus();
  const mcpConnected = mcp.filter((m) => m.configured).length;
  const byTier = (t: ConnectionTier) => map.filter((c) => c.tier === t);

  // ACCOUNTS, NOT SERVICES. Nineteen capabilities map onto nine accounts a human actually opens, and
  // only ONE of them is ever required. Leading with the full map made a one-key product read as a
  // nineteen-chore product, which is exactly how it felt to the founder reading its own page.
  const configuredIds = map.filter((c) => c.configured).map((c) => c.id);
  const accounts = accountSummary(configuredIds);
  const step = nextStep(configuredIds);

  // The bank (ADR-0020): the signed-in owner's department envelopes — the standing authorization that
  // lets in-budget spend run silently. Signed out (or no Supabase) → honest $0 defaults, nothing invented.
  const sb = await getServerSupabase();
  const { data: auth } = sb ? await sb.auth.getUser() : { data: { user: null } };
  const saved = sb && auth?.user ? await listEnvelopes(sb, auth.user.id).catch(() => []) : [];
  const savedByDept = new Map(saved.map((e) => [e.department, e]));
  const envelopes: EnvelopeView[] = spendDepartments().map((d) => {
    const env = savedByDept.get(d) ?? { department: d, monthlyCapUsd: 0, spentThisMonthUsd: 0 };
    return { ...env, ...envelopeStatus(env) };
  });

  return (
    <div className={`min-h-screen bg-bg ${INK}`}>
      {/* ADR-0009: the shared site chrome replaces the bespoke header/footer — one nav everywhere. */}
      <SiteHeader />
      {justConnected && (
        <div className={`border-b ${HAIR} bg-text px-6 py-3 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-bg`}>
          {justConnected} connected — token stored encrypted, yours to revoke any time
        </div>
      )}
      {oauthError && (
        <div className={`border-b border-text px-6 py-3 text-center font-mono text-[11px] uppercase tracking-[0.2em]`}>
          Connection failed — {oauthError.replace(/_/g, " ")} · nothing was stored
        </div>
      )}

      {/* Hero */}
      <section className={`border-b ${HAIR} px-6 py-14`}>
        <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-2">
          {accounts.connected} of {accounts.total} accounts connected
        </p>
        <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl">
          Connect your accounts.<br />The company runs itself.
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">
          One model key is all that is ever required. Everything else waits until a task actually needs it,
          and then asks for one thing, once. BYOK: your accounts, your keys, your ownership.
        </p>

        {/* THE ONE NEXT THING. Just-in-time consent, implemented rather than promised. */}
        <div className={`mt-8 max-w-2xl border ${HAIR} p-5`}>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-2">
            {step ? "your next step · one thing" : "nothing left to connect"}
          </p>
          {step ? (
            <>
              <p className="mt-3 text-lg font-semibold tracking-tight">{step.account.action}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.because} {step.account.why}</p>
              <a
                href={step.account.signupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block border border-text px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] hover:bg-text hover:text-bg"
              >
                open {step.account.name}
              </a>
            </>
          ) : (
            <p className="mt-3 text-lg font-semibold tracking-tight">Everything is connected.</p>
          )}
          <p className="mt-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.15em] text-muted-2">
            {trialOffer()}
          </p>
        </div>

        {/* Progress rule */}
        <div className="mt-10">
          <div className="h-[3px] w-full bg-text/10">
            <div className="h-[3px] bg-text" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2">
            {accounts.connected} of {accounts.total} accounts · {connected} of {total} capabilities
          </p>
        </div>

        <p className="mt-8 max-w-2xl font-mono text-[10px] uppercase leading-relaxed tracking-[0.15em] text-muted-2">
          Live status of this deployment&apos;s environment (company #0). A service shows connected only when its
          env var is actually present — never assumed. Per-customer key vaults come in a later block.
        </p>
      </section>

      {/* Tier sections */}
      {TIER_ORDER.map((t) => (
        <section key={t} className={`border-b ${HAIR} px-6 py-10`}>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.25em]">
              {t} · {TIER_LABELS[t].title}
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2">
              {TIER_LABELS[t].when}
            </span>
          </div>
          <ul>
            {byTier(t).map((c) => (
              <Row key={c.id} c={c} />
            ))}
          </ul>
        </section>
      ))}

      {/* The treasury — the bank for the 56 (ADR-0020) */}
      <section className={`border-b ${HAIR} px-6 py-10`}>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.25em]">the treasury · the bank for the 56</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2">standing authorization</span>
        </div>
        <p className="mb-2 max-w-2xl text-[13px] leading-relaxed text-muted">
          Set each department&apos;s monthly budget once. In-budget spend runs silently — no Slack ping, no
          per-item approval. Anything over the budget (or over ${POLICY.spend.perTransactionCapUsd} in a single
          transaction) escalates to you before a dollar moves. Agents debit within your envelopes against your
          OWN connected accounts — competitor.inc never holds or moves your funds.
        </p>
        <TreasuryPanel envelopes={envelopes} signedIn={Boolean(auth?.user)} perTxnCap={POLICY.spend.perTransactionCapUsd} />
      </section>

      {/* The MCP long tail */}
      <section className={`border-b ${HAIR} px-6 py-10`}>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.25em]">the long tail · anything with an MCP server</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2">
            {mcpConnected} of {mcp.length} connected
          </span>
        </div>
        <p className="mb-2 max-w-2xl text-[13px] leading-relaxed text-muted">
          Beyond the 17: any service with an MCP server plugs into one governed pipe. Every tool call passes the
          kill switch, the policy floor, and the audit ledger before any network I/O.
        </p>
        <ul>
          {mcp.map((m) => (
            <li key={m.id} className={`border-t ${HAIR} py-5`}>
              <div className="flex items-start gap-3">
                <Dot on={m.configured} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-[15px] font-semibold tracking-tight">{m.name}</span>
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.2em]">
                      {m.configured ? "connected" : "not connected"}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{m.purpose}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2">set</span>
                    <code className={`border ${HAIR} px-1.5 py-0.5 font-mono text-[11px]`}>{m.urlEnv}</code>
                    {m.tokenEnv && (
                      <>
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2">+ optional</span>
                        <code className={`border ${HAIR} px-1.5 py-0.5 font-mono text-[11px]`}>{m.tokenEnv}</code>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* The BYOK honesty note stays with the content; the site footer is shared (ADR-0009). */}
      <section className="px-6 py-8">
        <p className="max-w-2xl font-mono text-[10px] uppercase leading-relaxed tracking-[0.15em] text-muted-2">
          BYOK — set env vars in your deployment; there are no OAuth flows yet (later block), so this page never
          shows one. Nothing here is claimed connected unless its env var is present.
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
