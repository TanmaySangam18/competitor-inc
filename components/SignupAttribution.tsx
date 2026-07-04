"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/engine/useAuth";

// Closes the landing funnel's last stage. When a visitor clicks a landing CTA we mark a referral
// ("cofounder:ref"); once they complete auth (real, non-guest user), we fire ONE `signup` event for
// that slug and clear the marker. A returning sign-in has no marker → never counted as a home signup.
// Fully client-side (the referral marker lives in localStorage, which the server callback can't read);
// fail-soft and PII-free — the pixel only records the slug.
const REF_KEY = "cofounder:ref";

export function SignupAttribution() {
  const { user, ready } = useAuth();
  const fired = useRef(false);

  useEffect(() => {
    if (!ready || fired.current) return;
    if (!user || user.guest) return; // only real, signed-in users
    let ref: string | null = null;
    try { ref = localStorage.getItem(REF_KEY); } catch { /* ignore */ }
    if (!ref) return;
    fired.current = true;
    try { localStorage.removeItem(REF_KEY); } catch { /* ignore */ }
    try {
      const payload = JSON.stringify({ slug: ref, type: "signup", source: "auth" });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
      } else {
        void fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true });
      }
    } catch { /* measurement must never break the app */ }
  }, [user, ready]);

  return null;
}
