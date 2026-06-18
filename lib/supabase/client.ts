"use client";

import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when Supabase env is present — gates real auth/persistence vs the local fallback. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

/** Browser Supabase client, or null when not configured (then we fall back to localStorage). */
export function getBrowserSupabase() {
  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey);
}
