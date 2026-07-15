# License Policy — how competitor.inc uses open source without getting sued

**Owned by:** the Dependency / Supply-Chain Auditor (ORG #29) + the Legal & Compliance Analyst (ORG #42).
**Enforced by:** `lib/core/licenses.ts` (`classifyLicense` / `screenDependency`) — CI blocks anything `allowed:false`.

## The one rule
We comply; we do not hide. There is **no** "rebrand it as ours and we're immune" — stripping a license or
attribution notice **is** the violation, and it's suable. Using open source safely is boring on purpose.

## What we allow (in our proprietary, commercial platform)
| Class | Examples | Use? | Obligation |
|---|---|---|---|
| Public domain | CC0-1.0, Unlicense, 0BSD | ✅ | None (but never misrepresent authorship) |
| Permissive | MIT, ISC, BSD-2/3, Apache-2.0 | ✅ | **Keep the license + copyright NOTICE. Never strip it. Never claim we wrote it.** |
| Weak (file) copyleft | MPL-2.0 | ✅ | Keep notices; changes to *its* files stay under its license; our files stay ours |

## What we block (do not use)
| Class | Examples | Why |
|---|---|---|
| Copyleft | GPL-2.0/3.0, LGPL | Would force our own code open |
| Network copyleft | AGPL-3.0 | Forces source disclosure for a hosted service (that's us) |
| Source-available | SSPL, BUSL-1.1, Elastic-2.0, Commons Clause | Forbids our commercial hosted use |
| Non-commercial | CC-BY-NC | Forbids commercial use outright |
| **Unknown / missing** | anything unrecognized | **DEFAULT-DENY** — no clear license = do not use until Legal confirms |

## Standing obligations
- Every shipped product carries a **NOTICE** file listing attributed dependencies (`attributionList()`).
- **Trademarks are not licenses** — we never reuse another project's name or logo as our own.
- New dependency = the Auditor screens its license; `allowed:false` blocks the PR in CI.
- Copyleft found in the tree → escalate to Legal & Compliance Analyst + find a permissive alternative.

## Domains (related): we do NOT use "free domain" projects for commercial use
Free-subdomain projects (is-a.dev and friends) forbid commercial use in their terms — using them for the
platform or a paying customer would be a violation. Legal alternatives only: `name.competitor.inc`
(Vercel for Platforms, commercial OK) or a real registrar on the customer's account. See `lib/core/domains.ts`.
