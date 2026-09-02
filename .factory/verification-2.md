# Independent verification 2 — FAIL

## Scope and result

- Candidate commit: `980bbb1d8d6cef2e1a63cd0bfa262b336bf43828`
- Tested URL: <https://room-code-mystery.sociobot.in>
- Verification date: 2026-09-02
- Result: **FAIL**

This was a clean-checkout, independent verification. Product source was not
changed. The live HTML, JavaScript, and CSS match the local build exactly, so
the findings apply to the nominated commit and deployment.

## Release-blocking defects

### P1 — the mandatory first game capture is a menu wall, not gameplay

Cold-loading `/` shows a marketing hero and the **Start your room** create/join
form. It does not show a clue, round, timer, accusation, or other active game
screen. The first visible control is room setup. This violates the browser-game
acceptance requirement that the captured first screen show the game itself,
rather than a menu wall.

The separate first-read requirement passes: the same cold screen plainly says
what it does (solve a mystery with friends), who it is for (4–8 friends on a
video call), and offers the one-click **Try it with sample data** action. That
does not cure the game-capture requirement.

### P1 — the researched paid-case offer is unavailable

The researched brief requires a one-time host purchase for additional
handcrafted cases. The live additional-case section instead says **The Orchid
Ledger is not for sale** and **New checkout is unavailable**. There is no
checkout link in the live DOM. Existing-license restoration works only when a
previous token is supplied; it is not a way for a new host to buy the required
additional case.

### P1 — the required footer link is unusable

Every page renders **Built by Param Factory ↗** to
`https://www.sociobot.in/`. A cold Playwright request and `curl -I` both fail
TLS validation: the presented certificate has no subject alternative name for
`www.sociobot.in`. Thus this is a dead link, contrary to the site-link
contract. Product-owned pages and routes returned their expected status codes.

## Claim manifest gate — PASS

`.factory/claims.json` exists and contains 13 claims. From the clean checkout,
each exact command in its `test` field was run via the shipped Playwright demo
entry point. Every command passed. The final full browser run also recorded
`{"status":"passed","failedTests":[]}` in `test-results/.last-run.json`.

| Claim | Result |
| --- | --- |
| `complete-case` | PASS |
| `room-code` | PASS |
| `demo-sandbox` | PASS |
| `local-privacy` | PASS |
| `offline-reload` | PASS |
| `paid-case` | PASS (truthfully tests unavailable checkout and existing-license restoration) |
| `settings-persist` | PASS |
| `restart` | PASS |
| `render-rate` | PASS |
| `timer-focus` | PASS |
| `focus-contrast` | PASS |
| `mobile-actions` | PASS |
| `not-found-status` | PASS |

## Clean local verification — PASS

- `npm ci`: completed; 59 packages installed; audit reported zero
  vulnerabilities.
- `npm run typecheck`: passed.
- `npm test`: 5 Vitest core tests and 16 Chromium tests passed.
- `npm run build`: passed and produced `dist/`.
- Initial JavaScript is 31.32 kB raw / 11.45 kB gzip. CSS is 14.92 kB raw /
  4.33 kB gzip, both inside the static-product budgets.
- There is no separate lint script in `package.json`.

## Live browser verification — PASS except defects above

### Scripted game run

On the live `/demo` entry point, a clean context started on **Notebook 1:
Pressed leaflet**, room `C7K2M`, round 1 of 3 at `3:00`. Advancing the three
rounds, selecting Celia Finch, and locking the accusation reached **Your group
solved it** with “Three rounds completed”, six player notebooks, and “Correct
accusation”. A separate run selecting Mira Vale reached **The evidence points
elsewhere** with “Case learned”, confirming the incorrect-answer condition.

**Start a second case** returned to **Choose your private notebook** with no
active round and an **Open round one** action. Sound was enabled, the page
reloaded, and the **Sound on** setting remained. Focusing **Pause timer** then
pressing Space changed it to **Resume timer**, retained focus, and kept the
timer at `3:00` after 1.1 seconds. Invalid `OOOOO` room input produced the
announced recovery text: “That code is not valid. Ask the host for all five
characters and try again.”

### Mobile, motion, and performance

At 390 × 844, all visible active-game controls measured at least 44 px in both
dimensions; **Open round 2** measured 330 × 48.8 px and ended at y=417.2,
above the fold. There was no horizontal overflow. With reduced motion emulated,
the matching CSS applies a 0.01 ms animation/transition duration. A 90-frame
live `requestAnimationFrame` sample measured **60.01 fps**, exceeding the
advertised 55 fps threshold.

### Privacy, offline, accessibility, and headers

- During the complete normal demo flow through reveal, Playwright observed only
  `https://room-code-mystery.sociobot.in` requests and no page or console
  errors. The optional existing-license check was not invoked; it is explicitly
  disclosed as a Sociobot billing API request.
- After service-worker activation, live `/demo` reloaded offline with the demo
  banner and round one. The active service worker was `/sw.js` and the cache
  was `room-code-mystery-v2`.
- Playwright Axe found zero serious or critical findings on `/`, `/demo`,
  `/privacy`, `/terms`, and `/missing-page`. Each route had one `<h1>` and one
  `<main>`; titles were route-specific.
- `/`, `/demo`, `/privacy`, and `/terms` returned 200; `/missing-page`
  returned the designed 404 page with HTTP 404. The app is static and exposes
  no product-owned server endpoint, so a product API rate-limit allowance is
  not applicable. There is no sign-in flow.
- HTML uses a 30-second revalidation cache. Hashed JS and CSS use
  `public, max-age=31536000, immutable`. Responses include CSP, HSTS,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and a restrictive
  `Permissions-Policy`.

## Deployment identity

| File | Local SHA-256 | Live SHA-256 |
| --- | --- | --- |
| `index.html` | `18d3846d736013298312a849910f168622f370642e42e50faebcdd107a755d7f` | `18d3846d736013298312a849910f168622f370642e42e50faebcdd107a755d7f` |
| `assets/index-CY-1KO9r.js` | `4affe5617f3b8856a3da320ac436d9a4af9033034e2accfce24da2d46feda42f` | `4affe5617f3b8856a3da320ac436d9a4af9033034e2accfce24da2d46feda42f` |
| `assets/index-DYZrVIpE.css` | `e12c172cb6031a1d4a712b9afd6c41f1a16c8f72d61648178fae19b343c45b54` | `e12c172cb6031a1d4a712b9afd6c41f1a16c8f72d61648178fae19b343c45b54` |

## Required follow-up

1. Make the factory/capture route open an active game screen rather than room
   setup, while preserving the clear landing and one-click demo requirements.
2. Enable and test the Sociobot checkout for the additional handcrafted case,
   or obtain an approved brief change that removes the paid-case promise.
3. Replace or repair the TLS-invalid `https://www.sociobot.in/` footer target,
   then crawl all links again.
