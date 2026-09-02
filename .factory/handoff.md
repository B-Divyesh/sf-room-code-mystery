# Room Code Mystery repair handoff

## Release repair

This repair addresses the independent verification failure for candidate
`980bbb1d8d6cef2e1a63cd0bfa262b336bf43828`.

- The cold root (`/`) now opens an active, playable sample round. Its first
  viewport has a live timer, round state, clue notebook, and an `Open round 2`
  action. Private create/join setup moved to `/setup`.
- The Orchid Ledger is now selectable as a second **free** handcrafted case.
  There is no checkout, payment, license restore, or external billing request.
  This is the safe controller-authorized availability change while the shared
  billing product remains unavailable; no billing resource was touched.
- The footer now links to `https://hello-factory.sociobot.in/`, which returned
  HTTP 200. The prior `https://www.sociobot.in/` target was reproduced first:
  `curl -I` failed with `SSL: no alternative certificate subject name matches`.
- The static route list, sitemap, preview server, and service-worker precache
  include `/setup`; service-worker cache version is `room-code-mystery-v3`.

## Regression coverage

`.factory/claims.json` now has 15 observable claims. New coverage verifies:

- `@claim:cold-root-game`: fresh `/` has active round content rather than
  `.room-desk`, then advances from round one to round two.
- `@claim:additional-case`: both free cases can be selected and The Orchid
  Ledger opens without any checkout link.
- `@claim:link-crawl`: crawls every product link across `/`, `/demo`,
  `/setup`, `/privacy`, and `/terms`, including the Hello Factory destination.

The existing deterministic game, timer-focus, focus-contrast, 390 px target,
offline reload, local privacy, and 404 regressions remain in place.

## Verification

From a clean dependency install (`npm ci`, 59 packages, 0 audit findings):

- `npm run typecheck`: passed.
- `npm run test:unit`: 5 passed.
- The 18 Playwright tests passed serially in three bounded runs: 7 core/demo
  flows, 6 timer/mobile/settings flows, and 5 root/link/accessibility/route
  flows. This is the same suite run by `npm test`; the bounded runs avoid the
  worker execution time limit in this repair environment.
- Playwright Axe: zero serious/critical findings on `/`, `/setup`, `/demo`,
  `/privacy`, `/terms`, and the 404 route.
- `npm run build`: passed and produced `dist/`. Initial JS is 29.93 kB raw /
  10.87 kB gzip; CSS is 15.57 kB raw / 4.44 kB gzip.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/` passed: title, `lang`,
  one `h1`, `main`, image labels, button labels, and no console errors.
- `npx @axe-core/cli` could not locate a system Chrome binary in this worker;
  the project-owned `@axe-core/playwright` run passed instead.
- Mobile and desktop root evidence:
  [`repair-root-active-mobile.png`](qa-evidence/repair-root-active-mobile.png),
  [`repair-root-active-desktop.png`](qa-evidence/repair-root-active-desktop.png),
  and [`repair-root-verify/verify.json`](qa-evidence/repair-root-verify/verify.json).
  The original reproduced setup-wall capture is
  [`baseline-root-menu-wall.png`](qa-evidence/baseline-root-menu-wall.png).

## Deployment and live identity

Deployed from `dist/` to the product-owned `sf-room-code-mystery` Static Web
App in resource group `sociobot` after pushing `21f41c8`. The live root now
matches the verified build byte-for-byte:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `6641c676d820b10693c4caa0fead1581b556a2ea4fc10fee1850aa5284189b3a` |
| `assets/index-Bts43FZw.js` | `cc3c93eedca5fd1e964a562b86d5955d64bf7f8247ee081a0f29ea91d94ab74f` |
| `assets/index-D12PlBB6.css` | `53a70220e75f6afb9d510f4178ee04f6bba0b35c59859dbbe68296e89f41ffd3` |

Live `/`, `/demo`, `/setup`, `/privacy`, and `/terms` return 200; the missing
route returns the designed 404. Live `verify-url.sh` passed with no browser
console errors; its evidence is
[`repair-live-root-verify/verify.json`](qa-evidence/repair-live-root-verify/verify.json).
The product remains static and local-first: no accounts, analytics, backend,
or shared billing access was added.
