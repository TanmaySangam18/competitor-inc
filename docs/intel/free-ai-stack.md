# Free / open AI for competitor.inc — the honest landscape (researched June 2026)

> Goal the founder asked for: "open-source free AI equal to Opus 4.8 → give users free AI with no API cost."
> Honest headline: **that exact thing doesn't exist.** But a real **$0-to-you** path does, and our engine
> already supports it. Sources linked at the bottom.

## Onyx — good project, wrong tool for this
Onyx (onyx-dot-app) is **"the application layer for LLMs"** — RAG, search, chat over your data, MIT,
self-hostable. **It is NOT a model** and **does not provide a free LLM** — its own docs say it "supports all
major LLM providers, both self-hosted (Ollama/vLLM) and proprietary (Anthropic/OpenAI/Gemini)." So you'd
*still* need a model behind it (which costs). It solves "a nice chat/RAG UI over my docs," not "free AI for
my users." Verdict: **skip for this goal** (could be handy as internal doc-search later; irrelevant to the model question).

## The two truths to internalize
1. **No open model is "equal to Opus 4.8."** Closest in June 2026 is **GLM 5.2** (744B) — within ~1 point of
   Opus 4.8 on a couple of benchmarks (FrontierSWE 74.4 vs 75.1; MCP-Atlas 76.8 vs 77.8). DeepSeek V4 Pro
   leads open coding; Kimi K2.6 leads agentic stability; Qwen3.5 leads some reasoning. **Near-Opus on narrow
   benchmarks, not equal overall** — and benchmarks ≠ real capability.
2. **"Open weights" ≠ "free inference."** GLM 5.2 / DeepSeek-V4 are huge — running them needs serious,
   *paid* GPU. Downloading the weights is free; serving them to your users is not. This is the trap.

## What is genuinely FREE-to-you (and the catch on each)
| Route | Truly free to you? | The catch |
|---|---|---|
| **On-device / in-browser** (WebLLM / Transformers.js + WebGPU) | **Yes — $0, runs on the USER's device, no key, fully private** | Small models only (≤~2B params for usable speed; <2GB). "Good enough for light tasks," not Opus-level. |
| **Google Gemini free tier** (AI Studio) | Free: 1,500 req/day Flash, no card | **Prohibits high-volume commercial use** → must move to paid Vertex at scale. ToS risk for a product. |
| **Groq free tier** | Free, OpenAI-compatible, very fast | Reduced in 2026 (~1,000 req/day, 30 RPM). Fine for early cohort. |
| **Cerebras free tier** | Free ~1M tokens/day (2026) | Rate-limited; verify current terms. |
| **OpenRouter free models** | ~200 req/day/model (1,000 with a one-time $10) | Per-model caps; quality varies by model. |
| **Credits** (Claude for Startups, cloud, student packs) | Effectively free for a while | Finite; for the strong-model moments. |
| **BYOK** (user brings their own key) | $0 to you | Only power users will. (We already support it.) |

**Privacy/commercial caution (this matters most for US — trust is our wedge):** some free tiers **train on
your data** or **forbid commercial use**. Prefer **no-training** providers (OpenRouter/Groq/Cerebras per the
sources) or **on-device** (most private). Read the commercial-use terms before shipping. Rate limits change
often — verify before relying on a number.

## The recommended config (it's a SETTING, not a rebuild)
Our engine is already model-agnostic (`MODEL_PROVIDER=openai-compatible` + `MODEL_BASE_URL`), so route by moment:
- **Demo + free tier:** on-device WebLLM (true $0) **or** a free-tier API (Groq/Cerebras/OpenRouter) — "the taste."
- **Trust-critical moment** (the validation verdict): a strong model funded by **credits** (Claude for Startups → real Opus 4.8) — quality where it decides trust.
- **Paying users:** their usage self-funds; or **BYOK**, uncapped.
This is exactly the "build-it-on-zero-budget" playbook + our existing architecture. Cost to you ≈ **$0** for
the early cohort, scaling to credits/paid only where quality decides trust.

## The blunt bottom line
There is **no free Opus-equal button.** What's real: ship the **free tier on on-device or a free-tier API**
(small/good-enough), and **reserve a credit-funded strong model for the moments that earn trust.** That's the
honest plan, and we're already wired for it.

## Sources
- Onyx: github.com/onyx-dot-app/onyx (README)
- Open-model rankings (Jun 2026): benchlm.ai/blog/posts/best-open-source-llm · llm-stats.com · lmcouncil.ai/benchmarks
- Free API tiers (2026): openrouter.ai/blog/tutorials/free-llm-apis-compared · ianlpaterson.com/blog/free-llm-api-2026 · github.com/mnfst/awesome-free-llm-apis
- On-device: web.dev/learn/ai/client-side · WebLLM / Transformers.js (WebGPU)
