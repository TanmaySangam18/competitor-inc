"use client";

import { useState } from "react";
import { Crown, Check, Loader2, ArrowRight } from "lucide-react";

// Founding-member capture. Pre-EAD the founder legally can't collect income, so a "want to pay" moment
// becomes a RESERVATION, not a charge — the strongest validation signal (proven willingness to pay),
// banked instead of lost. Reuses /api/interest (already live in prod: email + app + note, notifies the
// founder, returns a running count). The day the EAD lands, re-adding the checkout env var flips these
// same reveal CTAs back to a real Polar checkout and the founder converts this warm list.
//
// `tier` tags the reservation (app = `founding-<tier>`); the optional would-pay amount rides in `note`
// so the founder sees a real price signal without adding friction.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function FoundingMember({ tier = "operator", email: initialEmail = "" }: { tier?: string; email?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reserve = async () => {
    const e = email.trim().toLowerCase();
    if (!EMAIL_RE.test(e)) {
      setError("Enter a valid email so we can hold your spot.");
      return;
    }
    setError(null);
    setBusy(true);
    const amt = amount.replace(/[^\d.]/g, "").slice(0, 8);
    const note = amt ? `would pay $${amt}/mo` : undefined;
    try {
      const res = await fetch("/api/interest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: e, app: `founding-${tier}`, note }),
      });
      const d = (await res.json().catch(() => ({}))) as { ok?: boolean; count?: number };
      if (res.ok && d.ok) {
        setCount(typeof d.count === "number" ? d.count : null);
        setDone(true);
      } else {
        setError("Couldn't reserve just now — try again in a moment.");
      }
    } catch {
      setError("Couldn't reach us just now — try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="mt-3 rounded-2xl border border-mint/30 bg-mint/[0.05] p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-mint">
          <Check size={16} /> You&apos;re {count ? `#${count} ` : ""}on the founding list
        </div>
        <p className="mt-1.5 text-xs text-muted-2">
          No charge today. You&apos;ll be first in when paid opens — at founding pricing.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-coral/30 bg-coral/[0.05] p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-coral">
        <Crown size={16} /> Become a founding member
      </div>
      <p className="mt-1 text-xs text-muted-2">
        Paid access opens soon. Reserve your spot now to lock founding pricing — no charge today.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@school.edu"
          aria-label="Your email"
          className="w-full flex-1 rounded-lg border border-border bg-bg/40 px-3 py-2 text-sm outline-none transition focus:border-coral/50"
        />
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="What would you pay? $"
          aria-label="What would you pay per month (optional)"
          className="w-full rounded-lg border border-border bg-bg/40 px-3 py-2 text-sm outline-none transition focus:border-coral/50 sm:w-48"
        />
      </div>
      {error && <p className="mt-2 text-xs text-amber">{error}</p>}
      <button
        onClick={reserve}
        disabled={busy}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-60"
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <>Reserve my spot <ArrowRight size={15} /></>}
      </button>
    </div>
  );
}
