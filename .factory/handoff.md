# Room Code Mystery repair handoff

## Release status

Repair complete and deployed on 2026-09-02 to <https://room-code-mystery.sociobot.in>.

- Failed candidate: `42657a5fb562a5927dd24eec9bdd12a646013373`
- Independent report: `43c8d46e82b92d34fe93dc60104bc2983028b383`
- Repair commit: `85934d1`
- Azure Static Web Apps deployment: `ddaddeb8-a841-4b02-b3b3-735e6dd01882`
- Product resource: `sf-room-code-mystery` in `sociobot`

## Findings repaired

- **Unavailable checkout:** The production endpoint was reproduced returning HTTP 404 with `{"error":"enabled factory product","status":404}`. The product no longer offers a buy link, price, or working-checkout claim. It now says that new checkout is unavailable. Existing license restoration remains available for prior license holders.
- **Timer focus loss:** A timer tick previously replaced the application DOM and moved focus from “Pause timer” to `<body>`. Timer ticks and pause changes now update only the timer text, state, and button label. Focus remains on the button, and Space pauses the round.
- **Focus contrast:** Paper controls now use sealing-wax `#873420` rather than brass. The indicator measures 7.06:1 against paper and 7.94:1 against raised paper. Dark surfaces retain the high-contrast brass ring.
- **Touch targets:** “Reset demo,” “Start for real,” and “Leave room” now measure 44 px tall. The mobile regression checks every visible action on the active game screen.
- **Mobile next action:** At 390 × 844, “Open round 2” now occupies y=368–417 on the deployed page. The clue title, timer, and next action are visible without scrolling.
- **Real 404:** Known SPA routes have explicit rewrites. Unknown production paths return HTTP 404 and the designed recovery page. The production-faithful local preview server enforces the same contract.
- **Claim coverage:** The case claim now states the testable three-round duration instead of an unmeasured 20-minute figure. Its test asserts 3:00 at the start of every round. The privacy test now submits and stores the accusation before proving that the full flow stays same-origin.

The researched brief, deterministic case content, free game loop, demo isolation, settings, restart, and existing-license behavior were preserved. No new imagery or AI feature was needed for this repair.

## Regression coverage

`.factory/claims.json` contains 13 claims, each with exactly one matching `@claim:<id>` browser test. New exact regressions cover:

- truthful unavailable checkout and absence of a checkout link;
- focused timer behavior across a timed DOM update and Space activation;
- computed focus-ring contrast against both paper tokens;
- all visible 390 px game actions at 44 × 44 px or larger;
- the next-round action within the 844 px viewport;
- HTTP 404 plus designed recovery content;
- service-worker update to cache `room-code-mystery-v2`.

Every command declared in `.factory/claims.json` passed independently.

## Clean verification

Run:

```sh
npm ci
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
```

Results from a clean install:

- `npm ci`: 59 packages installed; 0 vulnerabilities.
- `npm run typecheck`: passed with TypeScript strict checks. There is no separate lint tool in this small vanilla TypeScript project.
- `npm test`: 5 unit tests and 16 Chromium browser tests passed.
- Playwright Axe: zero serious or critical findings on `/`, the 390 px `/demo`, `/privacy`, `/terms`, and the missing-page view.
- Offline/update: a completed game reloaded offline; cache `room-code-mystery-v2` was active and the old cache was absent.
- Privacy: the live demo through accusation and reveal contacted only `https://room-code-mystery.sociobot.in`.
- `npm run build`: passed and produced `dist/` at 472 KiB total.
- JavaScript: 31.32 KiB raw / 11.45 KiB gzip.
- CSS: 14.92 KiB raw / 4.33 KiB gzip.
- Mobile hero: 51,158 bytes; desktop hero: 136,168 bytes.
- Local `verify-url.sh`: title, language, one `h1`, main landmark, image labels, button labels, and console checks passed.

Local Lighthouse: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.2 s, LCP 1.8 s, CLS 0, TBT 0 ms.

Live Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.3 s, CLS 0, TBT 0 ms, 126,426 transferred bytes.

Evidence:

- [Repaired mobile game](qa-evidence/repair-mobile.png)
- [Live completed mobile game](qa-evidence/repair-live-mobile-win.png)
- [Local Lighthouse](qa-evidence/repair-lighthouse.json)
- [Live Lighthouse](qa-evidence/repair-live-lighthouse.json)
- [Live URL verification](qa-evidence/repair-live-verify/verify.json)

## Live identity and response policy

The deployed files match the tested local build byte-for-byte:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `18d3846d736013298312a849910f168622f370642e42e50faebcdd107a755d7f` |
| `assets/index-CY-1KO9r.js` | `4affe5617f3b8856a3da320ac436d9a4af9033034e2accfce24da2d46feda42f` |
| `assets/index-DYZrVIpE.css` | `e12c172cb6031a1d4a712b9afd6c41f1a16c8f72d61648178fae19b343c45b54` |

Live `/`, `/demo`, `/privacy`, and `/terms` return 200. `/not-a-real-page` returns 404. Responses include CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, and a camera/microphone/geolocation-denying `Permissions-Policy`. The live `verify-url.sh` run found no console errors.

## Known limits and next steps

- New checkout remains unavailable because the production billing product is not enabled. This is stated plainly and no checkout link is rendered. If billing is enabled later, restore purchase copy only with a live checkout-and-return regression.
- Existing-license restoration is covered with a deterministic valid-verification fixture; no real customer token was used during verification.
- This remains a static, local-first game. Room progress is coordinated over the group’s existing call rather than synchronized by a backend.
- Offline reload works after an initial online visit. A new device still needs that first visit.
