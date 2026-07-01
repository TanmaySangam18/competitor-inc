# Block M verdict: do NOT integrate OpenMontage (defer video ads)

Researched `calesthio/OpenMontage` (30.6k★, "first open-source agentic video production system") as the
open-source, non-Meta path for AI video ad creative (the user's Block M idea). Verdict: **don't integrate.**

## Why not (three hard blockers)
1. **License = AGPLv3 (network copyleft).** Integrating it into competitor.inc — a hosted network service —
   triggers AGPL's §13 network-use clause: we'd be obligated to release competitor.inc's source under
   AGPL. Dealbreaker for a proprietary product. (Fine for the founder to run it *personally/manually*;
   not fine to bake into the SaaS.)
2. **Not an embeddable library.** It's a standalone Python app orchestrated *by* a coding agent (Claude
   Code/Cursor/Codex), run via `make setup`/`make demo`. No library API, no service/Docker model to call.
3. **Heavy runtime.** Python 3.10+ + FFmpeg + Node ≥22 + Remotion/HyperFrames; quality output needs a
   local GPU (WAN 2.1/Hunyuan/etc.) or paid APIs (FAL, Runway, HeyGen, ElevenLabs). Cannot run in a
   Vercel serverless function; would require a dedicated GPU service we don't have.

## Also: video ads aren't our wedge right now
- The [[nu-beachhead]] plan is on-campus/warm — video ads are irrelevant there.
- Real ad spend is **F1-risky** ([[path-to-paid-f1]]) and needs the founder's ad accounts anyway.
- Polsia's Meta AI-video ads are a scale play for "everyone"; we win on niche + trust, not ad volume.

## If video ad creative is ever wanted
- Best path: a **paid hosted video-gen API behind the Approval Inbox** (draft → approve → render), not a
  self-hosted AGPL app. Keeps it serverless-friendly and license-clean.
- Or: the founder runs OpenMontage **manually/offline** as their own tool and pastes results — no coupling.

**Decision: Block M deferred/dropped. Distribution effort goes to Block D (Bluesky + Reddit, approval-gated).**
