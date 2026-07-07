"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, X } from "lucide-react";
import { getByok, getConnections } from "@/lib/engine/config";

const DISMISS_KEY = "cofounder:byok-nudge-dismissed";

// BYOK discoverability nudge. The plumbing is fully wired (Settings → Engine for the AI key, Integrations for
// a GitHub token; builds already use `conn.githubToken || env` and pass `byok`), but new users don't know to
// connect their own keys — so they default onto the shared keys (fine for trying it, doesn't scale to a mass
// launch). This gently surfaces the option. Self-hides once ANY own key is connected, or on dismiss. It only
// informs — it never blocks: the shared-key path stays frictionless for the first cohort.
export default function BringYourKeysNudge() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
      const hasOwnModel = !!getByok();
      const hasOwnGithub = !!getConnections()?.githubToken;
      if (!hasOwnModel && !hasOwnGithub) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);
  if (!show) return null;
  return (
    <div className="mx-auto max-w-6xl px-6 pt-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-violet/25 bg-violet/[0.05] px-4 py-3 text-sm">
        <span className="flex items-center gap-2 text-muted">
          <KeyRound size={15} className="shrink-0 text-violet" />
          You&apos;re building on competitor.inc&apos;s shared keys — perfect for trying it out. Connect your own
          GitHub&nbsp;+ AI key to run on your own account, with no shared limits.
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/dashboard/settings"
            className="rounded-lg bg-violet/15 px-3 py-1.5 text-xs font-medium text-violet transition hover:bg-violet/25"
          >
            Connect keys
          </Link>
          <button
            onClick={() => {
              try {
                window.localStorage.setItem(DISMISS_KEY, "1");
              } catch {
                /* ignore */
              }
              setShow(false);
            }}
            aria-label="Dismiss"
            className="text-muted-2 transition hover:text-text"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
