# Free, Self-Hostable Open-Weight LLMs: Security & Privacy Comparison (June 2026)

**Scope:** FREE, downloadable open-weight / open-source LLMs you can run on your own hardware
or infrastructure. Assesses license & free-usage rights, privacy, telemetry/runtime risk,
cybersecurity & known CVEs, prompt-injection/jailbreak resistance, community trust, and
suitability for sensitive data — then gives use-case recommendations and a hardening checklist.

**Source/uncertainty note:** The open-weight space moves fast. License families, the 700M-MAU
clause, the EU restriction, CVE identifiers and supply-chain incidents are verified against the
sources listed at the end. Very recent (2026) version numbers are "best available at time of
writing." No CVE, license term, or incident below is fabricated; uncertain items are flagged.

---

## 1. Summary comparison table

| Model family | Maintainer / Origin | Typical license | Open-source vs open-weight | Commercial use | Best-for |
|---|---|---|---|---|---|
| **Llama** | Meta (USA) | Llama Community License (custom, **not** OSI) | Open-**weight** only | Yes, but **700M-MAU cap**; **EU restriction** on multimodal | General-purpose; large ecosystem; non-EU enterprises |
| **Mistral / Mixtral** | Mistral AI (France/EU) | **Apache 2.0** for general models (some specialized = commercial/MRL) | Open-**weight** | Yes, unrestricted (Apache ones) | EU-friendly, permissive license, efficient MoE |
| **Qwen** | Alibaba (China) | **Apache 2.0** for most open models (some "Qwen Research License") | Open-**weight** | Yes (Apache models) | Multilingual, coding, strong capability/size — *origin caveats* |
| **Gemma** | Google (USA) | Custom **Gemma Terms** (1–3); **Apache 2.0** for Gemma 4 | Open-**weight** | Yes, custom AUP + **Google can remotely restrict** (≤3) | On-device/small footprint; Gemma 4 if you need Apache |
| **DeepSeek** | DeepSeek / High-Flyer (China) | **MIT** (weights + inference code) | Open-**weight** (MIT, very permissive) | Yes, essentially unrestricted | Strong reasoning, cheap to license — *origin caveats* |
| **Phi** | Microsoft (USA) | **MIT** | Open-**weight** | Yes, unrestricted | Small/efficient reasoning; edge; permissive |
| **OLMo** | Allen Institute / Ai2 (USA) | **Apache 2.0** | **Fully open-source** (weights + code + **training data**) | Yes, unrestricted | Auditability, research, compliance |
| **Falcon** | TII (UAE) | **Apache 2.0** (Falcon 2+) | Open-**weight** | Yes | Permissive alternative; multilingual |

**Key distinction:** *Open-weight* = you get weights (+ usually inference code) but not the
training data/recipe. *Open-source* (strict OSI/Ai2 sense) = weights **plus** code **plus**
training data + recipes. Only **OLMo** here is "fully open" by that strict definition.

---

## 2. Per-model assessments (condensed)

- **Llama (Meta, USA)** — Llama 4 (Scout/Maverick, Apr 2025). **Custom license, NOT OSI.** Two
  catches: **700M-MAU clause** (need Meta's permission above that) and an **EU restriction on
  multimodal** models (all Llama 4 are multimodal → effectively off-limits for EU-domiciled
  deployment). Must show "Built with Llama" + carry "Llama" in derivative names. Self-hosted
  weights keep prompts local; ships Llama Guard / Prompt Guard classifiers (bypassable like all).
  Large mature US ecosystem. *Good when self-hosted, except EU-domiciled orgs.*

- **Mistral / Mixtral (France/EU)** — **Apache 2.0** for general models (Mixtral 8x7B/8x22B,
  Mistral Small 3, the Dec-2025 "Mistral 3" family). Fully permissive, no MAU cap, no EU clause.
  Some *specialized* models ship commercial/research-licensed — check the card. Lighter safety
  tuning (more flexible, add your own guardrails). EU governance is a GDPR plus. *Very good for
  self-hosting — cleanest license + origin.*

- **Qwen (Alibaba, China)** — Qwen3 family (Apr 2025) + fast-moving 2026 releases; **most open
  Qwen models are Apache 2.0**. Technically excellent (coding/multilingual). Self-hosted weights
  keep prompts local. **Watch `trust_remote_code`** (some variants ship custom Python that runs
  on load). May show PRC-aligned content behavior. **Origin = policy decision**, not a technical
  exfiltration property of offline weights. *Strong when self-hosted + network-isolated.*

- **Gemma (Google, USA)** — Gemma 3 (Mar 2025) incl. tiny on-device variants; **Gemma 4 reportedly
  Apache 2.0**. Gemma 1–3 use **custom terms** where **Google reserves the right to remotely
  restrict** usage. Strong safety tuning. *Good technically; prefer Apache Gemma 4 to avoid the
  control clause.*

- **DeepSeek (China)** — V3/R1 + later point releases, **all weights MIT** (among the most
  permissive). **CRITICAL distinction:** self-hosted weights = prompts stay local; the **hosted
  app/API** had documented serious privacy problems (data to ByteDance-controlled servers,
  unencrypted, regulator findings; banned on many govt devices). *Those findings are the hosted
  service, NOT offline weights.* Strong reasoning. *Usable fully self-hosted + isolated; never
  route sensitive data to its hosted API.*

- **Phi (Microsoft, USA)** — Phi-4 (14B, MIT, Jan 2025) + reasoning variants. **MIT**, fully
  permissive. Small → easy true on-device/edge use (strong privacy posture). US vendor, good
  docs. *Very good for self-hosting/edge.*

- **OLMo (Ai2, USA)** — OLMo 2 (7B/13B/32B), **Apache 2.0**, **fully open-source** (weights +
  code + **training data** + checkpoints). Unique auditability/provenance. Lower capability
  ceiling than frontier open-weight. *Excellent where auditability/compliance is required.*

- **Falcon (TII, UAE)** — **Apache 2.0** (Falcon 2+), multilingual, a third country-of-origin
  option. Smaller ecosystem.

---

## 3. Cross-cutting: the weights are inert — the RUNTIME is the live risk

When you self-host, the attack surface is the inference stack + how you got the model, not the
model math.

- **Telemetry by runtime:** Ollama, llama.cpp, LM Studio, vLLM are local-first and don't
  exfiltrate prompts by default — *verify with network monitoring*. **HF `transformers`:
  `trust_remote_code=True` executes arbitrary Python from the repo on load** → treat any model
  that *requires* it as untrusted code.
- **Serialization (the #1 weights risk):** **pickle (`.bin/.pt/.ckpt`) executes code on load.**
  JFrog/ReversingLabs found 100+ malicious models on HF; the "nullifAI" technique evaded
  Picklescan to deploy reverse shells. **Use safetensors only; refuse pickle from untrusted sources.**
- **Verified runtime CVEs (don't run vulnerable versions):**
  - **Ollama CVE-2024-37032 ("Probllama")** — RCE; fixed 0.1.34+; internet-exposed/root-Docker
    instances were worst-hit.
  - **llama.cpp** GGUF-parser flaws (**CVE-2025-53630**, **CVE-2025-49847**, + advisories) — a
    malicious GGUF can compromise the host.
  - **vLLM CVE-2025-66448** (RCE via config `auto_map` *even with* `trust_remote_code=False`;
    fixed 0.11.1+) and **CVE-2025-62164** (`torch.load` RCE, CVSS 8.8, ≥0.10.2).
  - *Some 2026-dated IDs (CVE-2026-42248, -27940/-33298, -27893) appear in vuln DBs from single/
    secondary sources — verify the canonical advisory before relying; the bug classes are real.*

---

## 4. Prompt injection / jailbreaks — the industry-wide truth

**No model here — open or closed — is robust to prompt injection.** It's architectural: LLMs
process instructions and data in the same channel, so they can't reliably tell injected
instructions from trusted ones. **OWASP ranks Prompt Injection LLM01:2025** (#1 risk).
**Indirect** injection (malicious instructions in retrieved/tool-fed content) is especially
dangerous for agentic/RAG systems; RAG/fine-tuning **ground** but don't **secure**. Universal
jailbreaks (e.g. HiddenLayer "Policy Puppetry") reportedly bypass all major families.
US big-vendor models (Llama/Gemma/Phi) ship the most consumer safety tuning; Mistral/OLMo are
lighter; Qwen/DeepSeek add PRC-content alignment. **All bypassable — model safety is one layer,
never the only one.**

---

## 5. Recommendations by use case

- **Personal (laptop, privacy-first):** Phi-4, small Gemma 3, Mistral Small 3, or Llama (big
  tutorials). Qwen/DeepSeek fine *locally* — just not their hosted apps. Use Ollama/LM Studio,
  kept patched. Self-hosting keeps prompts on your machine — a real privacy win over any cloud bot.
- **Enterprise (production):** Cleanest licenses = **Mistral (Apache), Qwen (Apache), Phi (MIT),
  DeepSeek (MIT), OLMo (Apache), Falcon (Apache)**. Llama: check 700M-MAU + **avoid EU multimodal**.
  Gemma: prefer Apache Gemma 4. China-origin = procurement/data-residency *policy* call (not an
  offline-weight exfiltration property). Run on own infra (vLLM/TGI) + guardrails + monitoring.
- **Security-sensitive / confidential:** **OLMo** (max auditability) + Phi/Mistral. US-origin
  (Llama/Phi/Gemma/OLMo) or EU-origin (Mistral) usually aligns better with govt/regulated
  procurement than China-origin. Non-negotiables: fully self-hosted, **network-isolated/air-gapped**,
  safetensors only, verified provenance, strict guardrails, **no untrusted tool execution**.
  Avoid Llama 4 multimodal for EU confidential data (license).

**Core truth:** Self-hosting keeps prompts **under your control** (strong privacy win), **but
local ≠ secure.** Weights on your hardware do nothing about runtime CVEs, malicious model files,
prompt injection, weak guardrails, or an exposed API port. Security = your hosting environment,
sandboxing, supply-chain hygiene, guardrails, and ops — not the act of downloading the model.

---

## 6. Self-hosting hardening checklist

**Acquisition/provenance:** official vendor HF orgs only · **safetensors only** (refuse pickle)
· verify checksums · **never `trust_remote_code=True`** for untrusted repos · scan but don't
rely on scanners alone.
**Runtime supply-chain:** pin & patch (Ollama past 0.1.34; llama.cpp without known GGUF CVEs;
vLLM past CVE-2025-66448/-62164) · treat untrusted GGUF as code · follow advisories.
**Network/isolation:** bind to localhost/private net, **never expose the inference port** · run
sandboxed/containerized least-privilege (not root) · air-gap most-sensitive data · monitor
outbound for phone-home.
**Guardrails/ops:** input+output guardrails (Llama Guard / moderation model) · **assume prompt
injection is possible** → for agents: no untrusted tool execution, least-privilege tool scopes,
human-in-the-loop for high-impact actions · log/audit · rate-limit · incident plan · document
license compliance (Llama MAU/EU, Gemma terms, attribution) + origin decision.

---

## 7. Sources

Licenses/versions: https://www.llama.com/llama4/license/ · https://www.llama.com/llama4/use-policy/ ·
https://the-decoder.com/meta-releases-first-multimodal-llama-4-models-leaves-eu-out-in-the-cold/ ·
https://en.wikipedia.org/wiki/Llama_(language_model) ·
https://shujisado.org/2025/01/27/significant-risks-in-using-ai-models-governed-by-the-llama-license/ ·
https://the-decoder.com/new-mistral-small-3-does-more-with-less-under-apache-license/ ·
https://www.theregister.com/2025/12/02/mistral_3/ · https://docs.mistral.ai/models/overview ·
https://en.wikipedia.org/wiki/Qwen · https://huggingface.co/Qwen · https://ai.google.dev/gemma/terms ·
https://wcr.legal/google-gemma-license-risks/ ·
https://techcrunch.com/2025/03/14/open-ai-model-licenses-often-carry-concerning-restrictions/ ·
https://siliconangle.com/2025/03/24/deepseek-releases-improved-deepseek-v3-model-mit-license/ ·
https://www.marktechpost.com/2025/01/08/microsoft-ai-just-fully-open-sourced-phi-4-a-small-language-model-available-on-hugging-face-under-the-mit-license/ ·
https://allenai.org/blog/olmo2 · https://arxiv.org/pdf/2501.00656
Privacy/origin: https://slashdot.org/story/25/02/08/0531202/deepseek-ios-app-sends-data-unencrypted-to-bytedance-controlled-servers ·
https://www.cnbc.com/2025/04/24/south-korea-says-deepseek-transferred-user-data-to-china-us-without-consent.html ·
https://ollama.com/privacy
CVEs/supply-chain: https://www.wiz.io/blog/probllama-ollama-vulnerability-cve-2024-37032 ·
https://github.com/ggml-org/llama.cpp/security · https://www.sentinelone.com/vulnerability-database/cve-2025-49847/ ·
https://www.wiz.io/vulnerability-database/cve/cve-2025-66448 ·
https://zeropath.com/blog/cve-2025-62164-vllm-memory-corruption-summary ·
https://jfrog.com/blog/data-scientists-targeted-by-malicious-hugging-face-ml-models-with-silent-backdoor/ ·
https://thehackernews.com/2025/02/malicious-ml-models-found-on-hugging.html
Prompt injection: https://genai.owasp.org/llmrisk/llm01-prompt-injection/ · https://www.mdpi.com/2078-2489/17/1/54

**Confidence:** High on license families, open vs open-weight, DeepSeek hosted-app findings,
OWASP status, pickle-vs-safetensors, Ollama Probllama, core llama.cpp/vLLM CVE classes. Moderate
(verify) on exact 2026 version numbers and 2026-dated CVE IDs.
