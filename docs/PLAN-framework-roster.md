# Plan — the advisory roster (a growing library of proven frameworks the agents draw on)

> Internal. The founder's idea: curate ~1,000+ real, documented thinkers/operators (Rory Sutherland-class)
> and their frameworks; agents pick the right one per the user's needs, **check whether it has actually
> worked**, apply it, and **inform** the user (who can verify) — no approval needed. Roster keeps growing.
> This doc captures the design + the legal/cost model.

## It's an evolution of what already exists — not a new pillar
- Agents already each "play a playbook" (the `AGENTS` map: Apex→Playing to Win, Surge→Hacking Growth, …).
- The public `/playbooks` tab already restates frameworks in our own words.
- The dynamic-crew engine (Block 4) + the outcome-learning loop (the moat, see PLAN-deep-tech-autonomy.md).
- This = **structure + scale + a success-check + transparent attribution** on top of those.

## Data model — a `FrameworkEntry`
`{ author (public attribution), framework, summary (OUR words), whenToUse (context tags: domain/stage/task),
evidence (documented public track record + source URL), ourOutcomes (results measured when WE applied it),
confidence }`. The roster is just this registry, grown by curation (an agent can draft entries; founder reviews).

## Selection (how the agent "picks them up")
The orchestrator matches the user's situation — idea domain, stage, the specific task — to each entry's
context tags, then ranks by **relevance × documented-evidence × our-measured-outcomes**. It applies the
top fit(s) and shows its reasoning.

## The success-check (honest — this is the crux)
Two layers, never fabricated:
1. **Documented track record** — where the framework has demonstrably worked, with a real source. Never
   invent a "success rate." If evidence is thin, say so and lower confidence.
2. **Our measured outcome** — the outcome-learning loop: when we apply a framework, we measure the real
   result (signups/conversion/revenue) and feed it back, so the system learns *which frameworks work in
   which contexts*. This is the compounding moat.
"Success is contextual" — a framework that won for Red Bull may not fit a SaaS. We surface **evidence +
relevance + measured result**, not false certainty. (Consistent with the founder's no-made-up-numbers rule.)

## Why this needs NO approval (and that's correct)
Approval gates **consequences** — spending money, posting publicly, deploying, deleting. **Choosing which
publicly-documented framework to reason with is not a consequence or irreversible** — so it's surfaced
**transparently in the Glass Box** ("Applied X's framework because Y; source: …; measured result: …") for the
user to **verify**, not approve. This is exactly the right line: approve consequences, show reasoning.

## The legal + cost model — you do NOT pay these people (if done right)
*(General principles, not legal advice — get a quick IP review before scaling named-person attribution publicly.)*
- **Ideas, methods, systems, and frameworks are NOT copyrightable** (the idea/expression dichotomy, 17 U.S.C.
  §102(b)). Applying a framework — *restated in our own words* — is **free**. No payment to the author.
- **Naming someone to refer to their actual public work** is generally **nominative fair use** (you may say
  "we applied Rory Sutherland's psycho-logic" the way a textbook cites a theory).
- **Do NOT:** reproduce their copyrighted text/slides verbatim; imply **endorsement, partnership, or
  affiliation**; or use their name/likeness to suggest they back the product (right of publicity + false
  endorsement, Lanham Act §43(a)). "Powered by Rory Sutherland" = ❌. "Applying a framework Rory Sutherland
  documented" = ✅.
- **Do:** restate methods in our own words; attribute accurately; frame it as *"applying publicly-documented
  frameworks,"* not *"these experts advise us"*; cite sources so the user can verify.
- **Your only costs:** curating the roster (cheap; agent-assisted) + inference + the outcome-data infra. $0 to the experts.

## Build sequencing
Post-launch. Extend `lib/engine/playbooks.ts` into the `FrameworkEntry` registry + wire selection into the
dynamic-crew engine + the outcome-learning loop. Seed small (the frameworks we already cite — Lafley/Martin,
Weinberg/Mares, Ellis, Cialdini, Fogg, Sutherland…), grow by curation. Keep the public-tab framing rule
([[playbook-tab-framing]]) distinct: the *public* tab stays a neutral resource; the *agent→user* attribution
here is in-product transparency about the user's own company.
