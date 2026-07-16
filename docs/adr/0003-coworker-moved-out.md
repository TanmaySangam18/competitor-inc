# ADR-0003: coworker/ moved out of the product repo

## Context
coworker/ was a 2.1GB vendored companion app (545 tracked source files) inside the product repo.
Nothing in the app imports it (Phase-0 audit: 1 unresolved import repo-wide, not coworker); tsconfig
excluded it; its only tie is that the desktop app FRAMES our /decisions page by URL (next.config CSP
comment — still true, still external). Standing rule: "Rowboat integral via MCP, never modified."

## Decision
Physically moved to ~/tools/coworker (same treatment as ~/tools/open-design) and removed from this
repo. Git history preserves everything including the Day-One Executive-Inbox commit (9010dbd).

## Consequences
Repo file count roughly halves; the working tree sheds 2.1GB; the audit stops needing a vendored-unit
exception. The coworker app keeps working — it talks to us over HTTP/MCP, exactly as designed.
