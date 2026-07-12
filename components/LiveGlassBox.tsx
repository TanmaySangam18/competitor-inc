"use client";

// The Live Glass Box — a glassy, 3D-tilted "screen" that shows the *visual output* of what each
// agent is producing right now: the website Forge is building, the ad exactly as a customer sees it
// in their feed, the social post, the welcome email, the A/B test running live. Not stats — the
// artifact. Flip through the screens with the ‹ › arrows. Polsia shows numbers; we show the work.
//
// Offline/simulated it renders representative artifacts bound to the active company; once execution
// keys are on, the same frames host the real previews.

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Code2,
  Megaphone,
  TrendingUp,
  LifeBuoy,
  Globe,
  Heart,
  MessageCircle,
  Repeat2,
  Landmark,
  Scale,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { AgentRole, Company } from "@/lib/engine/types";

const agentMeta: Record<AgentRole, { name: string; icon: LucideIcon; accent: string; ring: string }> = {
  ceo: { name: "CEO", icon: TrendingUp, accent: "text-violet", ring: "bg-violet/12" },
  engineering: { name: "Software Engineer", icon: Code2, accent: "text-mint", ring: "bg-mint/12" },
  marketing: { name: "Marketing Manager", icon: Megaphone, accent: "text-amber", ring: "bg-amber/12" },
  manufacturing: { name: "DevOps Engineer", icon: Code2, accent: "text-amber", ring: "bg-amber/12" },
  support: { name: "Customer Support", icon: LifeBuoy, accent: "text-coral", ring: "bg-coral/12" },
  growth: { name: "Growth Lead", icon: TrendingUp, accent: "text-mint", ring: "bg-mint/12" },
  finance: { name: "Finance", icon: Landmark, accent: "text-mint", ring: "bg-mint/12" },
  legal: { name: "Legal Counsel", icon: Scale, accent: "text-violet", ring: "bg-violet/12" },
  ops: { name: "Operations", icon: Settings, accent: "text-amber", ring: "bg-amber/12" },
};

type Screen = { role: AgentRole; doing: string; node: React.ReactNode };

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 18) || "company"
  );
}

/* ── individual artifact mockups ─────────────────────────────── */

function WebsiteScreen({ brand, idea, domain, building }: { brand: string; idea: string; domain: string; building: boolean }) {
  return (
    <div className="flex h-full flex-col">
      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-coral/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-mint/70" />
        <span className="ml-2 flex min-w-0 flex-1 items-center gap-1.5 truncate rounded-md bg-bg/60 px-2.5 py-1 text-[10px] text-muted-2">
          <Globe size={10} className="shrink-0" /> {domain}
        </span>
      </div>
      {/* rendered landing */}
      <div className="relative flex flex-1 flex-col items-center justify-center gap-3 px-6 py-5 text-center">
        <div className="absolute left-4 top-3 flex items-center gap-1.5">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-text text-[9px] font-bold text-bg">{brand.charAt(0).toUpperCase()}</span>
          <span className="text-[10px] font-semibold">{brand}</span>
        </div>
        <h3 className="max-w-[14rem] text-base font-bold leading-tight md:text-lg">{brand}</h3>
        <p className="line-clamp-2 max-w-[15rem] text-[11px] leading-snug text-muted">{idea}</p>
        <span className="rounded-lg bg-coral px-3 py-1.5 text-[11px] font-semibold text-bg">Get early access</span>
        <div className="mt-1 flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 w-14 rounded-md border border-border bg-surface" />
          ))}
        </div>
        {building && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-mint/12 px-2 py-0.5 text-[9px] font-medium text-mint">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-mint" /> deploying
          </span>
        )}
      </div>
    </div>
  );
}

function AdScreen({ brand, domain }: { brand: string; domain: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-surface px-5 py-4">
      <div className="w-full max-w-[17rem] overflow-hidden rounded-xl border border-border bg-bg/70">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-text text-[10px] font-bold text-bg">{brand.charAt(0).toUpperCase()}</span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[11px] font-semibold">{brand}</div>
            <div className="text-[9px] text-muted-2">Sponsored · @{domain.split(".")[0]}</div>
          </div>
        </div>
        <div className="relative mx-3 flex h-24 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-coral/85 to-amber/70 px-4 text-center">
          <p className="text-[13px] font-bold leading-tight text-bg">Validate your idea before you build it.</p>
        </div>
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="min-w-0">
            <div className="truncate text-[10px] font-medium">{brand} — your AI co-founder</div>
            <div className="text-[9px] uppercase tracking-wide text-muted-2">{domain}</div>
          </div>
          <span className="shrink-0 rounded-md border border-border px-2.5 py-1 text-[10px] font-semibold">Learn more</span>
        </div>
      </div>
    </div>
  );
}

function SocialScreen({ brand, domain }: { brand: string; domain: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-surface px-5 py-4">
      <div className="w-full max-w-[18rem] rounded-xl border border-border bg-bg/70 p-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-text text-xs font-bold text-bg">{brand.charAt(0).toUpperCase()}</span>
          <div className="leading-tight">
            <div className="text-[12px] font-semibold">{brand}</div>
            <div className="text-[10px] text-muted-2">@{domain.split(".")[0]} · now</div>
          </div>
        </div>
        <p className="mt-2.5 text-[12px] leading-snug">
          We got tired of AI tools that spend your money in the dark. So we built the opposite — it shows
          you every move and takes <span className="font-semibold">0% of your revenue</span>. Soft launch is live 👇
        </p>
        <div className="mt-3 flex items-center gap-5 text-muted-2">
          <span className="inline-flex items-center gap-1 text-[10px]"><MessageCircle size={12} /> 24</span>
          <span className="inline-flex items-center gap-1 text-[10px]"><Repeat2 size={12} /> 61</span>
          <span className="inline-flex items-center gap-1 text-[10px]"><Heart size={12} /> 318</span>
        </div>
      </div>
    </div>
  );
}

function EmailScreen({ brand, domain }: { brand: string; domain: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-surface px-5 py-4">
      <div className="w-full max-w-[18rem] overflow-hidden rounded-xl border border-border bg-bg/70">
        <div className="space-y-1 border-b border-border px-4 py-2.5 text-[10px]">
          <div className="flex justify-between"><span className="text-muted-2">From</span><span className="font-medium">CEO · {brand}</span></div>
          <div className="flex justify-between"><span className="text-muted-2">To</span><span className="font-medium">you@your-inbox.com</span></div>
          <div className="pt-0.5 text-[12px] font-semibold">Welcome to {brand} — here&apos;s your first step</div>
        </div>
        <div className="space-y-2 px-4 py-3 text-[11px] leading-snug text-muted">
          <p>Hey — thanks for joining. I&apos;m the agent running your back office.</p>
          <p>Tonight I&apos;ll run your first demand test and report back. You approve every move.</p>
          <span className="inline-block rounded-lg bg-coral px-3 py-1.5 text-[10px] font-semibold text-bg">Open your dashboard</span>
          <p className="pt-1 text-[9px] text-muted-2">{domain}</p>
        </div>
      </div>
    </div>
  );
}

function ABTestScreen({ brand }: { brand: string }) {
  const variants = [
    { tag: "A", head: "An AI co-founder for your startup", win: false, lift: "" },
    { tag: "B", head: "Validate your idea before you build it", win: true, lift: "+24%" },
  ];
  return (
    <div className="flex h-full items-center justify-center gap-3 bg-surface px-5 py-4">
      {variants.map((v) => (
        <div
          key={v.tag}
          className={`relative flex h-[8.5rem] w-1/2 max-w-[9rem] flex-col items-center justify-center gap-2 rounded-xl border bg-bg/70 px-3 text-center ${
            v.win ? "border-mint/50" : "border-border"
          }`}
        >
          <span className="absolute left-2 top-2 rounded bg-surface-2 px-1.5 py-0.5 text-[9px] font-bold text-muted-2">{v.tag}</span>
          {v.win && (
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-mint/15 px-1.5 py-0.5 text-[9px] font-semibold text-mint">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-mint" /> {v.lift}
            </span>
          )}
          <span className="grid h-5 w-5 place-items-center rounded-md bg-text text-[9px] font-bold text-bg">{brand.charAt(0).toUpperCase()}</span>
          <p className="text-[11px] font-semibold leading-tight">{v.head}</p>
          <span className={`rounded-md px-2 py-1 text-[9px] font-semibold ${v.win ? "bg-coral text-bg" : "border border-border text-muted-2"}`}>Sign up</span>
        </div>
      ))}
    </div>
  );
}

/* ── the box ─────────────────────────────────────────────────── */

export function LiveGlassBox({ company }: { company?: Pick<Company, "name" | "idea" | "product"> }) {
  const brand = company?.name?.trim() || "Your company";
  const idea = company?.idea?.trim() || "The thing you're building, tested before a line of code is written.";
  const domain = `${slugify(brand)}.com`;
  const building = company?.product?.status !== "live";

  const screens: Screen[] = [
    { role: "engineering", doing: "building your website — live preview", node: <WebsiteScreen brand={brand} idea={idea} domain={domain} building={building} /> },
    { role: "marketing", doing: "the ad, exactly as your customer sees it", node: <AdScreen brand={brand} domain={domain} /> },
    { role: "growth", doing: "drafted your launch post", node: <SocialScreen brand={brand} domain={domain} /> },
    { role: "support", doing: "the welcome email going out", node: <EmailScreen brand={brand} domain={domain} /> },
    { role: "marketing", doing: "A/B testing two headlines — B is winning", node: <ABTestScreen brand={brand} /> },
  ];

  const [[index, dir], setState] = useState<[number, number]>([0, 0]);
  const i = ((index % screens.length) + screens.length) % screens.length;
  const screen = screens[i];
  const meta = agentMeta[screen.role];
  const go = (step: number) => setState([index + step, step]);

  return (
    <section aria-label="Live Glass Box — what your agents are producing now">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted">
          <span className="live-dot inline-block h-2 w-2 rounded-full bg-coral" />
          Live preview · see the work, not just the stats
        </h2>
        <span className="hidden text-[11px] text-muted-2 sm:inline">{i + 1} / {screens.length}</span>
      </div>

      <div className="glassbox-stage relative mx-auto max-w-2xl">
        {/* arrows — kept inside the frame so nothing bleeds past the box */}
        <button
          onClick={() => go(-1)}
          aria-label="Previous screen"
          className="absolute left-2 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full glass-panel text-text transition hover:border-coral/40 sm:left-3"
        >
          <ChevronLeft size={17} />
        </button>
        <button
          onClick={() => go(1)}
          aria-label="Next screen"
          className="absolute right-2 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full glass-panel text-text transition hover:border-coral/40 sm:right-3"
        >
          <ChevronRight size={17} />
        </button>

        <div className="glassbox-3d relative">
          {/* the box body (depth) — sits just behind the screen */}
          <div aria-hidden className="glassbox-body absolute inset-0 rounded-[24px]" />
          {/* the screen */}
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[22px] glass-panel">
            <AnimatePresence initial={false} mode="wait" custom={dir}>
              <motion.div
                key={index}
                custom={dir}
                initial={{ opacity: 0, x: dir >= 0 ? 36 : -36 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir >= 0 ? -36 : 36 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                {screen.node}
              </motion.div>
            </AnimatePresence>
            <div className="glassbox-sheen pointer-events-none absolute inset-0 rounded-[22px]" />
          </div>
        </div>
      </div>

      {/* caption: which agent + what they're doing, + dots */}
      <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`grid h-8 w-8 place-items-center rounded-lg ${meta.ring} ${meta.accent}`}>
            <meta.icon size={15} />
          </span>
          <p className="text-sm">
            <span className="font-semibold">{meta.name}</span>{" "}
            <span className="text-muted">is {screen.doing}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {screens.map((_, n) => (
            <button
              key={n}
              onClick={() => setState([n, n >= i ? 1 : -1])}
              aria-label={`Go to screen ${n + 1}`}
              className={`h-1.5 rounded-full transition-all ${n === i ? "w-5 bg-coral" : "w-1.5 bg-muted-2/50 hover:bg-muted-2"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
