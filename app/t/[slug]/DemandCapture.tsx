"use client";

import { useState } from "react";
import { Check } from "lucide-react";

// The single honest action on a demand-test page: capture one email. Mirrors the /join form.
// Posts to /api/demand (fail-soft); shows the confirmation optimistically so the visitor always
// gets feedback even if persistence is off.
export default function DemandCapture({ slug }: { slug: string }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function submit() {
    const e = email.trim().toLowerCase();
    if (!e.includes("@")) return;
    setDone(true);
    fetch("/api/demand", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "signup", slug, email: e }),
    }).catch(() => {
      /* fail-soft: the visitor still sees the thank-you */
    });
  }

  if (done) {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-mint/30 bg-mint/[0.06] px-4 py-3 text-sm font-medium text-mint">
        <Check size={16} /> You&apos;re on the list — thank you.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="you@email.com"
        aria-label="Email"
        className="w-full rounded-xl glass-panel px-4 py-3 text-sm outline-none placeholder:text-muted-2 focus:border-coral/40"
      />
      <button
        onClick={submit}
        disabled={!email.includes("@")}
        className="shrink-0 rounded-xl bg-coral px-6 py-3 text-sm font-semibold text-bg transition hover:brightness-110 disabled:opacity-40"
      >
        Notify me
      </button>
    </div>
  );
}
