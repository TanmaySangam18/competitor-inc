"use client";

// LEFT SIDEBAR — exactly three destinations, one purpose each (2026-07-15 consolidation: "Projects" and
// "Billing" were literal duplicate links of Home and Settings and are gone; company switching lives in
// the TopBar switcher). Home = the cockpit · Inbox = jump to what needs you · Settings = keys/billing/account.
// Hidden on mobile so the single-column cockpit still works.

import Link from "next/link";
import { Home, Inbox, Settings } from "lucide-react";

function scrollToInbox() {
  document.getElementById("approval-inbox")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

const itemBase = "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition";

export function DashSidebar() {
  return (
    <aside className="hidden w-[196px] shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="px-5 py-4 text-[15px] font-semibold tracking-tight">
        competitor<span className="text-coral">.inc</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-2">Menu</p>
        <Link href="/dashboard" className={`${itemBase} bg-coral text-white`} aria-current="page">
          <Home size={16} /> Home
        </Link>
        <button onClick={scrollToInbox} className={`${itemBase} w-full text-left text-muted hover:bg-surface-2 hover:text-text`}>
          <Inbox size={16} /> Inbox
        </button>
        <Link href="/dashboard/settings" className={`${itemBase} text-muted hover:bg-surface-2 hover:text-text`}>
          <Settings size={16} /> Settings
        </Link>
      </nav>

      <div className="px-5 py-4 text-[10px] leading-relaxed text-muted-2">
        Built + run by AI · you own the 2% that stays human.
      </div>
    </aside>
  );
}
