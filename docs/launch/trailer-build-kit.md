# Trailer build kit — render the cinematic cut (free / open-source)

> The playable **animatic** lives in [`trailer-animatic.html`](trailer-animatic.html) (open it in a browser — it
> auto-plays all 13 scenes in the Paper & Ink brand with VO captions). This kit turns that previz into the
> finished cinematic trailer using **free, open-source** tools. Total target runtime ~3:00.

## Tools (all free)
- **Cinematic clips:** [ComfyUI](https://github.com/comfyanonymous/ComfyUI) + an open video model — **Wan 2.2** (best quality, ~24GB VRAM) or **[LTX-Video](https://github.com/Lightricks/LTX-Video)** (runs on ~12GB). No GPU? Use a free HF Space / Colab, or rent a cloud GPU (~$0.30/hr).
- **Real product shots:** screen-record the running sim (it's honest + on-brand).
- **Assemble + music + text:** DaVinci Resolve (free) or Shotcut / Kdenlive (open-source).
- **Voiceover:** any free TTS (or record yourself — warmer).

## Global style (paste into every clip's prompt)
`35mm cinematic film look, shallow depth of field, volumetric light, warm "paper and ink" palette — soft cream (#f7f0da), deep ink black (#14130e), single coral accent (#ff5a36), premium, hopeful, human, photoreal.`
**Negative:** `text, watermark, logo, distorted faces, extra fingers, low quality, oversaturated, cartoonish.`
**Settings:** 16:9 (+ a 9:16 export for social), 24fps, 5-second clips, 2–3 takes per scene, pick the best.

## Per-scene shot list (clip = AI-generated · capture = screen-record)

| # | ~time | type | the clip | VO line / on-screen text |
|---|---|---|---|---|
| 1 | 0:00–0:18 | clip | "tired young founder alone at a glowing laptop in a dim apartment at night, head in hands, crumpled notes, rain on the window, slow dolly-in, melancholic blue light" | *text:* "You built it. Nobody came." |
| 2 | 0:18–0:38 | clip | "abstract — coral-and-red money particles draining into black, a sleek AI interface running alone with no human, ominous red rim light, slow push-in, unsettling" | VO: "The AI tools spent your money in the dark — and took a cut." |
| 3 | 0:38–0:52 | clip→logo | "warm cream light blooms across a dark room, hopeful, lens flare resolving to clean cream" → cut to the competitor.inc wordmark | VO: "competitor.inc is the honest one." |
| 4 | 0:52–1:10 | capture | screen-record the Validation Gate: type idea → "checking demand" → "Strong signal ✓" | VO: "It runs a real demand test — honestly — before it builds anything." |
| 5 | 1:10–1:30 | capture | the Glass Box log + an Approval card; thumb taps Approve | VO: "Every action, every dollar — visible. Nothing happens without your yes." |
| 6 | 1:30–1:42 | capture | the House command bar: type a directive, send | *text:* "You give the orders." |
| 7 | 1:42–2:02 | capture/clip | the 3D agent floor (the Office/House) — crew working; crane move | VO: "A crew of AI agents builds and runs the winner." |
| 8 | 2:02–2:18 | capture | the Live Glass Box flipping website → ad → post → A/B (B wins) | VO: "Not just stats — the actual work." |
| 9 | 2:18–2:38 | clip | "the founder, calm and happy, walks through a sunny city, glances at phone and taps approve one-handed, golden daylight, handheld lifestyle" | VO: "Run your company from your texts." *(planned)* |
| 10 | 2:38–2:52 | clip | "night, founder sleeps peacefully in moonlight; dreamlike glowing office working in parallel; revenue counter rising; serene time-lapse" | VO: "It works while you sleep." *(vision)* |
| 11 | 2:52–3:06 | clip/graphic | golden morning, founder wakes, sees "$10,000 / month" on phone, overwhelmed joyful smile | VO: "One month in — ten thousand a month. Provably." *(goal)* |
| 12 | 3:06–3:14 | graphic | bold cream-on-coral text cards on a beat | "Validate first. / Stay in control. / 0% of your revenue." |
| 13 | 3:14–3:20 | graphic | the coral competitor.inc wordmark + tagline + CTA | VO: "competitor.inc — prove it before you build it." |

## Music + pacing
Sparse melancholic piano (1–2) → low tension drone (2) → the beat drops into a warm driving synth on the reveal (3), rides through the product (4–8), swells on freedom/sleep/payoff (9–11), peaks on the thesis (12), resolves on the close (13). Free beds: YouTube Audio Library, Pixabay Music, or Freesound (CC0). Slow start → quicken through the product → land clean.

## Honesty note (for public use)
Scenes 9–11 depict **planned/roadmap** features (texting agents, full autonomy, the $10K milestone). For a public launch cut, add a small **"the vision"** title card before scene 9, or keep this full version for pitches/investors. Keeps us "honest by design."

## Workflow
1. Generate clips 1,2,3,9,10,11 in ComfyUI (Wan/LTX) from the prompts above — 2–3 takes each, pick the best.
2. Screen-record the sim for 4,5,6,7,8 at 1080p (clean cursor, no bookmarks).
3. Drop everything on a DaVinci timeline in order, trim to the timings, add the text cards + VO + music.
4. Export 16:9 (site/YouTube) + a 9:16 cut (X / IG / TikTok) + a 60-sec teaser (scenes 1,3,4,5,8,11,13).
