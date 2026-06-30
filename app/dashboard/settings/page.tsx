"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mic,
  Users,
  Cpu,
  CreditCard,
  Plug,
  UserCircle,
  Check,
  Download,
  Github,
  Megaphone,
  Mail,
  Globe,
  Lock,
  Bell,
} from "lucide-react";
import { useConfig, validateByok } from "@/lib/engine/config";
import { useAuth } from "@/lib/engine/useAuth";
import { checkoutUrlFor, checkoutLiveFor } from "@/lib/engine/billing";
import { AGENTS, type AgentRole, type ByokConfig } from "@/lib/engine/types";

type Section = "brand" | "agents" | "engine" | "billing" | "integrations" | "account";

const NAV: { id: Section; label: string; icon: typeof Mic }[] = [
  { id: "brand", label: "Brand voice", icon: Mic },
  { id: "agents", label: "Your team", icon: Users },
  { id: "engine", label: "Engine", icon: Cpu },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "account", label: "Account", icon: UserCircle },
];

export default function Settings() {
  const [section, setSection] = useState<Section>("brand");
  const cfg = useConfig();
  const auth = useAuth();

  if (!cfg.hydrated) return null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
        <ArrowLeft size={15} /> Back to dashboard
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Settings</h1>

      <div className="mt-8 grid gap-8 md:grid-cols-[200px_1fr]">
        <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setSection(n.id)}
              className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                section === n.id ? "bg-surface-2 text-text" : "text-muted hover:text-text"
              }`}
            >
              <n.icon size={16} /> {n.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          {section === "brand" && <Brand cfg={cfg} />}
          {section === "agents" && <Agents cfg={cfg} />}
          {section === "engine" && <Engine cfg={cfg} />}
          {section === "billing" && <Billing />}
          {section === "integrations" && <Integrations cfg={cfg} />}
          {section === "account" && <Account auth={auth} resetAllConfig={cfg.reset} />}
        </div>
      </div>
    </div>
  );
}

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl glass-panel p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Brand({ cfg }: { cfg: ReturnType<typeof useConfig> }) {
  return (
    <Card title="Brand voice · soul.md" desc="The DNA every agent inherits — tone, values, and the lines they won't cross.">
      <textarea
        value={cfg.config.soul}
        onChange={(e) => cfg.setSoul(e.target.value)}
        rows={7}
        className="w-full resize-none rounded-xl border border-border bg-bg/50 p-4 text-sm leading-relaxed text-text outline-none focus:border-coral/40"
      />
      <p className="mt-2 flex items-center gap-1.5 text-xs text-mint"><Check size={13} /> Saved automatically</p>
    </Card>
  );
}

function Agents({ cfg }: { cfg: ReturnType<typeof useConfig> }) {
  const roles = Object.keys(AGENTS) as AgentRole[];
  return (
    <Card title="Your team · agents.md" desc="Scoped authority for each agent. Trust comes from constraints — disable any agent or narrow what it may do.">
      <div className="space-y-3">
        {roles.map((role) => {
          const A = AGENTS[role];
          const a = cfg.config.agents[role];
          return (
            <div key={role} className="rounded-xl border border-border bg-bg/40 p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {A.name} <span className="text-muted-2">· {A.label}</span>
                </div>
                <button
                  onClick={() => cfg.toggleAgent(role)}
                  className={`relative h-6 w-11 rounded-full transition ${a.enabled ? "bg-mint" : "bg-surface-2"}`}
                  aria-pressed={a.enabled}
                  aria-label={`Toggle ${A.name}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-bg transition ${a.enabled ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
              <div className="mt-1 text-[11px] text-muted-2">Playbook · {A.playbook}</div>
              <input
                value={a.scope}
                onChange={(e) => cfg.setAgentScope(role, e.target.value)}
                className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted outline-none focus:border-coral/40"
                aria-label={`${A.name} scope`}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Engine({ cfg }: { cfg: ReturnType<typeof useConfig> }) {
  // One control, two choices: our engine (default, nothing to set up) or your own key (full privacy /
  // cost control). "Using your own key" is simply whether a BYOK provider is selected — no separate
  // mode to keep in sync. providerMode is still recorded for continuity but no longer a 3-way puzzle.
  const useOwnKey = !!cfg.config.byok.provider;
  const pickDefault = () => { cfg.setProviderMode("simulated"); cfg.setByok({ provider: "" }); };
  const pickOwnKey = () => { cfg.setProviderMode("private"); if (!cfg.config.byok.provider) cfg.setByok({ provider: "anthropic" }); };
  const radio = (on: boolean) => `mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${on ? "border-coral bg-coral text-bg" : "border-muted-2"}`;
  const shape = validateByok(cfg.config.byok);
  const live = useOwnKey && !!cfg.config.byok.apiKey && shape.ok;
  return (
    <Card title="Choose your AI" desc="Who powers the agents' thinking. Pick one — everything else (validation, your crew, the proof layer) works the same either way. The model is a commodity; competitor.inc is the engine around it.">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={pickDefault}
          className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${!useOwnKey ? "border-coral/50 bg-coral/[0.05]" : "border-border bg-bg/40 hover:border-border"}`}
        >
          <span className={radio(!useOwnKey)}>{!useOwnKey && <Check size={12} />}</span>
          <span>
            <span className="block text-sm font-medium">competitor.inc engine</span>
            <span className="mt-0.5 block text-xs text-muted">Recommended — nothing to set up. Free Lite by default; premium models unlock on a paid plan, funded by your subscription (not your own wallet).</span>
          </span>
        </button>
        <button
          onClick={pickOwnKey}
          className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${useOwnKey ? "border-coral/50 bg-coral/[0.05]" : "border-border bg-bg/40 hover:border-border"}`}
        >
          <span className={radio(useOwnKey)}>{useOwnKey && <Check size={12} />}</span>
          <span>
            <span className="block text-sm font-medium">Bring your own key</span>
            <span className="mt-0.5 block text-xs text-muted">For full privacy or your own cost control — any provider, including a self-hosted open-weight model. Stays in this browser, sent per-request, never stored by us.</span>
          </span>
        </button>
      </div>

      {useOwnKey && (
        <div className="mt-4 rounded-xl border border-border bg-bg/40 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-muted-2">
              Provider
              <select
                value={cfg.config.byok.provider}
                onChange={(e) => cfg.setByok({ provider: e.target.value as ByokConfig["provider"] })}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-coral/40"
              >
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="openai-compatible">OpenAI-compatible — OpenAI / Groq / OpenRouter / self-hosted</option>
              </select>
            </label>
            <label className="block text-xs text-muted-2">
              Model
              <input
                value={cfg.config.byok.model}
                onChange={(e) => cfg.setByok({ model: e.target.value })}
                placeholder="claude-opus-4-8 / gpt-4o-mini / …"
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-coral/40"
              />
            </label>
          </div>
          {cfg.config.byok.provider === "openai-compatible" && (
            <label className="mt-3 block text-xs text-muted-2">
              Base URL <span className="text-muted-2/70">— your provider or self-hosted endpoint</span>
              <input
                value={cfg.config.byok.baseUrl}
                onChange={(e) => cfg.setByok({ baseUrl: e.target.value })}
                placeholder="https://api.groq.com/openai/v1"
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-coral/40"
              />
            </label>
          )}
          <label className="mt-3 block text-xs text-muted-2">
            API key
            <input
              type="password"
              autoComplete="off"
              value={cfg.config.byok.apiKey}
              onChange={(e) => cfg.setByok({ apiKey: e.target.value })}
              placeholder="sk-…"
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-coral/40"
            />
          </label>
          {cfg.config.byok.apiKey && !shape.ok && (
            <ul className="mt-3 space-y-1 rounded-lg border border-coral/30 bg-coral/[0.05] px-3 py-2 text-[11px] text-coral">
              {shape.errors.map((e) => <li key={e}>• {e}</li>)}
            </ul>
          )}
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-2">
            {live ? (
              <><span className="h-1.5 w-1.5 rounded-full bg-mint" /> Live — running on your key.</>
            ) : cfg.config.byok.apiKey && !shape.ok ? (
              <>Key won't be used until the fields above are fixed — falling back to the default engine.</>
            ) : (
              <>Add the API key to go live (free tiers work: Groq, OpenRouter).</>
            )}
          </p>
        </div>
      )}
    </Card>
  );
}

function Billing() {
  const { user } = useAuth();
  const email = user && !user.guest ? (user.email ?? "") : "";
  // Mirrors the public pricing page exactly (single source of truth) so a buyer never sees one price
  // here and another there. Operator routes to the live Polar checkout (email prefilled when signed in);
  // Founder (done-with-you, limited slots) routes to /join to apply.
  const plans = [
    { name: "Validate", price: "$0", tag: "free forever", tier: "", current: true, href: "" },
    { name: "Operator", price: "$39", tag: "/ month", tier: "operator", current: false, href: "/join" },
    { name: "Founder", price: "$299", tag: "/ month", tier: "founder", current: false, href: "/join" },
  ];
  const upgradeHref = (p: { tier: string; href: string }) =>
    p.tier && checkoutLiveFor(p.tier) ? checkoutUrlFor(email, p.tier) : p.href;
  return (
    <Card title="Billing" desc="Flat pricing, no revenue share. Failed work is credited back to your allowance — never charged.">
      <div className="grid gap-3 sm:grid-cols-3">
        {plans.map((p) => (
          <div key={p.name} className={`rounded-xl border p-4 ${p.current ? "border-coral/50 bg-coral/[0.05]" : "border-border bg-bg/40"}`}>
            <div className="text-sm font-semibold">{p.name}</div>
            <div className="mt-1 font-display text-2xl font-bold">{p.price}<span className="ml-1 text-xs font-normal text-muted-2">{p.tag}</span></div>
            {p.current ? (
              <span className="mt-3 inline-block rounded-md bg-mint/12 px-2 py-1 text-[11px] text-mint">Current plan</span>
            ) : (
              <a
                href={upgradeHref(p)}
                className="mt-3 block w-full rounded-lg border border-coral/40 py-1.5 text-center text-xs font-semibold text-coral transition hover:bg-coral/10"
              >
                {p.tier === "operator" && checkoutLiveFor("operator") ? "Upgrade →" : "Apply →"}
              </a>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-2">Same prices as our public pricing page. Operator checkout is live (Polar — merchant of record, your card is never on our servers). Founder is done-with-you and limited to a handful of slots.</p>
    </Card>
  );
}

function Integrations({ cfg }: { cfg: ReturnType<typeof useConfig> }) {
  // Operator-level capabilities (which env keys the deploy has set), read from the gated layer.
  const [caps, setCaps] = useState<Record<string, boolean> | null>(null);
  useEffect(() => {
    let on = true;
    fetch("/api/execute")
      .then((r) => r.json())
      .then((d) => { if (on) setCaps((d?.capabilities as Record<string, boolean>) ?? {}); })
      .catch(() => { if (on) setCaps({}); });
    return () => { on = false; };
  }, []);

  const conn = cfg.config.connections;
  // github/email/ads can be turned on per-user (the founder's own connection below) OR by the
  // operator's env key — either makes it live. model/deploy/payments are operator-level only.
  const userOn: Record<string, boolean> = {
    github: !!conn.githubToken,
    email: !!(conn.resendApiKey && conn.resendFrom),
    ads: !!conn.adsWebhookUrl,
  };

  // `self` = the user can connect it themselves below; otherwise it's operator-level (set via deploy env).
  const items: { key: string; icon: typeof Github; name: string; desc: string; self?: boolean }[] = [
    { key: "model", icon: Cpu, name: "AI model", desc: "Real reasoning — Claude, GPT, gateway, or your own key.", self: true },
    { key: "github", icon: Github, name: "GitHub build", desc: "Forge creates real repos & commits (verified before done).", self: true },
    { key: "deploy", icon: Globe, name: "Deploy", desc: "Real Vercel deploys — a live product URL." },
    { key: "email", icon: Mail, name: "Email", desc: "Outreach, support & the nightly morning summary.", self: true },
    { key: "payments", icon: CreditCard, name: "Payments", desc: "Stripe payment links — you keep 100%." },
    { key: "ads", icon: Megaphone, name: "Ads", desc: "Approved ad spend routed to your own pipeline.", self: true },
  ];

  return (
    <Card title="Integrations" desc="What the agents can do in the real world. Each is OFF until connected — until then agents run in safe simulation. Real actions stay scoped + approval-gated.">
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((i) => {
          const live = !!caps?.[i.key] || !!userOn[i.key];
          const byYou = !caps?.[i.key] && !!userOn[i.key];
          return (
            <div key={i.key} className="flex items-start gap-3 rounded-xl border border-border bg-bg/40 p-4">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${live ? "bg-mint/12 text-mint" : "bg-surface-2 text-muted"}`}><i.icon size={17} /></span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{i.name}</div>
                <div className="text-xs text-muted">{i.desc}</div>
              </div>
              {caps === null ? (
                <span className="text-[11px] text-muted-2">…</span>
              ) : live ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-mint/12 px-2.5 py-1.5 text-xs font-medium text-mint"><Check size={11} /> {byYou ? "Yours" : "Live"}</span>
              ) : i.self ? (
                <a href="#connect-accounts" className="inline-flex items-center gap-1 rounded-lg border border-coral/40 px-2.5 py-1.5 text-xs font-medium text-coral transition hover:bg-coral/10">Connect ↓</a>
              ) : (
                <span title="Operator-level — activates when the deploy's key is set. Hosted plans turn this on for you." className="inline-flex cursor-help items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-2"><Lock size={11} /> Off</span>
              )}
            </div>
          );
        })}
      </div>

      <div id="connect-accounts" className="mt-6 scroll-mt-24 rounded-xl border border-border bg-bg/40 p-4">
        <div className="text-sm font-medium">Connect your own accounts (optional)</div>
        <p className="mt-1 text-xs text-muted">
          Run real actions on <span className="text-text">your own</span> accounts — build in your GitHub,
          email from your domain, route ad spend to your own pipeline. Like your model key, these stay in
          this browser, are sent per-request, and are never persisted by us. Leave blank to stay simulated
          (or to use the operator&apos;s shared keys, if set).
        </p>
        <label className="mt-4 block text-xs text-muted-2">
          GitHub token <span className="text-muted-2/70">— Forge builds repos in your account</span>
          <input
            type="password"
            autoComplete="off"
            value={conn.githubToken}
            onChange={(e) => cfg.setConnections({ githubToken: e.target.value })}
            placeholder="ghp_…"
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-coral/40"
          />
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-muted-2">
            Resend API key <span className="text-muted-2/70">— email from your domain</span>
            <input
              type="password"
              autoComplete="off"
              value={conn.resendApiKey}
              onChange={(e) => cfg.setConnections({ resendApiKey: e.target.value })}
              placeholder="re_…"
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-coral/40"
            />
          </label>
          <label className="block text-xs text-muted-2">
            Resend &ldquo;from&rdquo; address
            <input
              value={conn.resendFrom}
              onChange={(e) => cfg.setConnections({ resendFrom: e.target.value })}
              placeholder="you@yourdomain.com"
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-coral/40"
            />
          </label>
        </div>
        <label className="mt-3 block text-xs text-muted-2">
          Ads webhook URL <span className="text-muted-2/70">— approved spend POSTs here (https only)</span>
          <input
            value={conn.adsWebhookUrl}
            onChange={(e) => cfg.setConnections({ adsWebhookUrl: e.target.value })}
            placeholder="https://hooks.your-pipeline.com/…"
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-coral/40"
          />
        </label>
      </div>
      <p className="mt-4 text-xs text-muted-2">&ldquo;Live&rdquo; = the operator set that key · &ldquo;Yours&rdquo; = running on your own connection · &ldquo;Off&rdquo; = safe simulation. Turning one on authorizes real-world actions; consequential ones still wait in your Approval Inbox.</p>

      <NotifyOptIn cfg={cfg} />
    </Card>
  );
}

function NotifyOptIn({ cfg }: { cfg: ReturnType<typeof useConfig> }) {
  const chatId = cfg.config.notify.telegramChatId;
  const [status, setStatus] = useState<null | "sending" | "ok" | "off" | "err">(null);
  const sendTest = async () => {
    if (!chatId) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chatId, text: "✅ competitor.inc test — you'll get pings like this when your crew validates an idea or finishes a shift." }),
      });
      const d = await res.json().catch(() => ({}));
      setStatus(d.disabled ? "off" : d.ok ? "ok" : "err");
    } catch {
      setStatus("err");
    }
  };
  return (
    <div className="mt-6 rounded-xl border border-border bg-bg/40 p-4">
      <div className="flex items-center gap-2 text-sm font-medium"><Bell size={15} className="text-violet" /> Get build updates (optional)</div>
      <p className="mt-1 text-xs text-muted">
        A ping when your crew finishes validating an idea or running a shift — on Telegram now, iMessage
        later. We can&apos;t pull a handle from your sign-in, so it&apos;s opt-in: message{" "}
        <span className="text-text">our bot</span> first, then paste the chat id it replies with.
      </p>
      <label className="mt-3 block text-xs text-muted-2">
        Telegram chat id
        <input
          value={chatId}
          onChange={(e) => { cfg.setNotify({ telegramChatId: e.target.value.trim() }); setStatus(null); }}
          placeholder="e.g. 123456789"
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-coral/40"
        />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={sendTest}
          disabled={!chatId || status === "sending"}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-text transition hover:border-white/30 disabled:opacity-40"
        >
          {status === "sending" ? "Sending…" : "Send a test"}
        </button>
        {status === "ok" && <span className="text-xs text-mint">Sent ✓</span>}
        {status === "off" && <span className="text-xs text-muted-2">Saved — delivery turns on once the bot token is set on the deploy.</span>}
        {status === "err" && <span className="text-xs text-coral">Couldn&apos;t send — double-check the chat id.</span>}
      </div>
    </div>
  );
}

function Account({ auth, resetAllConfig }: { auth: ReturnType<typeof useAuth>; resetAllConfig: () => void }) {
  const [exported, setExported] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  function exportData() {
    const bundle: Record<string, unknown> = {};
    // Per-key guard: a single corrupted entry must NOT abort the whole export (no silent data loss —
    // we own-your-data). Unparseable values are kept as their raw string rather than dropped.
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k || !k.startsWith("cofounder:")) continue;
      const raw = window.localStorage.getItem(k);
      try {
        bundle[k] = raw ? JSON.parse(raw) : null;
      } catch {
        bundle[k] = raw;
      }
    }
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "competitor-inc-export.json";
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
  }

  return (
    <div className="space-y-6">
      <Card title="Account">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <div className="text-muted-2">Signed in as</div>
            <div className="font-medium">
              {auth.user && !auth.user.guest
                ? auth.user.email
                : <span className="text-muted">Guest <span className="ml-1 text-xs text-muted-2">(local mode — sign in to save to the cloud)</span></span>}
            </div>
          </div>
          {auth.user && !auth.user.guest ? (
            <button onClick={auth.signOut} className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition hover:text-text">Sign out</button>
          ) : (
            <Link href="/signup" className="rounded-lg border border-coral/40 px-3 py-1.5 text-sm font-semibold text-coral transition hover:bg-coral/10">Sign in</Link>
          )}
        </div>
      </Card>

      <Card title="Own your data" desc="No lock-in, ever. Export everything competitor.inc knows about your companies as JSON.">
        <button onClick={exportData} className="inline-flex items-center gap-2 rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110">
          <Download size={16} /> Export my data
        </button>
        {exported && <p className="mt-2 flex items-center gap-1.5 text-xs text-mint"><Check size={13} /> Downloaded competitor-inc-export.json</p>}
      </Card>

      <Card title="Danger zone">
        {confirmReset ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">This wipes your settings back to defaults. Sure?</span>
            <button
              onClick={() => { resetAllConfig(); setConfirmReset(false); }}
              className="rounded-lg bg-coral px-3 py-1.5 text-sm font-semibold text-bg transition hover:brightness-110"
            >
              Yes, reset
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition hover:text-text"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="rounded-lg border border-coral/40 px-3 py-1.5 text-sm text-coral transition hover:bg-coral/10"
          >
            Reset settings to defaults
          </button>
        )}
      </Card>
    </div>
  );
}
