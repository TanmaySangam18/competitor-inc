"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, ArrowLeft, Sparkles } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { useCopy } from "@/components/useCopy";
import { codeFrom } from "@/lib/engine/refcode";

// This page sells the FOUNDER tier (concierge / done-with-you). Its checkout activates when the founder
// sets NEXT_PUBLIC_CHECKOUT_URL_FOUNDER (Polar). Until then, the CTA routes to the apply/waitlist.
const CHECKOUT_URL = process.env.NEXT_PUBLIC_CHECKOUT_URL_FOUNDER || "";
const WL_KEY = "cofounder:waitlist:v1";

interface Entry {
  email: string;
  code: string;
  joinedAt: number;
  ref: string | null;
}

// Server-side standing on the list, when Supabase is configured (Block 0). Optimistic localStorage
// still drives the confirmation, so the page works even when the waitlist isn't persisted yet.
interface ServerInfo {
  persisted: boolean;
  position?: number;
  referrals?: number;
}

const founderPoints = [
  "We validate, build & launch it alongside you",
  "A weekly working session with the crew",
  "Direct line + priority on everything",
  "Cancel anytime · own everything · 0% revenue share",
];

const GOAL = 10_000;

export default function Join() {
  const [email, setEmail] = useState("");
  const [entry, setEntry] = useState<Entry | null>(null);
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const { copied, copy: copyText } = useCopy(1500);
  const [server, setServer] = useState<ServerInfo | null>(null);
  const [totalSignups, setTotalSignups] = useState<number | null>(null);
  const [emailErr, setEmailErr] = useState("");

  useEffect(() => {
    fetch("/api/waitlist")
      .then((r) => r.json())
      .then((d) => { if (typeof d?.count === "number") setTotalSignups(d.count); })
      .catch(() => {});
  }, []);

  // Persist the signup server-side (no-op if Supabase isn't configured) and pull back position +
  // referral count. Fire-and-forget: never blocks the confirmation UI.
  function syncWaitlist(emailLower: string, ref: string | null) {
    fetch("/api/waitlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: emailLower, ref }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) setServer({ persisted: !!d.persisted, position: d.position, referrals: d.referrals });
      })
      .catch(() => {
        /* offline / not configured — localStorage copy still shows */
      });
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WL_KEY);
      if (raw) {
        const e = JSON.parse(raw) as Entry;
        setEntry(e);
        syncWaitlist(e.email, e.ref); // refresh a returning visitor's position
      }
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) setReferredBy(ref);
    } catch {
      /* ignore */
    }
  }, []);

  // Mirror the server's check (app/api/waitlist) so a bad address fails loudly here, never silently.
  const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  function join() {
    const e = email.trim().toLowerCase();
    if (!e) { setEmailErr("Enter your email to join."); return; }
    if (!validEmail(e)) { setEmailErr("That doesn't look like a valid email."); return; }
    setEmailErr("");
    const rec: Entry = { email: e, code: codeFrom(e), joinedAt: Date.now(), ref: referredBy };
    try {
      localStorage.setItem(WL_KEY, JSON.stringify(rec));
    } catch {
      /* ignore */
    }
    setEntry(rec);
    syncWaitlist(e, referredBy);
    // Refresh the live counter so it reflects this join without a full page reload (BUG-23).
    fetch("/api/waitlist")
      .then((r) => r.json())
      .then((d) => { if (typeof d?.count === "number") setTotalSignups(d.count); })
      .catch(() => {});
  }

  const refLink = entry && typeof window !== "undefined" ? `${window.location.origin}/join?ref=${entry.code}` : "";
  const copyLink = () => copyText(refLink);

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
          <div className="text-xs font-semibold uppercase tracking-wider text-coral">Founder tier · a few slots at a time</div>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">
            Don&apos;t build it alone — <span className="gradient-text">we build it with you</span>.
          </h1>
          <p className="mt-3 text-muted">
            The hands-on tier for founders who&apos;d rather not DIY. We validate, build, and launch your
            company alongside you — <span className="text-text">$299/mo</span>, cancel anytime. We only take a
            handful at a time so each one gets real attention.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {founderPoints.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm text-muted">
                <Check size={16} className="mt-0.5 shrink-0 text-mint" /> {p}
              </li>
            ))}
          </ul>
          <a
            href={CHECKOUT_URL || "#waitlist"}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-coral px-6 py-3.5 font-semibold text-bg transition hover:brightness-110 sm:w-auto"
          >
            {CHECKOUT_URL ? "Start with the Founder tier — $299/mo" : "Apply for a slot"}
          </a>
          <p className="mt-3 text-xs text-muted-2">
            No revenue share, no lock-in, export anytime — that&apos;s the whole point.
          </p>
        </div>

        <div id="waitlist" className="mt-12">
          <h2 className="text-xl font-bold">Or join the waitlist</h2>
          <p className="mt-2 text-sm text-muted">We&apos;re launching soon. Get in early — and share your link to move up the line.</p>
          {totalSignups !== null && (
            <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold text-text">{totalSignups.toLocaleString()} founders</span>
                <span className="text-xs text-muted-2">goal: {GOAL.toLocaleString()}</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-coral transition-all"
                  style={{ width: `${Math.min(100, (totalSignups / GOAL) * 100)}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-muted-2">
                {GOAL - totalSignups > 0
                  ? `${(GOAL - totalSignups).toLocaleString()} spots left before we open the gates`
                  : "Waitlist full — join to stay in the loop"}
              </p>
            </div>
          )}

          {entry ? (
            <div className="mt-5 rounded-2xl border border-mint/30 bg-mint/[0.05] p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-mint">
                <Check size={16} /> You&apos;re on the list
              </div>
              <p className="mt-1 text-sm text-muted">We&apos;ll email {entry.email} at launch.</p>
              {server?.persisted && server.position ? (
                <p className="mt-1 text-sm text-text">
                  You&apos;re <span className="font-semibold">#{server.position}</span> on the list
                  {server.referrals
                    ? ` · ${server.referrals} ${server.referrals === 1 ? "friend has" : "friends have"} joined through you`
                    : ""}
                  .
                </p>
              ) : null}
              <div className="mt-4 text-xs text-muted-2">Your invite link — every friend who joins moves you up 5 spots:</div>
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
            <div className="mt-5 flex flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailErr) setEmailErr(""); }}
                  onKeyDown={(e) => e.key === "Enter" && join()}
                  placeholder="you@company.com"
                  className={`w-full rounded-xl glass-panel px-4 py-3 text-sm outline-none placeholder:text-muted-2 focus:border-coral/40 ${emailErr ? "border-coral/60" : ""}`}
                  aria-label="Email for the waitlist"
                  aria-invalid={!!emailErr}
                />
                <button
                  onClick={join}
                  className="shrink-0 rounded-xl bg-text px-6 py-3 text-sm font-semibold text-bg transition hover:opacity-90"
                >
                  Join the waitlist
                </button>
              </div>
              {emailErr && <p className="text-xs font-medium text-coral" role="alert">{emailErr}</p>}
              {/* Consent basis (CAN-SPAM/GDPR): explicit opt-in, named purpose, opt-out promised. */}
              <p className="text-xs text-muted-2">
                By joining you agree to our{" "}
                <Link href="/privacy" className="underline underline-offset-2 hover:text-text">Privacy Policy</Link>{" "}
                and to get launch + product updates by email. No spam; unsubscribe anytime.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
