// Engine feature flags (build-time, NEXT_PUBLIC_* so they inline into the client bundle).

// Server-authoritative state: Supabase becomes the single source of truth for signed-in users — reads load
// from the DB, writes are awaited (optimistic + rollback), and cron/multi-device changes arrive via Realtime.
// Default OFF: when off, the app behaves EXACTLY as today (localStorage-authoritative + best-effort sync), so
// this flag is a clean rollback switch. Guests are always localStorage-only regardless of this flag.
export const SERVER_AUTHORITATIVE = process.env.NEXT_PUBLIC_SERVER_AUTHORITATIVE === "1";
