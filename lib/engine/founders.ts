// Single source of truth for the founder allow-list — used by BOTH the House gate (app/house) and the
// founder's own full-access entitlement (dogfooding / "customer #1"). An allow-listed founder uses the
// full paid product — build, reveal the live site, operate — at $0, without a subscription.
//
// Safe to expose client-side: these are plain email addresses, not secrets, and listing one grants
// nothing on its own — real account access still requires a Supabase magic-link sign-in TO that address.
// Defaults to the founder addresses so access is locked-down even before NEXT_PUBLIC_FOUNDER_EMAILS is
// set on a deployment; the env var (comma-separated) overrides/extends the list.
export const FOUNDER_EMAILS = (
  process.env.NEXT_PUBLIC_FOUNDER_EMAILS || "projecttattva1@gmail.com,sangam.d@northeastern.edu,tanmaysangam018@gmail.com"
)
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function isFounderEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return FOUNDER_EMAILS.includes(email.toLowerCase());
}
