# Independent verification — FAIL

- Candidate: `42657a5fb562a5927dd24eec9bdd12a646013373`
- Live URL: <https://room-code-mystery.sociobot.in>
- Verified: 2026-09-02 UTC
- Work order: `room-code-mystery-verify-1`
- Verdict: **FAIL — do not release this candidate**

The free game and one-click demo work end to end, and the live static files exactly match the candidate build. Release is nevertheless blocked by a broken production checkout and keyboard accessibility failures.

## Release-blocking findings

### High — the advertised paid case cannot be purchased

The landing page advertises “The Orchid Ledger” for a $6 one-time purchase. Its production checkout link is:

`https://api.sociobot.in/api/v1/products/room-code-mystery/checkout`

A fresh request returned HTTP 404 and:

```json
{"error":"enabled factory product","status":404}
```

The local paid-case claim passes only because its browser test stubs a valid license-verification response. It does not test the real checkout. A visitor therefore cannot complete the advertised purchase flow.

### High — the running timer repeatedly removes keyboard focus

On live `/demo`, focus was placed on “Pause timer.” After 1.25 seconds, the active element changed from that button to `<body>`. Pressing Space did not pause: the timer continued from 2:59 to 2:58 and the button still said “Pause timer.”

The page re-renders the game DOM each second while the timer runs. This prevents reliable keyboard-only traversal and operation of the active game, contrary to the accessibility contract and the README’s keyboard claim.

### Medium — focus indication fails the required contrast on paper

The global focus outline is brass `#d7b665`. Its calculated contrast is 1.67:1 against paper `#f3edda` and 1.87:1 against raised paper `#fffaf0`, below the required 3:1 focus-indicator contrast. Axe does not detect this state-specific contrast issue.

### Medium — important touch targets are below 44 px

At 390 × 844, “Reset demo” and “Start for real” are each 34 px high. “Leave room” is 32 px high. These controls fail the product’s 44 × 44 px touch-target baseline.

### Medium — the mobile next action is not above the fold

The visual thesis says the clue, timer, and next action remain above the fold at 390 px. On the live 390 × 844 game screen, “Open round 2” begins at y=984 and “Pause timer” begins at y=1053. Both require substantial scrolling.

### Low — the not-found route returns HTTP 200

`/not-a-real-page` renders the designed not-found screen and title, but the response status is 200. The site-structure contract requires a real 404 response.

### Medium — two declared claim tests do not prove their full claims

- `complete-case` claims a 20-minute case, but its test asserts three 3:00 rounds and the reveal; it never measures or otherwise proves 20 minutes.
- `local-privacy` names accusations, but its declared test stops after opening round three and never submits an accusation. Independent live request logging did cover the accusation and remained same-origin, but the claim’s own test does not.

All declared commands execute successfully after dependency installation; this finding concerns claim coverage, not command failure.

## Mandatory claims gate

The exact command from every `.factory/claims.json` entry was run after `npm ci` from the clean candidate. The first literal pre-install invocation could not start because `vitest` was not installed; installation from the committed lockfile completed cleanly, after which all nine exact commands passed.

| Claim | Result | Evidence |
| --- | --- | --- |
| `complete-case` | PASS | Correct accusation reached “Your group solved it” after all three 3:00 rounds. Coverage gap above. |
| `room-code` | PASS | Eight-player code created and notebook 8 opened. |
| `demo-sandbox` | PASS | Reset returned to round one without changing the real-namespace marker. |
| `local-privacy` | PASS | Declared two-round request check stayed same-origin. Independent full-flow check also stayed same-origin. Coverage gap above. |
| `offline-reload` | PASS | Dedicated context reloaded `/demo` offline after service-worker control. |
| `paid-case` | PASS (stubbed) | Stubbed valid verification opened the 24-clue second case; real checkout fails as above. |
| `settings-persist` | PASS | Sound remained enabled after reload. |
| `restart` | PASS | Finished case restarted at a new lobby with round 0 / `lobby` state. |
| `render-rate` | PASS | Local declared check passed; independent live sample measured 57.3 fps over 90 frames at 390 × 844. |

## First-read test

Result: **PASS**.

The untouched first screen says:

- What it is: “Solve a mystery with your friends,” labeled as a browser game.
- Who it is for: 4–8 friends on a video call seeking one 20-minute case.
- What to click first: “Try it with sample data,” with “Opens round one with six sample players” beside it.

The action is visible without scrolling on desktop and mobile and opens an active clue round in one click. The first capture shows the game and its room controls, not a menu wall.

Evidence:

- [`first-screen-desktop.png`](qa-evidence/first-screen-desktop.png)
- [`first-screen-mobile.png`](qa-evidence/first-screen-mobile.png)
- [`live-game-mobile.png`](qa-evidence/live-game-mobile.png)

## Clean checkout and build

- `npm ci`: passed; 59 packages installed; audit reported 0 vulnerabilities.
- `npm test`: passed; 5 unit tests and 12 Chromium tests.
- `npm run build`: passed, including TypeScript; produced `dist/`.
- No separate lint script exists.
- Production output: 468 KiB total.
- JavaScript: 30.92 KiB raw / 11.39 KiB gzip.
- CSS: 14.28 KiB raw / 4.19 KiB gzip.
- Mobile hero: 51,158 bytes; desktop hero: 136,168 bytes.

## Deployment identity

The deployed artifacts are byte-for-byte identical to the candidate’s fresh `dist/` output:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `32b335da18b3a327ba5a2a9b172a049dfff8735cbd5f7938579de7aad3e818c4` |
| `assets/index-DQdwLywO.js` | `e6955815c218b37418d151d1ce3f1f4b12ffc131df67cda3d3343d0c6466b696` |
| `assets/index-6iE3Mhbw.css` | `a81d69523713ec650a4a1f6b4f106d5a0346d411f2295ab48d81469257f6675b` |

Each live hash matched its local counterpart with `cmp` success.

## Independent game run

Result: **PASS for the free game loop**.

A fresh live run followed this deterministic sequence:

1. Landing: “Solve a mystery with your friends.”
2. One-click sample: “Notebook 1: Pressed leaflet.”
3. Round two: “Notebook 1: Tea receipt.”
4. Round three: “Notebook 1: Shoe comparison.”
5. Accusation: “Record one group accusation.”
6. Correct answer: “Your group solved it,” with Celia Finch and a three-round summary.

A separate wrong accusation produced “The evidence points elsewhere” and “Case learned,” establishing a real loss state. “Start a second case” reset to a lobby with round 0. Evidence: [`live-win-mobile.png`](qa-evidence/live-win-mobile.png) and [`live-mobile-loss.png`](qa-evidence/live-mobile-loss.png).

Additional behavior:

- Pausing held the timer at 2:59; resuming advanced it to 2:58.
- Reload during round two restored round two.
- Sound preference survived reload.
- Four-player creation produced 4 notebook choices; eight-player creation produced 8.
- An eight-player shared link opened as a player and supplied eight notebooks. Notebook 1 and notebook 8 received different clues.
- Four-character room input triggered native length recovery guidance.
- `OOOOO` produced “That code is not valid. Ask the host for all five characters and try again.” Replacing it with `C7K2M` recovered successfully.
- Invalid license input produced a clear inactive-license message while leaving the free case available.
- “Start for real” removed `demo:rcm:game` and returned home.

## Privacy, networking, and server behavior

- The entire live demo flow through accusation, reveal, restart, and reset made requests only to `https://room-code-mystery.sociobot.in`.
- Cold load requested only the document, same-origin JS/CSS, and same-origin hero image. No analytics, CDN fonts, trackers, or third-party scripts were observed.
- License verification sends the entered token only to the documented Sociobot API.
- Response headers include CSP, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and a camera/microphone/geolocation-denying `Permissions-Policy`.
- HTML uses `Cache-Control: public, must-revalidate, max-age=30`; hashed JS uses one-year immutable caching; art uses seven-day caching.
- Billing verification rate limit: 30 requests succeeded from one client; request 31 returned HTTP 429 with `Retry-After: 3` and `X-RateLimit-After: 3`.
- There is no product backend, account, or sign-in flow, so concurrency, server persistence, health identity, and Entra checks are not applicable.

## Accessibility, responsive behavior, and routes

- `/`, `/demo`, `/privacy`, `/terms`, and the styled missing-page route each have one `h1`, one `main`, `lang="en"`, route-specific titles, no missing image alt text, no horizontal overflow at 390 px, and no console/page errors.
- Playwright Axe found zero serious or critical issues on all five live routes; it found zero violations of any impact on those snapshots.
- The supplied `/opt/fleet/lib/verify-url.sh` passed: HTTP 200, title, language, main landmark, one h1, all images labeled, no unlabeled buttons, and no console errors. Evidence is under [`qa-evidence/verify-url`](qa-evidence/verify-url/verify.json).
- Route navigation and browser Back restored the correct route, title, and focused h1.
- The skip link becomes visible with a 3 px outline and moves sequential navigation to the main content.
- Reduced-motion emulation changed the paper animation to `0.00001s`, one iteration, with `scroll-behavior: auto`.
- No viewport overflow occurred at 390 × 844. The undersized targets and below-fold action remain defects.

## PWA/offline

- The service worker installed and controlled the page from `/sw.js`.
- An explicit update check completed with no waiting worker for this unchanged build.
- Cache `room-code-mystery-v1` existed.
- After an online load and controlled reload, an offline reload showed the demo banner, round one, and the offline notice.

## Performance

Fresh live mobile Lighthouse evidence is in [`lighthouse.json`](qa-evidence/lighthouse.json):

- Performance 99
- Accessibility 100
- Best Practices 100
- SEO 100
- FCP 1.0 s
- LCP 1.3 s
- CLS 0
- Total Blocking Time 150 ms
- Initial transfer 123 KiB

These meet the stated static budgets. Lab INP was not available; Total Blocking Time was used as the interaction proxy.

## Required remediation

1. Register/enable the production billing product and verify a real hosted checkout plus return-license flow.
2. Update the timer without replacing focused DOM, then add a keyboard-only timed-round regression test.
3. Use a ≥3:1 focus indicator against both dark and paper surfaces.
4. Make every game/demo action at least 44 × 44 px.
5. Honor the mobile design promise for the next-round action or revise that source-of-truth statement.
6. Return HTTP 404 for unknown routes.
7. Make each declared claim test assert every material part of its claim.
