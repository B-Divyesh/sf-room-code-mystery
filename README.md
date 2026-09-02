# Room Code Mystery

Solve a three-round browser mystery with 4–8 friends and one shared room code. A game is designed for one 20-minute video call. Each player opens a different private notebook, reads one clue per round, and helps the host make one accusation.

The Glasshouse Lantern is fully playable for free. A $6 one-time host license adds The Orchid Ledger, a second handcrafted case with 24 new clues. The game has no accounts, public matchmaking, voice, video, or automated judgments.

Live site: <https://room-code-mystery.sociobot.in>

## Try the sample room

Open `/demo` or <https://room-code-mystery.sociobot.in/demo>. It starts round one with room `C7K2M`, six player notebooks, and the free case. The banner can reset the sample or leave for a real room.

Demo state uses `demo:rcm:game`. Real state uses `rcm:game`. Resetting or leaving the demo removes only its sample state. See [`.factory/demo.md`](.factory/demo.md) for the verifier flow.

## Run locally

Requirements: Node.js 20 or newer and npm.

```sh
npm install
npm run dev
```

Vite prints the local URL. Open `/demo` for the seeded game.

## Test and build

```sh
npm test
npm run build
```

`npm test` runs deterministic core tests and Chromium browser tests. Claim tests use the tags recorded in [`.factory/claims.json`](.factory/claims.json). The production build writes `index.html` and all static assets to `dist/`.

An opened room reloads offline after its first visit. The service worker caches the app shell and visited assets. Room progress and the sound choice persist in browser local storage.

## How room codes work

The five-character room code deterministically identifies the case, player count, and clue arrangement. It does not connect browsers. Friends stay together on their existing call, advance when the host says so, and read their private clues aloud. This matches the static deployment without sending room activity to a server.

The host’s purchase is verified through the Sociobot billing API. Participants can open a paid case with the host’s code. No product ID or payment provider is embedded in this repository.

## Deployment

The deployment type is static. Use this exact command:

```sh
npm ci && npm run build
```

Publish `dist/` as the site root. `staticwebapp.config.json` supplies SPA fallback, security headers, and cache-safe content types. The factory owns DNS and infrastructure.

## Privacy and accessibility

Room codes, notebook choices, timers, and accusations stay on the device. License verification sends only the pasted license token to the Sociobot billing API. `/privacy` and `/terms` contain the complete product text.

The interface includes keyboard focus, 44 px touch targets, one heading and main landmark per route, reduced motion, mobile layouts, and explicit timer controls. Tests cover the full game, offline reload, local privacy, mobile overflow, and serious accessibility findings.

## Project notes

- [Visual thesis and asset provenance](.factory/design.md)
- [Demo contract](.factory/demo.md)
- [Claims and their tests](.factory/claims.json)
- [Copy audit](.factory/copy-audit.md)
- [Build handoff](.factory/handoff.md)

Original generated art is disclosed in the site footer and documented in the visual thesis. Source code is MIT licensed; see [`LICENSE`](LICENSE).
