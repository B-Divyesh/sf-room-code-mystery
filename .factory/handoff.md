# Polish round 1 handoff

## Outcome

All F-1-1 through F-1-19 are resolved. Room Code Mystery remains a static Vite browser game with a product-owned realtime companion. Real rooms now synchronize host-controlled rounds, timer state, and the reveal across browsers. The service keeps ephemeral room state as a SQLite database image under `/data`; private notebook choices and accusations stay in each browser.

The unprovisioned paid-case promise is disabled in the source brief and public copy. Both authored cases are free until a product-scoped Sociobot checkout exists.

## Deployment

- Static app: `sf-room-code-mystery` at <https://room-code-mystery.sociobot.in/>
- Realtime app: `sf-room-code-mystery-realtime` at <https://room-code-mystery-realtime.sociobot.in/>
- Durable data: `/data/rooms-v4.sqlite` on the fleet-created `sf-room-code-mystery-rea-c03e36` share
- Realtime health: <https://room-code-mystery-realtime.sociobot.in/health>
- Main artifact remains `browser-game`; Vite outputs `dist/`.

## Verification

Run locally:

```sh
npm ci
npm test
npm run build
npm audit --audit-level=high
```

Verified on 2026-09-02:

- 5 Vitest unit tests passed.
- 22 Playwright browser tests passed, including all 19 claim tests.
- A two-context room completed from creation through three synchronized rounds and shared reveal.
- The demo reset preserved the exact real `rcm:game` value and `/?demo=1` opened isolated sample data.
- Offline demo reload passed in its own browser context.
- Production build: JavaScript 36.82 KB raw / 12.91 KB gzip; CSS 17.13 KB raw / 4.75 KB gzip.
- Live Lighthouse: performance 100, accessibility 100, best practices 100, SEO 100; LCP 1.7 s and CLS 0.
- Live Axe: zero serious or critical violations on `/`, `/demo`, `/setup`, `/privacy`, `/terms`, and the 404 at 1440×900 and 390×844.
- Fleet URL verification passed with no console errors, one h1, one main landmark, language, title, image alt text, and labelled buttons.
- Dependency audit found zero vulnerabilities.

Evidence is in `.factory/qa-evidence/polish-1-*`. The full finding map is in `.factory/polish-1.md`.

## Known gaps

None for this work order. Paid cases are intentionally unavailable and make no purchase promise. Adding them later requires a registered Sociobot billing product and a tested license return flow.
