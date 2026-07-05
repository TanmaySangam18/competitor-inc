# Orgware — the manifesto

_The founding document of a new discipline. Canonical source of truth for the category competitor.inc
coins and owns. (Working label: **orgware / orgware engineering** — "orgware" had faint 1990s use for
"organizational software"; we redefine it for the AI era. The concept is the invention; the label is one
find-replace away if we choose another word.)_

## The one line
> **Orgware is the runnable, governed organization layer — a company's operations expressed as an agent
> workforce you own and can prove. Orgware engineering is the discipline of building it.**

## The thesis (why this is a *minute ahead*)
Every AI discipline so far optimized a **smaller unit** and hit a ceiling:

| Discipline | Unit of work | Ceiling |
|---|---|---|
| Prompt engineering | the **message** | one good answer ≠ a system |
| Context engineering | what the model **sees** | better inputs ≠ autonomy |
| Loop engineering | the **worker** (agent's act→verify loop) | a perfect worker ≠ a company |
| **Orgware engineering** | the **company** (governed agent org) | — |

The ceiling on agent *loops* was never intelligence. It's **trust, coordination, and persistence.** A
company isn't *more capability* — it's **accountable autonomy, coordinated across many agents, over time.**
So the next unit up from "the loop" is "the **governed organization**." You stop engineering the agent and
start engineering the **org and its constitution**: roles, handoffs, verification, governance, memory. A
great agent loop becomes a **single hire.**

## The layer (why it's a category, not a feature)
Category kings name a **layer**, not a feature — "software eats the world" beat any single app.

```
hardware  →  software  →  ORGWARE
(machines)   (programs)    (the organization that runs on programs that run on machines)
```

The company itself becomes the deployable, ownable, provable artifact.

## The six laws of orgware engineering
Each maps 1:1 to a **shipped primitive** — this is a named description of what we already built, not a wish.

1. **The org is the unit.** You design roles / handoffs / lifecycle, not prompts. → `lib/engine/{supervisor,agent-lifecycle,task-queue}.ts`
2. **Separation of powers.** No agent grades its own work (generator ≠ evaluator); verification is structural. → `supervisor.ts` (verify step), `AGENTS` verifier duty
3. **Bounded autonomy.** Every action is attributable, capped, and reversible-or-approved. → `policy.ts`, `wallet.ts`, `spendguard.ts`, honest-undo (`reversibility.ts`)
4. **A thin human spine owns only the irreducible** (~the accountable 2%: sign / file / KYC). Agents *earn* autonomy via verified track record. → `accountability-spine.ts`
5. **Proof over claims.** Nothing is "done" without a verifiable artifact. → `execution.ts` `verifyProof`, the Glass Box
6. **Persistence.** The org remembers, learns, and self-heals over time, not just per task. → `memory.ts`, `operating-loop.ts`

## The reference implementation
**competitor.inc is the first company built with orgware engineering.** Give it a goal → a supervisor
composes an agent org that plans → builds (a real, live, verified app) → runs GTM/support as drafts to the
human's desk → governed at every step. Watch it at `/orchestrator`. (~53% of the full machine today; the
frontier is long-horizon operation + full backend builds via OpenHands.)

## Why it's ours to own (and un-collidable)
- **Not Anthropic/OpenAI** — they build the *brain* (models); orgware is the *organization* that runs on
  brains. We're their customer, never their competitor.
- **Not Devin/Lovable** — they ship a *product*; orgware runs the *company*.
- **Not Polsia** — they auto-act and take a cut; orgware keeps the human accountable and the owner in control.
- **Counter-position (7 Powers):** the autonomy-max players can't add real governance without slowing down.

## Proof-to-become-king (Play Bigger)
A coined word only sticks with proof + volume:
1. **Define it** — this doc is the canonical definition; repeat the language everywhere.
2. **Be the reference implementation** — a real company visibly run this way, with public verifiable proofs.
3. **Be first + loud** — POV content, the live demo, the proof board; make "orgware" the word people reach
   for when they mean *a company that runs itself, accountably*.
4. **Ride the trend** — the agent economy + the one-person company give the market a slot to file us under.

## The honest caveat
Naming a category is powerful but not sufficient — most attempts fail. The decider is **proof and being
first/loud**, which is exactly why the launch + a first real customer matter more than the label. We coin
orgware because we **already built its primitives** — the term describes something real. That's what makes
it earnable, not delusion.

_One-liner to standardize everywhere:_ **"competitor.inc — the first company built with orgware engineering:
your business runs on a governed agent workforce, and every action is provable."**
