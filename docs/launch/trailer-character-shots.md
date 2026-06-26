# Cinematic trailer — the human character package (Higgsfield-ready)

> Goal: a cinematic trailer where **one real-looking human** experiences the whole competitor.inc journey.
> The trap in AI video is **character consistency** — the person's face/clothes drift between clips. This
> package solves that. Generate these in **Higgsfield** (which you have). Pairs with the
> [storyboard](trailer-storyboard.md), the [animatic](trailer-animatic.html), and the
> [build kit](trailer-build-kit.md).

## The technique (read first — this is what makes it work)
1. **Lock one character** (sheet below) and generate **ONE reference portrait** of her.
2. For every scene use **Image-to-Video** in Higgsfield with that portrait as the **start frame** → the same
   face every time. (Higgsfield also has character/"soul" consistency — turn it on.)
3. **Keep wardrobe + hair + lighting identical** across clips (noted in each prompt).
4. **Don't let the AI fake the website.** Generate the human *reacting* (over-the-shoulder, face lit by the
   screen, hands on the laptop) — then **intercut real screen-recordings** of the actual product. That keeps
   the UI real (honest) and dodges the model hallucinating fake UI. Human shots + product shots are edited
   together, never generated as one.

## The locked character sheet (paste into every prompt)
`MAYA — a 25-year-old first-time founder. South-Asian, warm brown skin, expressive dark eyes, shoulder-length dark wavy hair tucked behind one ear. Wears a soft oatmeal knit sweater over a white tee, small silver stud earrings, a thin wristwatch. Natural minimal makeup, a few freckles, an earnest expressive face. Slim build. Photorealistic, natural skin texture.`
*(Swap her for yourself — or film yourself — if you'd rather; the structure is identical.)*

**Reference portrait prompt (make this image first):**
`Photoreal 35mm portrait of MAYA [paste sheet], soft window light, shallow depth of field, neutral cream background, calm neutral expression looking slightly off-camera.`

**Global style + negative (every clip):**
`35mm cinematic, shallow depth of field, volumetric light, warm cream/ink palette with a coral accent, photoreal.` · Negative: `text, watermark, distorted face, extra fingers, low quality, cartoonish.` · 5-sec clips, 16:9 + a 9:16 cut.

## The human shots (Image-to-Video, reference portrait as start frame)

| # | scene | image-to-video prompt (append: "same character as reference, same oatmeal sweater") | camera |
|---|---|---|---|
| 1 | pain | "MAYA slumped at a glowing laptop in a dim apartment at night, head on her hand, exhausted and discouraged, rain on the window, screen glow on her face, moody blue light" | slow dolly-in |
| 3 | reveal | "MAYA at the laptop as warm cream light blooms from the screen onto her face; she lifts her head, curiosity and the first spark of hope, eyes softening" | gentle push-in |
| 4 | validate | "over-the-shoulder of MAYA leaning toward the laptop, focused then pleasantly surprised, a small hopeful smile starting, warm light" | over-shoulder, slight push |
| 5 | control | "close-up of MAYA's hand tapping the trackpad with calm confidence, then her composed face giving a small satisfied nod, warm light" | macro → face |
| 6 | command | "MAYA sitting back like a confident young CEO, typing a short command, assured and focused, warm rim light" | slow orbit |
| 9 | freedom | "MAYA walking through a sunny city street, relaxed and happy, glancing at her phone and tapping it one-handed with a satisfied smile, golden daylight" | handheld, lifestyle |
| 11 | payoff | "MAYA in golden morning light looking at her phone, overwhelmed with joy, hand to her mouth, eyes glassy with happy disbelief, breaking into a radiant smile" | warm push-in |
| 13 | close | "MAYA gives a warm, genuine little wave to camera, calm confident smile, soft cream background" | locked, slight push |

## The product shots (screen-record — intercut between the human shots)
Scene 2 (the rival's betrayal — abstract/ominous, no character) · 7 (the 3D agent floor) · 8 (the Live Glass Box flipping artifacts) · 10 (night/while-you-sleep, abstract) · 12 (text cards). Record the running sim at 1080p.

## Assemble (free)
DaVinci Resolve / Shotcut. Order = the 13-scene storyboard. Layer the human clips + screen-recordings + VO + music. The animatic ([trailer-animatic.html](trailer-animatic.html)) is your timing/edit reference — match its beats.

## The two honest paths
- **AI human (fastest):** generate MAYA in Higgsfield per above. Fully synthetic but consistent.
- **Real human (most authentic + truest to brand):** film yourself or a friend at a laptop doing these same beats; intercut the real screen-recordings. Ceapest, warmest, and unmistakably real.

Roadmap scenes (9–11) are the **vision** — add a "the vision" title card for public cuts.
