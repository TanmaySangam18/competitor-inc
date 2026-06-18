"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

export interface RoomieUser {
  email: string;
  guest: boolean;
}

// Auth that degrades gracefully: real Supabase sessions when configured, otherwise a local
// "guest" workspace so the product is fully usable offline.
export function useAuth() {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<RoomieUser | null>(null);
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

  const signInWithEmail = useCallback(async (email: string) => {
    const sb = getBrowserSupabase();
    if (!sb) throw new Error("Supabase not configured");
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const sb = getBrowserSupabase();
    if (sb) await sb.auth.signOut();
    if (!configured) setUser({ email: "you@local", guest: true });
  }, [configured]);

  return { user, ready, configured, signInWithEmail, signOut };
}
