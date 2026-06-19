# Security & data-integrity review (handoff)

> Goal: make the project **as secure as possible** and ensure we **never lose user data or leave loose
> ends** before handing off to go-live. Manual line-by-line defensive audit (2026-06-19). Re-verified by
> the QA gate (`npm run qa`) — types + 35 unit tests + production build + E2E smoke + **60-payload fuzz,
> zero 5xx** — run twice, all green.

## What was checked, and the verdict

| Area | What we looked for | Verdict |
| --- | --- | --- |
| **Secrets** | API/BYOK keys leaking to client, disk, or logs | ✅ Keys are `server-only`; never in `NEXT_PUBLIC_*`; BYOK is browser-only, sent per-request, never persisted server-side |
| **Logging** | Raw errors / request bodies / keys in logs | ✅ `cron` + `api/roomie` log only `err.message`, never the body or key |
| **SSRF** (BYOK base URL) | https-only; block loopback/private/link-local/metadata, IPv6 internals, IPv4-mapped | ✅ Hardened + unit-tested (see fix #1) |
| **Input validation** | Malformed API bodies → 5xx | ✅ Rejected with 400; fuzz of 60 garbage payloads → **zero 5xx** |
| **XSS** | User text rendered as HTML | ✅ React auto-escapes; the 3D scene renders user-derived banter via `textContent`; removed the only `innerHTML` usage (fix #2) |
| **Header injection** | The `x-roomie-approval` chat header | ✅ `encodeURIComponent`-encoded server-side, `JSON.parse(decodeURIComponent(...))` in try/catch client-side |
| **Corrupted localStorage** | A bad entry crashing a page | ✅ Every read (`useRoomie`, `config`, `usage`, `/live`, `/join`, chat) is try/catch-guarded with shape validation |
| **Data loss on export** | One bad key dropping the whole export | ✅ Fixed — per-key guard, raw fallback (fix #3) |
| **Destructive actions** | Spend/deploy/delete without consent | ✅ Routed through the Approval Inbox; activity undo + auto-refund; `decideBuild`/`resolveApproval` are idempotent |
| **Cron endpoint** | Open nightly trigger | ✅ Optional `CRON_SECRET` bearer check |
| **DB** | Row-level security | ✅ RLS in `supabase/migrations/0001_init.sql` (verify policies when provisioning) |

## Fixes applied this pass

1. **SSRF guard hardened** ([`lib/roomie/server.ts`](../lib/roomie/server.ts)) — now also blocks `::`,
   `*.localhost`, and **all IPv4-mapped IPv6** (`::ffff:…`, which the URL parser serializes to hex and
   was bypassing the dotted-decimal check). A unit test (`[::ffff:169.254.169.254]`) caught the bypass
   before it shipped. Exported + covered in [`server.test.ts`](../lib/roomie/server.test.ts).
2. **Removed `innerHTML`** ([`app/delegation/DelegationScene.tsx`](../app/delegation/DelegationScene.tsx))
   — agent/"You" labels now built with `textContent`; zero HTML-injection surface even if names become
   user-configurable later.
3. **Resilient data export** ([`app/dashboard/settings/page.tsx`](../app/dashboard/settings/page.tsx)) —
   per-key try/catch so a single corrupted entry can't silently truncate the user's export.

## Also hardened (robustness)

- **Model-call timeouts** (30s `AbortController`) on every upstream provider request — a hung provider
  can no longer wedge a request; it degrades to the simulated engine.
- **New tests** for `detectChatApproval` (chat→approval intent) and the SSRF guard.

## Residual notes for the techie friend (not blockers)

- **DNS rebinding** isn't fully solved (the guard checks the literal host, not the resolved IP). Low risk
  for a model base URL; if you later proxy arbitrary user URLs, resolve + pin the IP.
- When provisioning **Supabase**, confirm the RLS policies in the migration match your auth before going
  live, and keep the `service_role` key server-side only.
- Set **`CRON_SECRET`** in production so the nightly endpoint isn't publicly triggerable.

*Reviewed defensively against our own code; re-verified by `npm run qa` (twice).*
