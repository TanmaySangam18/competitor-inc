"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

export interface EngineUser {
  email: string;
  guest: boolean;
}

// Auth that degrades gracefully: real Supabase sessions when configured, otherwise a local
// "guest" workspace so the product is fully usable offline.
export function useAuth() {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<EngineUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!configured) {
      setUser({ email: "you@local", guest: true });
      setReady(true);
      return;
    }
    const sb = getBrowserSupabase();
    if (!sb) {
      setReady(true);
      return;
    }
    sb.auth.getUser()
      .then(({ data }) => {
        setUser(data.user ? { email: data.user.email ?? "", guest: false } : null);
      })
      .catch(() => { /* network error — fall through to ready so the UI never hangs */ })
      .finally(() => setReady(true));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ? { email: session.user.email ?? "", guest: false } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, [configured]);

  // Both flows return through /auth/callback (the @supabase/ssr canonical route): the PKCE code is
  // exchanged SERVER-side so the session cookie exists before the destination page loads — the same
  // cookie the middleware refreshes and /api/execute's authorize() reads. One session store, no race.
  const callbackUrl = (next: string) =>
    typeof window !== "undefined" ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` : undefined;

  const signInWithEmail = useCallback(async (email: string) => {
    const sb = getBrowserSupabase();
    if (!sb) throw new Error("Supabase not configured");
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl("/dashboard") },
    });
    if (error) throw error;
  }, []);

  // Social sign-in. GitHub (our indie/technical beachhead lives there) + Google (universal). Supabase
  // handles the OAuth handshake; providers are configured in the Supabase dashboard.
  const signInWithOAuth = useCallback(async (provider: "google" | "github") => {
    const sb = getBrowserSupabase();
    if (!sb) throw new Error("Supabase not configured");
    const { error } = await sb.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl("/dashboard") },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const sb = getBrowserSupabase();
    if (sb) await sb.auth.signOut();
    if (!configured) setUser({ email: "you@local", guest: true });
    // Return to the homepage with a FULL reload so no signed-in state (or cached page) lingers — the
    // visitor lands on the public home and can sign in fresh. Without this, sign-out left you on a
    // stale dashboard that never updated.
    if (typeof window !== "undefined") window.location.assign("/");
  }, [configured]);

  return { user, ready, configured, signInWithEmail, signInWithOAuth, signOut };
}
