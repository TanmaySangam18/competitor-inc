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

  // FIRST-TOUCH capture (Receipts Campaign slice 3): arriving anywhere with ?ref=<slug> marks the
  // referral — exactly like clicking a landing CTA does — and logs one view under that slug so campaign
  // clicks are counted even when the link lands off-home. First touch wins: an existing marker is never
  // overwritten (a campaign click can't steal credit from an earlier source).
  useEffect(() => {
    try {
      const ref = new URL(window.location.href).searchParams.get("ref")?.trim().toLowerCase();
      if (!ref || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(ref)) return;
      if (!localStorage.getItem(REF_KEY)) localStorage.setItem(REF_KEY, ref);
      const payload = JSON.stringify({ slug: ref, type: "view", source: "ref" });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
      } else {
        void fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true });
      }
    } catch { /* measurement must never break the app */ }
  }, []);

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
