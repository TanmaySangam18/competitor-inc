# Rowboat Fork Plan — the coworker surface becomes part of Competitor.Inc

*Decision (founder, 2026-07-11): fork and modify Rowboat inside Competitor.Inc — it becomes OUR surface,
with the governed org embedded natively. Supersedes the earlier "use unmodified via MCP" approach.*

## Why fork (the real reason)

Not ethics — Apache-2.0 explicitly permits commercial use either way. We fork because the coworker surface
is the **front door of the product**: it must carry our brand, strip what our customer (NU first) doesn't
need, embed the governed org + human-principal gate natively, and pass an IT security review as ONE
auditable artifact. An external tool we can't touch can't be the face of the company.

## License compliance (non-negotiable, the honesty floor)

- [ ] Retain Rowboat's `LICENSE` (Apache-2.0) and all copyright notices in every file we keep
- [ ] Add a `NOTICE`/attribution: "Portions built on Rowboat by Rowboat Labs (Apache-2.0)" — visible, not buried
- [ ] State changes in modified files (header note + git history)
- [ ] **Rebrand**: "Rowboat" is their trademark. Our fork ships under our own name (working name: **the
      Competitor Coworker** — final name TBD). No Rowboat logos/name in our UI or marketing.
- [ ] Good citizenship: upstream genuinely general bug fixes when practical

## What we keep / strip / add (from the repo tree, apps/x = the Electron desktop coworker)

**KEEP (the substrate we want):**
- `apps/x` Electron shell (main/preload/renderer + core) — the desktop app
- The knowledge-graph memory ("Brain") + local Markdown vault — local-first, FERPA-friendly
- Code Mode (drives Claude Code/Codex) — our S-ladder's implementation engine, already built
- MCP client + integrations surface, BYO/local model support (Ollama/LM Studio)
- Background agents (event/schedule triggers)

**STRIP (not our product, reduce audit + maintenance surface):**
- `apps/rowboat` (the legacy web multi-agent builder), `apps/experimental/*`, `apps/rowboatx` (assess first)
- Consumer integrations NU won't clear initially (Twitter/X etc.) — keep the seam, disable by default
- Their telemetry/branding

**ADD (what makes it Competitor.Inc):**
- The **governed org brain** (our 56-role org, org-run DAG, policy engine, Consent Rails) wired natively
- The **human-principal decision queue** (lib/mcp/tools.ts contract → a first-class approval surface)
- **Receipts** (verifiable outcomes) rendered in the coworker
- NU mode: SSO hooks, accessibility bar, "data never leaves" defaults

## Upstream-merge discipline (the cost we accepted)

Fork now = we own maintenance. Mitigation: vendor as a git subtree/submodule from a pinned upstream SHA;
schedule a monthly upstream review-and-merge while drift is small; keep our changes in clearly bounded
modules (new packages > edits to theirs) so merges stay cheap. Every merge passes our QA gate.

## Sequence (bricks, each QA-green)

1. **Vendor**: clone upstream at a pinned SHA into `coworker/` (subtree), license/NOTICE wired, builds as-is
2. **Rebrand + strip**: our name, remove legacy apps + disabled integrations; still builds + runs
3. **First native seam**: the governed tool surface (lib/mcp/tools.ts) exposed inside the coworker —
   "build_and_run_software" callable from the chat, approvals land in a decision queue
4. **Memory bridge**: org receipts + product-memory written into the local knowledge graph
5. **NU hardening**: SSO, accessibility, local-model default, security-review dossier

## Honest ceiling (unchanged)

The Zuckerberg scenario is the north star, not a claim: today = a small software company's lifecycle,
proven at the S2 rung (built+run+verified live, 2026-07-11). Meta-scale = S3→S5 + infra-ops + compliance,
earned rung by rung. The cleaning staff keeps their job — agents run the digital company; the physical
world still needs humans. One executive, a decision queue, an org that never sleeps: that's the product.
