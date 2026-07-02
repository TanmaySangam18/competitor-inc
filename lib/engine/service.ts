import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// THE service-role Supabase factory — the one place the service credentials are read. Every API
// route that writes/reads server-side goes through here (fail-soft: null when the deploy has no
// Supabase, so routes degrade to their honest "persisted: false" responses instead of erroring).
// Server-only: never import from client components — the service key bypasses RLS.
export function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Read-only variant for PUBLIC server-rendered pages (e.g. /t/[slug]): prefers the service role,
// deliberately falls back to the anon key so public rows still render through RLS on deploys
// without the service key. Never use for writes or private data.
export function publicReadClient(): SupabaseClient | null {
  const svc = serviceClient();
  if (svc) return svc;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon, { auth: { persistSession: false } });
}
