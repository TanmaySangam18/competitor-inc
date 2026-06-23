# Playbook — $0 AI compute (the creative way)

> The problem: to give users the experience, competitor.inc needs to run real AI — but the founder has
> **$0** for compute. The honest trap: "open-source models are free" means the *weights* are free, not the
> *inference* (someone always pays for the GPU). So we don't out-spend the problem — we **out-think** it.
>
> **Thinking tool used here — TRIZ's "Ideal Final Result":** the ideal system performs its function using
> resources *already present in the environment*, at zero cost to you. Applied here, that flips the whole
> question. Instead of *"how do I pay for the users' AI?"* we ask **"whose compute and whose budget are
> already sitting there, unused, that I'm allowed to use?"** Three answers fall out — and they stack.

---

## Layer 1 — Make the *user's own device* do the work (the creative unlock)

The biggest idle resource in the system is **the visitor's own computer**. Modern browsers can run a real
LLM **client-side via WebGPU** — no server, no API bill, and it **scales infinitely** because every new
user brings their own GPU.

- **Tools:** **WebLLM** (MLC) and **Transformers.js v4** (Hugging Face). WebLLM ships an **OpenAI-compatible
  API** — so it drops straight into our existing `openai-compatible` engine with *no architecture change*.
- **Real numbers (2026):** Llama 3.1 8B (4-bit) ≈ **41 tok/s**, Phi-3.5-mini ≈ **71 tok/s** on a modern
  laptop; sub-2B models are instant. One production team reported cutting a **$12,000/mo inference bill to
  $0** by moving inference to the client.
- **Coverage:** ~**65% of users** (Chrome/Edge desktop + recent Android) can run WebGPU today; ~90%+ on
  desktop. So **two things from day one:** (1) a capability check, (2) a **fallback** to a hosted/free-tier
  API for the rest.
- **Fit for us:** perfect for the **free taste** — the simulated walkthrough + a *real* in-browser
  validation/chat run, at **$0 to us**, no rate limits, no key. The "wow" is free.

This is the TRIZ ideal: the function happens using a resource (the user's GPU) that costs us nothing.

## Layer 2 — Spend *other people's* credit, as a Northeastern student

You're sitting on funding you haven't claimed. All **non-dilutive** (you keep 100%):

- **GitHub Student Developer Pack** (you have a `.edu` email): **$100 Azure** + **$200 DigitalOcean** +
  **$312 Heroku** (~$600 cloud) + **free Copilot Pro**. Azure credit can run AI workloads.
- **Northeastern IDEA accelerator** (student-led, Boston): **up to $10k in grants** (up to ~$30k
  non-equity total), plus **AWS credits**, legal, and mentorship. They've backed **$700M+** in raises.
  This is a real, local, no-equity funding source you're *entitled to* as a student — apply.
- **Stackable startup credits:** Microsoft for Startups Founders Hub, Google for Startups, AWS Activate —
  community guides total **$400k+** in available AI/cloud credits across programs.

## Layer 3 — Partner with the model maker (yes, "partner with Claude")

You asked if we can partner with Claude — **the answer is yes, directly:**

- **Claude for Startups (Anthropic Startup Program):** **$25,000–$100,000+** in Claude API credits,
  **non-dilutive** (no equity), open to **early-stage founders with or without VC backing**, founded within
  4 years, no prior Anthropic credits. **~2-minute application**, 7–21 business-day review, credits valid
  12 months, usable across **Opus / Sonnet / Haiku**. Apply at `claude.com/programs/startups`.
- That single grant would power competitor.inc's *strong-model* moments (the ones that build trust) for a
  very long time at our usage — funded entirely by the credit, **$0 out of pocket**.
- (OpenAI also offers up to ~$1k subsidized API credits for academic-affiliated research — minor, but you
  qualify.)

---

## The mix (Ideal Final Result, assembled)

Because our engine is already provider-agnostic, we **route by moment**, never paying when we don't have to:

| Moment | Who pays the compute | Cost to us |
|---|---|---|
| Simulated demo / the "wow" | nobody (no model call) | **$0** |
| Free-user *real* taste | **the user's browser** (WebLLM), fallback to a free-tier API | **$0** |
| Trust-critical strong-model runs | **Anthropic / Azure / IDEA credits** | **$0 out of pocket** |
| Paying users (managed) | their **$39** (cheap models, nightly batch) | covered, ~85% margin |
| Power / privacy users | **BYOK** (their own key) | **$0**, ~100% margin |

## Honest caveats
- Browser AI quality (sub-8B) is weaker than Claude/Gemini — fine for the *taste* and routine agents, not
  for the headline reasoning. Keep a strong model (credit-funded) for the moments that decide trust.
- ~35% of users can't run WebGPU → the API fallback must always exist.
- Credits expire (≈12 months) and have terms — they're **runway to reach revenue**, not forever-free. By
  the time they run out, paying customers fund the bill. That's the bootstrapper's ladder.
- Building the browser-AI layer is a real feature → it's a **post-Monday / handoff** build (the engine
  already speaks WebLLM's OpenAI-compatible API, so it's a drop-in, not a rewrite).

## Do-now checklist (paperwork, not code — fits the freeze)
1. Apply to **Claude for Startups** (`claude.com/programs/startups`) — 2 minutes.
2. Claim the **GitHub Student Pack** (Azure $100 + more).
3. Apply to **Northeastern IDEA** for a grant + AWS credits.
4. Friend, post-Monday: add a **free-tier provider** (Gemini Flash / Groq) as the default, and spike
   **WebLLM** as the browser fallback.

**Sources:** [WebLLM](https://github.com/mlc-ai/web-llm) · [in-browser LLM guide](https://pockit.tools/blog/run-llms-browser-webgpu-transformers-js-chrome-built-in-ai-guide/) · [Claude for Startups](https://claude.com/programs/startups) · [GitHub Student Pack](https://education.github.com/pack) · [Northeastern IDEA](https://www.northeastern.edu/idea/) · [free AI credits guide](http://www.uuai.me/post/free-ai-api-credits-2026-startup-programs-guide)
