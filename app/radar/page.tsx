"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import DemandRadarPanel from "@/components/DemandRadarPanel";

// Block V — the Demand Radar as an explorable page. This is the new validation: real, cited web demand
// instead of a signup number. (Block O folds this into the main onboarding flow.)
export default function RadarPage() {
  return (
    <div id="main" className="min-h-screen">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
            <LogoMark size={32} /> competitor.inc
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
            <ArrowLeft size={15} /> Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-14">
        <div className="flex items-center gap-2 text-xs text-muted-2">
          <ShieldCheck size={14} className="text-violet" /> VALIDATION, REBUILT — no signups, just real demand
        </div>
        <h1 className="mt-3 text-4xl font-bold md:text-5xl">Does anyone actually want it?</h1>
        <p className="mt-3 max-w-xl text-muted">
          Most tools ask you to run ads and count signups. We don&apos;t. The crew reads the live web —
          Hacker News, StackExchange, GitHub — for real signs people have this problem, scores the demand,
          and shows you <span className="text-text">every source it read</span>. Click any of them.
        </p>

        <div className="mt-8">
          <DemandRadarPanel />
        </div>
      </div>
    </div>
  );
}
