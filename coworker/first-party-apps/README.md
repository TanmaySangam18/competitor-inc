# First-party coworker apps (Competitor.Inc)

Our own work surfaces for the coworker, built on its Apps system (spec: an app = a folder with
`rowboat-app.json` + `dist/`) — **purely additive; no upstream file is modified.** Apps render in the
coworker as iframes on their own local origin (`<slug>.apps.localhost:3210`).

## Install (until the build pipeline bundles these automatically)

Copy the app folder into the coworker's working directory apps folder, e.g.:

```bash
cp -R coworker/first-party-apps/executive-inbox "$HOME/.rowboat/apps/"   # WorkDir/apps
```

Then open **Apps** in the coworker — the surface appears alongside any installed apps.

## Apps

- **executive-inbox** — Decisions awaiting you. Frames the engine's authenticated `/decisions` page
  (the queue lives server-side behind the principal's session; the app holds no data or secrets).
  Engine URL is configurable in the app's top bar (default `http://localhost:3000`). The engine allows
  this exact origin to frame `/decisions` via CSP `frame-ancestors` (see `next.config.ts`) — everything
  else keeps the blanket clickjacking DENY.
