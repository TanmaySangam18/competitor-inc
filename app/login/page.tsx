"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Check } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { useAuth } from "@/lib/roomie/useAuth";

export default function Login() {
  const { configured, signInWithEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit() {
    setErr("");
    try {
      await signInWithEmail(email);
      setSent(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not send link");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 font-mono text-xl font-bold tracking-tight">
          <LogoMark size={38} />
          competitor.inc
        </Link>

        {configured ? (
          sent ? (
            <div className="mt-10 rounded-2xl border border-mint/30 bg-mint/[0.05] p-7">
              <Check className="mx-auto text-mint" />
              <p className="mt-3 text-sm text-muted">
                Check <span className="text-text">{email}</span> for a magic link to sign in.
              </p>
            </div>
          ) : (
            <div className="mt-10 text-left">
              <h1 className="text-center text-2xl font-bold">Sign in</h1>
              <label className="mt-6 flex items-center gap-2 rounded-xl glass-panel px-3 py-2.5">
                <Mail size={16} className="text-muted-2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  aria-label="Email address"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-2"
                />
              </label>
              {err && <p className="mt-2 text-xs text-coral">{err}</p>}
              <button
                onClick={onSubmit}
                disabled={!email.includes("@")}
                className="mt-4 w-full rounded-xl bg-coral py-3 text-sm font-semibold text-bg transition hover:brightness-110 disabled:opacity-40"
              >
                Email me a magic link
              </button>
            </div>
          )
        ) : (
          <div className="mt-10">
            <p className="text-sm text-muted">
              You&apos;re running in <span className="text-text">local mode</span> — no account needed. Your
              companies are saved in this browser.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-coral py-3 font-semibold text-bg transition hover:brightness-110"
            >
              Enter your workspace
              <ArrowRight size={17} className="transition group-hover:translate-x-0.5" />
            </button>
            <p className="mt-4 text-xs text-muted-2">
              Add Supabase keys to enable real sign-in (see docs/SUPABASE-SETUP.md).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
