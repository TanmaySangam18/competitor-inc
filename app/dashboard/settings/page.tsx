"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useConfig, type ProviderMode } from "@/lib/roomie/config";
import { useAuth } from "@/lib/roomie/useAuth";
import { AGENTS, type AgentRole, type ByokConfig } from "@/lib/roomie/types";

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
          {section === "integrations" && <Integrations />}
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
  const modes: { id: ProviderMode; label: string; desc: string }[] = [
    { id: "frontier", label: "Frontier model", desc: "Most capable. Routes through a hosted model for the best reasoning." },
    { id: "private", label: "Private mode", desc: "Self-hosted open-weight model — your data never leaves your infrastructure." },
    { id: "simulated", label: "Simulated", desc: "No model calls. Fast, free, offline — great for demos." },
  ];
  return (
    <Card title="Engine" desc="Which brain runs your company. The live default is set server-side; this records your preference.">
      <div className="space-y-3">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => cfg.setProviderMode(m.id)}
            className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
              cfg.config.providerMode === m.id ? "border-coral/50 bg-coral/[0.05]" : "border-border bg-bg/40 hover:border-border"
            }`}
          >
            <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${cfg.config.providerMode === m.id ? "border-coral bg-coral text-bg" : "border-muted-2"}`}>
              {cfg.config.providerMode === m.id && <Check size={12} />}
            </span>
            <span>
              <span className="block text-sm font-medium">{m.label}</span>
              <span className="block text-xs text-muted">{m.desc}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-border bg-bg/40 p-4">
        <div className="text-sm font-medium">Bring your own key (optional)</div>
        <p className="mt-1 text-xs text-muted">
          competitor.inc is the validation engine, the agent team, and the proof layer — the model is
          just the brain we plug into it. Most people use the default; bring a key only if you want full
          privacy or your own cost control. It stays in this browser, is sent per-request, and is never
          persisted by us.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-muted-2">
            Provider
            <select
              value={cfg.config.byok.provider}
              onChange={(e) => cfg.setByok({ provider: e.target.value as ByokConfig["provider"] })}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-coral/40"
            >
              <option value="">None (simulated)</option>
              <option value="anthropic">Anthropic</option>
              <option value="openai-compatible">OpenAI-compatible (OpenAI / Groq / OpenRouter / local)</option>
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
            Base URL
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
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-2">
          {cfg.config.byok.provider && cfg.config.byok.apiKey ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-mint" /> Live — running on your key
            </>
          ) : (
            <>Simulated — add a key to go live (free tiers work: Groq, OpenRouter).</>
          )}
        </p>
      </div>
    </Card>
  );
}

function Billing() {
  const plans = [
    { name: "Validate", price: "$0", tag: "free forever", current: true },
    { name: "Operator", price: "$39", tag: "/ month", current: false },
    { name: "Founding", price: "$99", tag: "once · launch", current: false },
  ];
  return (
    <Card title="Billing" desc="Flat pricing, no revenue share. Failed tasks auto-refund.">
      <div className="grid gap-3 sm:grid-cols-3">
        {plans.map((p) => (
          <div key={p.name} className={`rounded-xl border p-4 ${p.current ? "border-coral/50 bg-coral/[0.05]" : "border-border bg-bg/40"}`}>
            <div className="text-sm font-semibold">{p.name}</div>
            <div className="mt-1 font-display text-2xl font-bold">{p.price}<span className="ml-1 text-xs font-normal text-muted-2">{p.tag}</span></div>
            {p.current ? (
              <span className="mt-3 inline-block rounded-md bg-mint/12 px-2 py-1 text-[11px] text-mint">Current plan</span>
            ) : (
              <button className="mt-3 w-full rounded-lg border border-border py-1.5 text-xs text-muted transition hover:text-text">Upgrade</button>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-2">Checkout activates with a Stripe key (Vercel Marketplace). No charges until configured.</p>
    </Card>
  );
}

function Integrations() {
  const items = [
    { icon: Github, name: "GitHub", desc: "Let Forge push code & open PRs." },
    { icon: Megaphone, name: "Meta Ads", desc: "Let Pitch run real ad campaigns." },
    { icon: Mail, name: "Email", desc: "Let Guard handle real support & outreach." },
    { icon: Globe, name: "Domains", desc: "Auto-provision domains for new products." },
  ];
  return (
    <Card title="Integrations" desc="Connect real accounts so agents can act in the world. Each stays scoped and approval-gated.">
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((i) => (
          <div key={i.name} className="flex items-start gap-3 rounded-xl border border-border bg-bg/40 p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted"><i.icon size={17} /></span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{i.name}</div>
              <div className="text-xs text-muted">{i.desc}</div>
            </div>
            <button className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition hover:text-text">
              <Lock size={11} /> Connect
            </button>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-2">Connecting requires your credentials and authorizes real-world actions (spend, sending). Until then, agents operate in safe simulation.</p>
    </Card>
  );
}

function Account({ auth, resetAllConfig }: { auth: ReturnType<typeof useAuth>; resetAllConfig: () => void }) {
  const [exported, setExported] = useState(false);

  function exportData() {
    const bundle: Record<string, unknown> = {};
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith("roomie:")) bundle[k] = JSON.parse(window.localStorage.getItem(k) || "null");
      }
    } catch { /* ignore */ }
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
            <div className="font-medium">{auth.user?.email ?? "—"}{auth.user?.guest && <span className="ml-2 text-xs text-muted-2">(local mode)</span>}</div>
          </div>
          <button onClick={auth.signOut} className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition hover:text-text">Sign out</button>
        </div>
      </Card>

      <Card title="Own your data" desc="No lock-in, ever. Export everything competitor.inc knows about your companies as JSON.">
        <button onClick={exportData} className="inline-flex items-center gap-2 rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110">
          <Download size={16} /> Export my data
        </button>
        {exported && <p className="mt-2 flex items-center gap-1.5 text-xs text-mint"><Check size={13} /> Downloaded competitor-inc-export.json</p>}
      </Card>

      <Card title="Danger zone">
        <button
          onClick={() => { if (confirm("Reset all settings to defaults?")) resetAllConfig(); }}
          className="rounded-lg border border-coral/40 px-3 py-1.5 text-sm text-coral transition hover:bg-coral/10"
        >
          Reset settings to defaults
        </button>
      </Card>
    </div>
  );
}
