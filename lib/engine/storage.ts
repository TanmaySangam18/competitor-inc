"use client";

// One-time localStorage migration. The app's keys were renamed from the legacy "roomie:" prefix to
// "cofounder:" during the de-brand. Copy any legacy keys forward on first load so existing users keep
// their companies, settings, usage, waitlist entry, and founder unlock. Idempotent + flag-guarded, so
// every reader can call it cheaply before reading.

const LEGACY_PREFIX = "roomie:";
const PREFIX = "cofounder:";
const FLAG = "cofounder:_migrated";
let done = false;

export function migrateLegacyStorage(): void {
  if (typeof window === "undefined" || done) return;
  done = true;
  try {
    if (window.localStorage.getItem(FLAG)) return;
    // Collect first (don't mutate localStorage while iterating it by index).
    const moves: Array<[string, string]> = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k || !k.startsWith(LEGACY_PREFIX)) continue;
      const nk = PREFIX + k.slice(LEGACY_PREFIX.length);
      const v = window.localStorage.getItem(k);
      if (v != null && window.localStorage.getItem(nk) == null) moves.push([nk, v]);
    }
    for (const [nk, v] of moves) window.localStorage.setItem(nk, v);
    window.localStorage.setItem(FLAG, "1");
  } catch {
    /* ignore — storage may be unavailable (private mode, quota) */
  }
}
