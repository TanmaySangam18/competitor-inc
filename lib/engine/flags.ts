// Engine feature flags (build-time, NEXT_PUBLIC_* so they inline into the client bundle).

// Server-authoritative state: Supabase is the single source of truth for signed-in users — reads load
// from the DB, writes are awaited (optimistic + rollback), and cron/multi-device changes arrive via Realtime.
// GRADUATED TO DEFAULT-ON (2026-07-10, the roadmap's flip): the machinery shipped + tested in slices 0–3;
// laptop-off runs need the DB to be authoritative. NEXT_PUBLIC_SERVER_AUTHORITATIVE=0 is the rollback
// switch (non-Sensitive on Vercel — see env-guard). Guests stay localStorage-only regardless.
export const SERVER_AUTHORITATIVE = process.env.NEXT_PUBLIC_SERVER_AUTHORITATIVE !== "0";
