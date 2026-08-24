"use client";

import { useState } from "react";

// The email box for /soon. Reports what actually happened rather than always showing success: the
// waitlist can fail to persist, and a green tick over a lost lead is the specific failure this whole
// codebase exists not to ship. See lib/engine/lead-fallback.ts for the server side.
type State = { s: "idle" } | { s: "sending" } | { s: "in" } | { s: "failed"; message: string };

export default function WaitlistBox() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ s: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return setState({ s: "failed", message: "That does not look like an email address." });
    setState({ s: "sending" });
    try {
      const r = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = (await r.json()) as { ok?: boolean; error?: string };
      // ok:true covers both a database write and the Slack rescue. Either way a human has it.
      setState(j.ok ? { s: "in" } : { s: "failed", message: j.error ?? "Something went wrong." });
    } catch {
      setState({ s: "failed", message: "Could not reach the server. Please try again." });
    }
  }

  if (state.s === "in") {
    return (
      <p className="text-base leading-relaxed text-text">
        You are on the list. One message when it opens, nothing else.
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="wl-email" className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-2">
        Email
      </label>
      <div className="mt-3 flex flex-wrap gap-3">
        <input
          id="wl-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          placeholder="you@example.com"
          aria-describedby={state.s === "failed" ? "wl-error" : undefined}
          aria-invalid={state.s === "failed"}
          className="min-w-0 flex-1 border border-border bg-bg px-4 py-3 text-base text-text outline-none transition placeholder:text-muted-2 focus:border-text"
        />
        <button
          type="submit"
          disabled={state.s === "sending"}
          className="border border-text bg-text px-6 py-3 text-sm font-semibold text-bg transition hover:bg-bg hover:text-text disabled:opacity-50"
        >
          {state.s === "sending" ? "Adding" : "Notify me"}
        </button>
      </div>
      {state.s === "failed" && (
        <p id="wl-error" role="alert" className="mt-3 text-sm leading-relaxed text-muted">
          {state.message}
        </p>
      )}
    </form>
  );
}
