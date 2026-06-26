// Deterministic, dependency-free referral code from an email (FNV-1a → base36, 6 chars).
// Shared by the /join page (client) and the /api/waitlist route (server) so a person's code —
// and therefore their ?ref= link — is identical on both sides. Do not change the algorithm without
// a migration plan: it would orphan codes already shared by early signups.
export function codeFrom(email: string): string {
  let h = 2166136261;
  for (let i = 0; i < email.length; i++) {
    h ^= email.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).slice(0, 6);
}
