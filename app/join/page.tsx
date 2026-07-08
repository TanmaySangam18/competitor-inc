"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { useCopy } from "@/components/useCopy";
import { codeFrom } from "@/lib/engine/refcode";
import { CHECKOUT_URLS, checkoutLiveFor, TIERS } from "@/lib/engine/billing";

// The pricing page: four founder tiers (Free → Builder → Operator → Concierge). Fail-soft — each paid
// tier's CTA links to its Polar checkout when the founder sets that tier's env var
// (NEXT_PUBLIC_CHECKOUT_URL_BUILDER / _URL / _FOUNDER); until then it routes to the waitlist so the page
// works pre-charging. Free routes into the build flow. Plan: docs/PLAN-10K-60DAY.md.
const WL_KEY = "cofounder:waitlist:v1";

interface Entry {
  email: string;
  code: string;
  joinedAt: number;
  ref: string | null;
}

interface ServerInfo {
  persisted: boolean;
  position?: number;
  referrals?: number;
}

const GOAL = 10_000;

// Where a tier's CTA points, and what it says — fail-soft when checkout isn't wired yet. `label`
// undefined => use the tier's own CTA text; set only when we override it (not-yet-live paid tier).
function tierCta(key: string): { href: string; label?: string; live: boolean } {
  if (key === "free") return { href: "/signup", live: true };
  const live = checkoutLiveFor(key);
  return { href: live ? CHECKOUT_URLS[key] : "#waitlist", label: live ? undefined : "Join waitlist", live };
}

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
      .catch(() => {});
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WL_KEY);
      if (raw) {
        const e = JSON.parse(raw) as Entry;
        setEntry(e);
        syncWaitlist(e.email, e.ref);
      }
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) setReferredBy(ref);
    } catch {
      /* ignore */
    }
  }, []);

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
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
            <LogoMark size={32} /> competitor.inc
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
            ← home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-12">
        {referredBy && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-xs text-mint">
            A friend invited you — you&apos;ll get earlier access
          </div>
        )}

        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-coral">Pick your tier</div>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">
            Start free. <span className="gradient-text">Upgrade when it earns.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted">
            Validate and build for free — you only pay when you want the crew to keep running your company.
            Own everything, 0% revenue share, cancel anytime.
          </p>
        </div>

        {/* Four tiers — one screen, one recommended. Progressive detail via the bullet lists. */}
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((t) => {
            const { href, label, live } = tierCta(t.key);
            const rec = t.recommended;
            return (
              <div
                key={t.key}
                className={`relative flex flex-col rounded-3xl border bg-surface p-6 ${rec ? "border-coral/60 ring-1 ring-coral/30" : "border-border"}`}
              >
                {rec && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-coral px-3 py-0.5 text-[11px] font-semibold text-bg">
                    Most popular
                  </div>
                )}
                <div className="text-sm font-semibold text-text">{t.name}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{t.price}</span>
                  {t.cadence && <span className="text-sm text-muted-2">{t.cadence}</span>}
                </div>
                <p className="mt-2 min-h-[2.5rem] text-sm text-muted">{t.tagline}</p>
                <ul className="mt-4 flex flex-1 flex-col gap-2">
                  {t.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-muted">
                      <span className={`mt-0.5 shrink-0 font-mono ${rec ? "text-coral" : "text-mint"}`}>–</span> {p}
                    </li>
                  ))}
                </ul>
                <a
                  href={href}
                  className={`mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    rec ? "bg-coral text-bg hover:brightness-110" : "border border-border text-text hover:bg-bg/40"
                  }`}
                >
                  {label ?? t.cta}
                </a>
                {t.key !== "free" && !live && (
                  <p className="mt-2 text-center text-[11px] text-muted-2">Opening soon</p>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-5 text-center text-xs text-muted-2">
          Student founder? Ask about the <span className="text-muted">.edu discount</span> on Builder & Operator.
        </p>

        {/* Secondary: waitlist for anyone not ready to pick a tier yet. Keeps the referral loop. */}
        <div id="waitlist" className="mx-auto mt-14 max-w-2xl border-t border-border pt-10">
          <h2 className="text-lg font-bold">Not ready to pick? Join the waitlist</h2>
          <p className="mt-1 text-sm text-muted">Get in early — share your link to move up the line.</p>
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
            </div>
          )}

          {entry ? (
            <div className="mt-5 rounded-2xl border border-mint/30 bg-mint/[0.05] p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-mint">
                You&apos;re on the list
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
                  {copied ? "copied" : "copy"}
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
