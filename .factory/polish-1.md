# Polish round 1 finding map

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Added a product-owned Hono/WebSocket room service. Host phase, timer, rounds, and reveal synchronize; private notebook selection and accusation remain local. SQLite snapshots persist under `/data` with a six-hour TTL. | `@claim:room-code`; `.factory/qa-evidence/polish-1-live-flow.json`; `https://room-code-mystery-realtime.sociobot.in/health` |
| F-1-2 | Removed the paid promise and recorded the controller-authorized disabled state in `brief.json`. Both authored cases remain free until product checkout exists. | `@claim:additional-case`; `/setup`; `/terms` |
| F-1-3 | Replaced the single-page code check with two clean browser contexts that join the generated code, choose different notebooks, and complete synchronized play. | `@claim:room-code` |
| F-1-4 | The demo test now creates a real `rcm:game`, records its exact value, changes and resets the demo, leaves it, and compares the real value byte-for-byte. | `@claim:demo-sandbox` |
| F-1-5 | The demo privacy test now asserts code, seat, round, timer, and accusation in `demo:rcm:game`; it rejects request bodies and non-static methods. | `@claim:local-privacy` |
| F-1-6 | Narrowed and listed the absence promise. The test checks account controls, media capture, request destinations, and accusation request bodies through a real completed room. | `@claim:no-account-media` |
| F-1-7 | Replaced the broad cache sentence with the exact offline demo promise. | `@claim:offline-reload` |
| F-1-8 | Removed the unlisted room-progress sentence. The remaining sound persistence statement maps to one claim. | `@claim:settings-persist` |
| F-1-9 | Split the accessibility copy and added route semantics and reduced-motion coverage. | `@claim:route-metadata`; `@claim:reduced-motion`; live Axe evidence |
| F-1-10 | Kept the playable round first, added price/privacy/offline facts beside the CTA, then added how-it-works, storage, and availability sections below it. | `@claim:cold-root-game`; `.factory/qa-evidence/polish-1-live-root-mobile.png` |
| F-1-11 | Added per-route descriptions, canonicals, Open Graph titles/descriptions/URLs, Twitter titles/descriptions, and deep-link initialization. | `@claim:route-metadata` |
| F-1-12 | Rebuilt the HTTP 404 with “Page not found,” skip link, header/nav, footer, legal links, metadata, icons, and the botanical visual system. | `@claim:not-found-status`; live `/missing-page` returns 404 |
| F-1-13 | Added `/play` to `sitemap.xml` and the route crawl. | `@claim:link-crawl`; `/sitemap.xml` |
| F-1-14 | Replaced state-only sound text with “Turn sound on” and “Turn sound off.” | `@claim:settings-persist` |
| F-1-15 | Rewrote the long README accessibility sentence as four short statements. | `.factory/copy-audit.md` |
| F-1-16 | Removed “deterministically”; room instructions now say friends join the same case and round. | README “How room codes work”; `@claim:room-code` |
| F-1-17 | Replaced deployment jargon with a plain description of deep links, security rules, and file types. | README “Deployment” |
| F-1-18 | Standardized on “demo” for the mode and “sample data” for its contents. | README “Try the demo”; `.factory/demo.md`; UI banner |
| F-1-19 | Regenerated the copy audit with the correct six-word headline count, root sentences, actions, README sentences, and terminology table. | `.factory/copy-audit.md` |

## Release evidence

- Clean-clone full suite: 5 unit tests and 22 Chromium tests passed.
- Claim manifest: all 19 exact commands passed from `/tmp/rcm-clean-HdOn9m`; every id has exactly one matching `@claim:<id>` test.
- Production build: 36.82 KB JavaScript and 17.13 KB CSS raw; 12.91 KB and 4.75 KB gzip.
- Live two-browser run: room creation through shared reveal, zero console errors; `.factory/qa-evidence/polish-1-live-flow.json`.
- Live accessibility: zero serious or critical Axe findings on six routes at desktop and mobile; `.factory/qa-evidence/polish-1-live-a11y.json`.
- Lighthouse: performance 99, accessibility 100, best practices 100, SEO 100; LCP 2.0 s, CLS 0; `.factory/qa-evidence/polish-1-lighthouse.json`.
- Live offline reload: HTTP 200 with the demo banner, round one, and offline notice; `.factory/qa-evidence/polish-1-live-offline.json`.
- URL verifier: HTTP 200, title, `lang`, one h1, main landmark, alt text, labelled buttons, and zero console errors; `.factory/qa-evidence/polish-1-verify/verify.json`.
- Live URLs: `https://room-code-mystery.sociobot.in/`, `/demo`, `/setup`, `/play`, `/privacy`, `/terms`, `/missing-page`, and `https://room-code-mystery-realtime.sociobot.in/health`.
