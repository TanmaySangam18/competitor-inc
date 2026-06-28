"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/lib/engine/useAuth";

// PLG "ask at peak intent": after the aha (a validation verdict), invite a guest to create a free account
// to SAVE their work and build — the signup moment we were missing. Shows only when signup is actually
// possible (Supabase configured) and the user isn't already signed in. No wall on the first taste.
export default function GuestSavePrompt({ context = "save this validation" }: { context?: string }) {
  const { user, ready, configured } = useAuth();
  if (!ready || !configured) return null; // not hydrated, or offline demo (no signup to offer)
  if (user && !user.guest) return null; // already a real account
  return (
    <div className="mt-3 flex flex-col items-start gap-3 rounded-2xl border border-coral/30 bg-coral/[0.05] px-4 py-3 sm:flex-row sm:items-center">
      <UserPlus size={18} className="shrink-0 text-coral" />
      <p className="min-w-0 flex-1 text-sm text-muted">
        You&apos;re exploring as a guest. <span className="text-text">Create a free account</span> to {context} and
        build it — free to start, no card.
      </p>
      <div className="flex shrink-0 gap-2">
        <Link href="/signup" className="rounded-lg bg-coral px-3 py-1.5 text-xs font-semibold text-bg transition hover:brightness-110">
          Sign up free
        </Link>
        <Link href="/login" className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition hover:text-text">
          Sign in
        </Link>
      </div>
    </div>
  );
}
