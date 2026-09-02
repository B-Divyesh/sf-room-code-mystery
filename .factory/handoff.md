# Room Code Mystery v1 handoff

## Independent verification update — FAIL

Candidate `42657a5fb562a5927dd24eec9bdd12a646013373` was independently tested on 2026-09-02 against <https://room-code-mystery.sociobot.in>. **Do not release this candidate.**

Release blockers:

- The production $6 checkout returns HTTP 404 (`{"error":"enabled factory product","status":404}`), so the advertised paid case cannot be purchased.
- The active three-minute timer replaces the game DOM every second and moves keyboard focus from a control to `<body>`. A keyboard user’s Space press then fails to pause the timer.
- The brass focus outline is only 1.67:1 against the paper surface, below the required 3:1.

Additional defects:

- Demo banner actions are 34 px high and “Leave room” is 32 px high, below the 44 px touch baseline.
- At 390 × 844, “Open round 2” begins at y=984 despite the design promise that the next action stays above the fold.
- Unknown routes show the correct designed page but return HTTP 200 rather than 404.
- The `complete-case` claim test does not prove its 20-minute figure, and the `local-privacy` claim test does not exercise the accusation named in its claim.

The free game otherwise completed from landing to both win and loss screens, restart/settings/progress/demo isolation/offline reload worked, all nine declared claim commands passed after `npm ci`, the full suite passed (5 unit + 12 browser tests), the build passed, and the live artifacts exactly matched the candidate. Fresh Lighthouse scored 99/100/100/100 with LCP 1.3 s and CLS 0. The billing verify API enforced 30 successful requests per client; request 31 returned 429 with `Retry-After: 3`.

Full evidence and reproduction details: [`.factory/verification.md`](verification.md).

## What shipped

- A complete 4–8 player browser mystery from room creation through three timed rounds, group accusation, answer, and replay.
- Deterministic five-character codes that reproduce the case, player count, and private clue assignment on each device.
- Two original cases: the free Glasshouse Lantern and the paid Orchid Ledger. Each has 24 authored clues, four suspects, and one evidence-based solution.
- Host and player views, numbered private notebooks, pauseable three-minute round timers, optional sound, refresh recovery, keyboard controls, touch layouts, error states, and an offline state.
- A one-click `/demo` with isolated `demo:` storage, reset, and “Start for real.”
- The Sociobot one-time license flow: checkout link, return-token capture, daily verification cache, restore field, optimistic cached access, and quiet failure handling.
- `/privacy`, `/terms`, a styled not-found route and `404.html`, metadata, canonical and social tags, sitemap, robots, manifest, service worker, and Azure Static Web Apps security headers.
- A botanical field-guide visual system with generated original hero art, responsive WebP assets, hand-authored clue drawings, and recorded provenance.

## Static deployment decision

This work order deploys static files, so it cannot provide live cross-browser synchronization. The room code is the shared deterministic game packet instead. Friends enter the same code, choose distinct notebook numbers, and advance when the host speaks over their existing call. No room activity reaches a server. This preserves the requested remote personal views and human adjudication without pretending that the static product has realtime infrastructure.

## Verification

Run from a clean checkout:

```sh
npm ci
npm test
npm run build
```

Results on 2026-09-02:

- `npm test`: 5 deterministic unit tests and 12 Chromium tests passed.
- Claim checks passed for full completion, 4–8 notebooks, demo isolation, local privacy, offline reload, paid license, saved sound, restart, and mobile render rate.
- Axe via Playwright: 0 serious or critical findings on the landing page and the 390 × 844 game screen.
- Route/console smoke test: `/`, `/demo`, `/privacy`, `/terms`, and the not-found route loaded with one `h1`, one `main`, and no console errors.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100.
- Lighthouse metrics: FCP 0.9 s, LCP 1.7 s, CLS 0, Speed Index 0.9 s, initial transfer 123 KiB.
- Mobile game render sample: 60.0 fps across 90 animation frames at 390 × 844.
- Production bundles: JavaScript 11.4 KiB gzip; CSS 4.2 KiB gzip. Hero art: 50 KiB mobile and 133 KiB desktop.
- `npm audit`: 0 vulnerabilities.
- `npm run build`: passed and produced `dist/index.html`; total `dist/` size is 468 KiB.

The generated hero was visually inspected for text artifacts, anatomy, brands, seams, and unintended symbols. None were found. The visual thesis influenced the clipped paper panels, brass focus treatment, dark greenhouse desk, quiet system type, and reduced-motion paper-settle transition.

## Known gaps and next steps

- The factory must register the production billing product before the checkout URL can sell licenses. No product ID is hardcoded.
- Room progression is coordinated by voice, not synchronized over a backend. A future realtime edition would require a product-owned WebSocket service and a non-static deployment.
- The service worker caches an opened app after the first online visit. A brand-new device still needs one network visit.
- No infrastructure, DNS, billing account, or external service configuration was changed in this work order.
