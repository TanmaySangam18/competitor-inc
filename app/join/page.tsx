"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, ArrowLeft, Sparkles } from "lucide-react";
import { LogoMark } from "@/components/Logo";

// Checkout activates when the founder sets NEXT_PUBLIC_CHECKOUT_URL (LemonSqueezy/Gumroad).
// Until then, the Founding CTA routes to the waitlist.
const CHECKOUT_URL = process.env.NEXT_PUBLIC_CHECKOUT_URL || "";
const WL_KEY = "cofounder:waitlist:v1";

interface Entry {
  email: string;
  code: string;
  joinedAt: number;
  ref: string | null;
}

function codeFrom(email: string): string {
  let h = 2166136261;
  for (let i = 0; i < email.length; i++) {
    h ^= email.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).slice(0, 6);
}

const foundingPoints = [
  "Everything in Operator — for life",
  "Founding-member badge",
  "Shape the roadmap directly",
  "Lock today's price forever",
];

export default function Join() {
  const [email, setEmail] = useState("");
  const [entry, setEntry] = useState<Entry | null>(null);
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WL_KEY);
      if (raw) setEntry(JSON.parse(raw) as Entry);
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) setReferredBy(ref);
    } catch {
      /* ignore */
    }
  }, []);

  function join() {
    const e = email.trim().toLowerCase();
    if (!e.includes("@")) return;
    const rec: Entry = { email: e, code: codeFrom(e), joinedAt: Date.now(), ref: referredBy };
    try {
      localStorage.setItem(WL_KEY, JSON.stringify(rec));
    } catch {
      /* ignore */
    }
    setEntry(rec);
  }

  const refLink = entry && typeof window !== "undefined" ? `${window.location.origin}/join?ref=${entry.code}` : "";
  function copyLink() {
    navigator.clipboard?.writeText(refLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div id="main" className="min-h-screen">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
            <LogoMark size={32} /> competitor.inc
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
            <ArrowLeft size={15} /> Home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-16">
        {referredBy && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-xs text-mint">
            <Sparkles size={12} /> A friend invited you — you&apos;ll get earlier access
          </div>
        )}

        <div className="rounded-3xl border border-coral/40 bg-surface p-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-coral">Founding members · first 150 only</div>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">
            Get competitor.inc for life — <span className="gradient-text">$99 once</span>.
          </h1>
          <p className="mt-3 text-muted">
            Back it before launch. Lifetime Operator access, a founding-member badge, and a direct line
            on the roadmap — at a price that never goes up.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {foundingPoints.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm text-muted">
                <Check size={16} className="mt-0.5 shrink-0 text-mint" /> {p}
              </li>
            ))}
          </ul>
          <a
            href={CHECKOUT_URL || "#waitlist"}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-coral px-6 py-3.5 font-semibold text-bg transition hover:brightness-110 sm:w-auto"
          >
            {CHECKOUT_URL ? "Claim a Founding seat — $99" : "Notify me when seats open"}
          </a>
          <p className="mt-3 text-xs text-muted-2">
            Pay once. No subscription, no revenue share, no surprises — that&apos;s the whole point.
          </p>
        </div>

        <div id="waitlist" className="mt-12">
          <h2 className="text-xl font-bold">Or join the waitlist</h2>
          <p className="mt-2 text-sm text-muted">We launch June 28. Get in early — and share your link to move up the line.</p>

          {entry ? (
            <div className="mt-5 rounded-2xl border border-mint/30 bg-mint/[0.05] p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-mint">
                <Check size={16} /> You&apos;re on the list
              </div>
              <p className="mt-1 text-sm text-muted">We&apos;ll email {entry.email} at launch.</p>
              <div className="mt-4 text-xs text-muted-2">Your invite link — every friend who joins moves you up:</div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  readOnly
                  value={refLink}
                  className="w-full rounded-lg border border-border bg-bg/50 px-3 py-2 text-sm text-muted outline-none"
                />
                <button
                  onClick={copyLink}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:text-text"
                >
                  {copied ? <Check size={15} className="text-mint" /> : <Copy size={15} />} {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && join()}
                placeholder="you@company.com"
                className="w-full rounded-xl glass-panel px-4 py-3 text-sm outline-none placeholder:text-muted-2 focus:border-coral/40"
                aria-label="Email for the waitlist"
              />
              <button
                onClick={join}
                disabled={!email.includes("@")}
                className="shrink-0 rounded-xl bg-text px-6 py-3 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-40"
              >
                Join the waitlist
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
