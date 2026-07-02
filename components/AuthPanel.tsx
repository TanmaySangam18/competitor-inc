"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Github, Loader2, Mail } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { useAuth } from "@/lib/engine/useAuth";

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.3 2.9l5.7-5.7C33.6 6.1 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c2.8 0 5.4 1.1 7.3 2.9l5.7-5.7C33.6 6.1 29 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C39.9 36 44 30.6 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

export default function AuthPanel({ mode }: { mode: "signin" | "signup" }) {
  const { configured, signInWithEmail, signInWithOAuth } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState<"google" | "github" | "email" | null>(null);
  const [err, setErr] = useState("");
  const [emailErr, setEmailErr] = useState("");

  const signup = mode === "signup";

  // Failures bounced back from /auth/callback (provider denial, code-exchange error) surface here —
  // a failed sign-in must never look like a silent no-op.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("auth_error");
    if (p) setErr(p);
  }, []);

  // Inline, field-level validation so a bad address fails LOUDLY next to the field (not below the
  // button, not only on submit). Mirrors the server's format check; the server still owns the final
  // word on blocked domains (e.g. example.com) and surfaces that in `err`.
  const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  function checkEmail() {
    const e = email.trim();
    if (!e) { setEmailErr(""); return false; }
    if (!validEmail(e)) { setEmailErr("That doesn't look like a complete email (e.g. you@company.com)."); return false; }
    setEmailErr(""); return true;
  }

  async function oauth(provider: "google" | "github") {
    setErr(""); setBusy(provider);
    try {
      await signInWithOAuth(provider);
    } catch (e) {
      setBusy(null);
      const detail = e instanceof Error ? e.message : "";
      // Honest failure copy: say what's actually wrong. Off-deployment (no Supabase) ≠ provider not
      // switched on in Supabase — the old message claimed "local mode" even on production.
      if (!configured) {
        setErr("This deployment runs in local mode (no Supabase) — continue as guest below.");
      } else if (/not enabled|unsupported provider/i.test(detail)) {
        setErr(`${provider === "google" ? "Google" : "GitHub"} sign-in isn't switched on for this deployment yet — use the magic link below instead.`);
      } else {
        setErr(detail || "Sign-in failed — try the magic link below.");
      }
    }
  }
  async function emailLink() {
    setErr("");
    if (!email.trim()) { setEmailErr("Enter your email to get a magic link."); return; }
    if (!checkEmail()) return;
    setBusy("email");
    try {
      await signInWithEmail(email);
      setSent(true);
    } catch (e) {
      // Server rejections (e.g. a blocked test domain) surface here in plain language.
      setErr(e instanceof Error ? e.message : "Couldn't send the link.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2.5 font-mono text-xl font-bold tracking-tight">
          <LogoMark size={36} /> competitor.inc
        </Link>

        <h1 className="display mt-8 text-center text-3xl">{signup ? "Start free" : "Welcome back"}</h1>
        <p className="mt-2 text-center text-sm text-muted">
          {signup ? "Prove your idea tonight. You stay the founder." : "Pick up where your co-founder left off."}
        </p>

        {sent ? (
          <div className="mt-8 rounded-2xl border border-mint/40 bg-mint/[0.06] p-7 text-center">
            <Check className="mx-auto text-mint" />
            <p className="mt-3 text-sm text-muted">Check <span className="text-text">{email}</span> for a magic link.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-2.5">
            <button onClick={() => oauth("google")} disabled={!!busy}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-surface py-3 text-sm font-medium transition hover:border-text hover:bg-surface-2 disabled:opacity-50">
              {busy === "google" ? <Loader2 size={16} className="animate-spin" /> : <GoogleMark />} Continue with Google
            </button>
            <button onClick={() => oauth("github")} disabled={!!busy}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-surface py-3 text-sm font-medium transition hover:border-text hover:bg-surface-2 disabled:opacity-50">
              {busy === "github" ? <Loader2 size={16} className="animate-spin" /> : <Github size={17} />} Continue with GitHub
            </button>

            <div className="flex items-center gap-3 py-1 text-[11px] uppercase tracking-wide text-muted-2">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>

            <label className={`flex items-center gap-2 rounded-xl glass-panel px-3 py-2.5 ${emailErr ? "border border-coral/60" : ""}`}>
              <Mail size={16} className="text-muted-2" />
              <input type="email" value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailErr) setEmailErr(""); }}
                onBlur={checkEmail}
                onKeyDown={(e) => e.key === "Enter" && emailLink()}
                placeholder="you@company.com" aria-label="Email address" aria-invalid={!!emailErr}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-2" />
            </label>
            {emailErr && <p className="text-xs font-medium text-coral" role="alert">{emailErr}</p>}
            <button onClick={emailLink} disabled={!!busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-coral py-3 text-sm font-semibold text-bg transition hover:brightness-110 disabled:opacity-40">
              {busy === "email" ? <Loader2 size={16} className="animate-spin" /> : null} Email me a magic link
            </button>
          </div>
        )}

        {err && <p className="mt-3 text-center text-xs text-coral">{err}</p>}

        {signup && (
          <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-2">
            By continuing you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-muted">Terms</Link> and{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-muted">Privacy Policy</Link>.
            We&apos;ll only email you about your account — no marketing without your okay.
          </p>
        )}

        <button onClick={() => router.push("/dashboard")}
          className="group mt-5 flex w-full items-center justify-center gap-2 text-sm text-muted transition hover:text-text">
          Continue as guest <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
        </button>

        <p className="mt-6 text-center text-xs text-muted-2">
          {signup ? "Already have an account? " : "New here? "}
          <Link href={signup ? "/login" : "/signup"} className="text-coral hover:underline">
            {signup ? "Sign in" : "Create one"}
          </Link>
        </p>
        {!configured && (
          <p className="mt-3 text-center text-[11px] text-muted-2">
            Local mode — Google/GitHub activate once Supabase + the providers are configured (see the runbook).
          </p>
        )}
      </div>
    </div>
  );
}
