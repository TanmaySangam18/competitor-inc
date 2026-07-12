"use client";

// LEFT SIDEBAR (2026-07-12, playbook §4 IA): the app's persistent navigation rail — Bookary-style, teal.
// Top-level destinations orbit the Project (the aggregate root); the per-project surfaces (Activity, Team,
// Agents…) live as tabs inside the workspace. Hidden on mobile so the single-column cockpit still works.
// Honest: Home/Projects resolve to the dashboard; Inbox scrolls to the live approvals band; Billing/Settings
// route to the real settings page. Nothing here is a dead link.

import Link from "next/link";
import { Home, FolderKanban, Inbox, CreditCard, Settings } from "lucide-react";

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
        <Link href="/dashboard" className={`${itemBase} text-muted hover:bg-surface-2 hover:text-text`}>
          <FolderKanban size={16} /> Projects
        </Link>
        <button onClick={scrollToInbox} className={`${itemBase} w-full text-left text-muted hover:bg-surface-2 hover:text-text`}>
          <Inbox size={16} /> Inbox
        </button>

        <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-2">Account</p>
        <Link href="/dashboard/settings" className={`${itemBase} text-muted hover:bg-surface-2 hover:text-text`}>
          <CreditCard size={16} /> Billing
        </Link>
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
