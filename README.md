# Room Code Mystery

Solve a three-round browser mystery with 4–8 friends and one synchronized room code. Each player reads a different private clue before the host records one accusation.

The Glasshouse Lantern and The Orchid Ledger are free. Paid cases remain unavailable until product checkout exists. Playing needs no account, voice, video, or automated judgment.

Live site: <https://room-code-mystery.sociobot.in>

## Try the demo

Open `/demo` to load room `C7K2M`, six notebooks, and round one. The banner resets the demo or returns to a real room.

Demo state uses `demo:rcm:game`. Real browser state uses `rcm:game`. Leaving the demo removes only its sample state. See [`.factory/demo.md`](.factory/demo.md).

## Run locally

Use Node.js 20 or newer.

```sh
npm install
npm run realtime
```

In another terminal:

```sh
npm run dev
```

Open `/demo` for local sample data. Open `/setup` to test synchronized rooms.

## Test and build

```sh
npm test
npm run build
```

Tests cover the deterministic core, complete game, two-browser synchronization, demo isolation, offline reload, metadata, mobile actions, and accessibility. Every product claim has one tagged browser test in [`.factory/claims.json`](.factory/claims.json).

The production build writes the static site to `dist/`. Initial JavaScript remains below the 200 KB budget.

## How room codes work

The host creates a five-character code. Friends enter it to join the same case and round. The host controls the timer, advances rounds, and opens the reveal for everyone.

Private notebook numbers and accusations stay in each browser. Shared case, round, and timer state use product-owned SQLite storage. A room expires six hours after the last host action.

The demo reloads offline after its first visit. The sound choice persists on the device.

## Deployment

The main game remains a static Vite site. Its product-owned realtime companion runs from `Dockerfile.realtime` with `deploy.data_dir=/data`.

Build the site with:

```sh
VITE_REALTIME_URL=https://<product-room-service> npm run build
```

Publish `dist/` as the static site root. The config keeps deep links working, adds browser security rules, and serves each file with the correct type.

## Privacy and accessibility

The game has no accounts, public matchmaking, analytics, media capture, or automated judging. Demo actions make static requests only. Real rooms send only shared play state to the product server.

Keyboard focus stays visible, and timer updates do not move it. Actions are at least 44 pixels at 390 pixels wide. Each route has one main heading and one main content area. Reduced motion is supported.

Read the complete [privacy notice](https://room-code-mystery.sociobot.in/privacy) and [terms](https://room-code-mystery.sociobot.in/terms).

## Project notes

- [Visual thesis and asset provenance](.factory/design.md)
- [Demo contract](.factory/demo.md)
- [Claims and tests](.factory/claims.json)
- [Copy audit](.factory/copy-audit.md)
- [Repair mapping](.factory/polish-1.md)
- [Build handoff](.factory/handoff.md)

Original generated art is disclosed in the footer and documented in the visual thesis. Source code is MIT licensed.
