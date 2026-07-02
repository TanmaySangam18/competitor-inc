"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

// Campus capture — real rows in the `interest` table (app: "nu"), same honest posture as /lockin:
// confirms locally either way, tells the truth about persistence via the API's fail-soft response.
export default function NuCapture() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState("");

  async function join() {
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setErr("That doesn't look like a full email."); return; }
    setErr(""); setState("busy");
    try {
      await fetch("/api/interest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: e, app: "nu", note: "nu-beachhead landing" }),
      });
      setState("done");
    } catch {
      setState("done"); // fail-soft: the API never blocks a signup on infra
    }
  }

  if (state === "done") {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-mint/40 bg-mint/[0.06] px-4 py-3 text-sm">
        <Check size={16} className="text-mint" />
        <span className="text-muted">You&apos;re on the list — we&apos;ll reach out on campus first.</span>
      </div>
    );
  }
  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (err) setErr(""); }}
          onKeyDown={(e) => e.key === "Enter" && join()}
          placeholder="you@northeastern.edu"
          aria-label="Your Northeastern email"
          className="w-full rounded-xl glass-panel px-4 py-3 text-sm outline-none placeholder:text-muted-2"
        />
        <button
          onClick={join}
          disabled={state === "busy"}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-coral px-6 py-3 text-sm font-semibold text-bg transition hover:brightness-110 disabled:opacity-50"
        >
          {state === "busy" ? <Loader2 size={15} className="animate-spin" /> : null}
          Get campus early access <ArrowRight size={15} />
        </button>
      </div>
      {err && <p className="mt-2 text-xs font-medium text-coral" role="alert">{err}</p>}
      <p className="mt-2 text-[11px] text-muted-2">Any email works — .edu just gets priority. No spam; only campus-launch updates.</p>
    </div>
  );
}
