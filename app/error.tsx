"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { LogoMark } from "@/components/Logo";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface the error for observability; a real deploy would forward this to monitoring.
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <Link href="/" className="inline-flex items-center gap-2.5 font-mono text-xl font-bold tracking-tight">
          <LogoMark size={38} />
          competitor.inc
        </Link>
        <h1 className="mt-8 text-2xl font-bold">Something went sideways</h1>
        <p className="mt-3 max-w-md text-sm text-muted">
          competitor.inc hit an unexpected error. Your data is safe — try again, and if it keeps happening
          we&apos;ll dig in.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-coral px-5 py-3 font-semibold text-bg transition hover:brightness-110"
          >
            <RotateCcw size={16} /> Try again
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-border px-5 py-3 font-medium text-muted transition hover:text-text"
          >
            Back to workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
