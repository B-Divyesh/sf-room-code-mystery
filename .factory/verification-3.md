# Independent verification 3 — PASS

**Candidate:** `037a9efca48b84dc032bb096e234c5788ac04d5f` (`docs: record repair claim commands`)  
**Verified URL:** <https://room-code-mystery.sociobot.in/>  
**Date:** 2026-09-02  
**Verdict:** **PASS** — no release-blocking defects found.

## Cold first read

In a fresh desktop browser context, the first viewport was already an active
sample round, not a menu wall. It said: “Solve a mystery with your friends,”
then “Compare private clues on a call and make one group accusation.” This
plainly explains that the game is for friends playing together remotely and
what they do. The first action is **“Try it with sample data”**, immediately
explained by “Round one is ready below”; the same first viewport visibly
contained room `C7K2M`, round 1 of 3, a 3:00 timer, a private notebook clue,
and the next-round action. Therefore the first-read and captured-game
requirements pass.

## Clean-clone checks

Ran after `npm ci` (59 packages installed; 0 audit vulnerabilities):

- `npm run typecheck` — passed.
- `npm test` — passed: 5 Vitest unit tests and all 18 Playwright tests.
- `npm run build` — passed and produced `dist/`.
- All 15 declared claims were run from the demo entry path with
  `npm test -- --grep @claim:`; Playwright recorded `status: passed`, with no
  failed tests. The first three listed commands were additionally run
  separately (`complete-case`, `room-code`, and `demo-sandbox`).
- Built initial JS: 29,933 bytes raw / 10,848 bytes gzip. CSS: 15,570 bytes
  raw / 4,459 bytes gzip. Both are within the applicable budgets.

All declared claims passed: `complete-case`, `room-code`, `demo-sandbox`,
`local-privacy`, `offline-reload`, `additional-case`, `settings-persist`,
`restart`, `render-rate`, `timer-focus`, `focus-contrast`, `mobile-actions`,
`not-found-status`, `cold-root-game`, and `link-crawl`.

## Independent live-product exercise

- Created a four-player Orchid Ledger room in one browser context, entered its
  shared code (`FDZYP` in this run) in a second context, selected notebook 4,
  and opened its distinct “Camera strap” clue. This exercised the host/share/
  private-notebook path.
- Created an eight-player room (`ENVSH` in this run), opened notebook 8, and
  completed all three rounds. Correctly accusing Celia Finch reached **“Your
  group solved it.”** Selecting Mira Vale in a separate run reached the real
  alternate end screen **“The evidence points elsewhere.”**
- **Start a second case** returned to the reset notebook lobby with round one
  available. Sound setting persisted after a live reload
  (`rcm:settings` became `{"sound":true}`).
- At 390×844, the live requestAnimationFrame measurement was **60.00 FPS**
  over the claim’s 90-frame sampling method (requirement: at least 55 FPS).
  Game actions remained in the viewport and no horizontal overflow occurred.
- Keyboard-only timer operation passed: focus stayed on Pause while the timer
  changed; Space paused it and the time then remained stable. Reduced-motion
  media mode was active and transitions were reduced to 0.00001 s with no
  running animation. Invalid code `OOOOO` displayed the recovery alert:
  “Ask the host for all five characters and try again.”
- The live service worker activated `room-code-mystery-v3`; after control and
  reload, an offline reload returned HTTP 200 and showed round 1.

## Privacy, deployment, accessibility, and headers

- A cold live load requested only the same-origin HTML, JS, CSS, and original
  WebP art. A full host/create/play/reveal/restart flow likewise made requests
  only to `https://room-code-mystery.sociobot.in`; there were no analytics,
  third-party fonts, billing, or API calls. The product is static, with no
  server endpoint or documented request allowance to rate-limit.
- Live `verify-url.sh` passed: title, `lang=en`, one `h1`, `main`, image alt,
  labelled buttons, and zero console/page errors. Evidence is in
  `qa-evidence/verification-3-live/`.
- Fresh live axe scans at desktop root and 390 px `/demo`, `/setup`,
  `/privacy`, `/terms`, and `/missing-page` found **zero serious or critical
  violations**. Each had exactly one h1 and one main landmark; mobile had no
  horizontal overflow. The missing route returned HTTP 404 with its designed
  recovery page.
- The deployment sends CSP with self-only scripts/styles/connections and
  `frame-ancestors 'none'`, HSTS, `nosniff`, strict-origin referrer policy,
  and disabled camera/microphone/geolocation. HTML and service worker use a
  short revalidation cache; hashed JS/CSS are one-year immutable; art is
  cached for seven days.
- Candidate identity is confirmed: local production `index.html`, JS, and CSS
  SHA-256 values exactly equal the live responses:

  | File | SHA-256 |
  | --- | --- |
  | `index.html` | `6641c676d820b10693c4caa0fead1581b556a2ea4fc10fee1850aa5284189b3a` |
  | `assets/index-Bts43FZw.js` | `cc3c93eedca5fd1e964a562b86d5955d64bf7f8247ee081a0f29ea91d94ab74f` |
  | `assets/index-D12PlBB6.css` | `53a70220e75f6afb9d510f4178ee04f6bba0b35c59859dbbe68296e89f41ffd3` |

## Defects

None found.

