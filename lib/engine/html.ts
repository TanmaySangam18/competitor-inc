// THE HTML escaper. One implementation, strictest semantics (escapes quotes too), safe in both
// element and attribute contexts — so no call site ever has to judge which variant is "enough".
// Used by the site generator + outreach email (execution.ts), Telegram HTML (notify.ts, alerts.ts),
// and the founder feedback email (api/feedback).
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] as string));
}
