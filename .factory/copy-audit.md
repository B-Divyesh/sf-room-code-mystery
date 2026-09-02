# Copy audit

Audited on 2026-09-02 against the shipped root and README. A word is a whitespace-separated token; hyphenated terms, paths, and codes count once. No sentence exceeds 22 words and no banned marketing word appears.

## Cold root

| Sentence or heading | Words | Result |
| --- | ---: | --- |
| Solve a mystery with your friends | 6 | Pass; verb-first headline under 9 words |
| Compare private clues on a call and make one group accusation. | 11 | Pass |
| Round one opens with one click. | 6 | Pass |
| A fresh fern leaflet lies inside the empty display. | 9 | Pass |
| Its underside carries a thin stripe of cobalt chalk. | 9 | Pass |
| Read both lines aloud. | 4 | Pass |
| Then compare what each notebook shows. | 6 | Pass |
| Each friend chooses a private notebook. | 6 | Pass |
| The host opens each round for everyone. | 7 | Pass |
| The answer appears on every joined screen. | 7 | Pass |
| The demo stays on your device. | 6 | Pass |
| Real rooms send only the case, timer, and round to our room server. | 13 | Pass |
| Private clues and accusations stay in your browser. | 8 | Pass |
| Server room state expires after six hours. | 7 | Pass |
| The Glasshouse Lantern and The Orchid Ledger need no checkout or license. | 12 | Pass |
| Three evidence rounds for 4–8 friends. | 6 | Pass |

First-screen facts are “Price: two free cases,” “Privacy: private clues stay local,” and “Offline: demo reloads after one visit.” The primary action is “Try it with sample data.” Other action labels are “Start a synchronized room,” “Turn sound on,” “Pause timer,” “Open round 2,” “Reset demo,” “Start for real,” and “Leave room.” Each action names its result.

## Setup, privacy, and terms

All prose was checked. The longest sentence has 17 words: “Real rooms send their code, case, player count, round, and timer to our product server.” Error text states what failed and asks the player to retry. The 404 heading is “Page not found.”

## README sentence counts

| Count | Sentence |
| ---: | --- |
| 14 | Solve a three-round browser mystery with 4–8 friends and one synchronized room code. |
| 13 | Each player reads a different private clue before the host records one accusation. |
| 9 | The Glasshouse Lantern and The Orchid Ledger are free. |
| 8 | Paid cases remain unavailable until product checkout exists. |
| 9 | Playing needs no account, voice, video, or automated judgment. |
| 11 | The banner resets the demo or returns to a real room. |
| 4 | Demo state uses `demo:rcm:game`. |
| 5 | Real browser state uses `rcm:game`. |
| 8 | Leaving the demo removes only its sample state. |
| 5 | Use Node.js 20 or newer. |
| 6 | Open `/setup` to test synchronized rooms. |
| 18 | Tests cover the deterministic core, complete game, two-browser synchronization, demo isolation, offline reload, metadata, mobile actions, and accessibility. |
| 11 | Every product claim has one tagged browser test in `.factory/claims.json`. |
| 9 | The production build writes the static site to `dist/`. |
| 6 | The host creates a five-character code. |
| 10 | Friends enter it to join the same case and round. |
| 13 | The host controls the timer, advances rounds, and opens the reveal for everyone. |
| 9 | Private notebook numbers and accusations stay in each browser. |
| 10 | Shared case, round, and timer state use product-owned SQLite storage. |
| 10 | A room expires six hours after the last host action. |
| 8 | The demo reloads offline after its first visit. |
| 7 | The sound choice persists on the device. |
| 8 | The main game remains a static Vite site. |
| 11 | Its product-owned realtime companion runs from `Dockerfile.realtime` with `deploy.data_dir=/data`. |
| 18 | The config keeps deep links working, adds browser security rules, and serves each file with the correct type. |
| 13 | The game has no accounts, public matchmaking, analytics, media capture, or automated judging. |
| 6 | Demo actions make static requests only. |
| 11 | Real rooms send only shared play state to the product server. |
| 11 | Keyboard focus stays visible, and timer updates do not move it. |
| 10 | Actions are at least 44 pixels at 390 pixels wide. |
| 11 | Each route has one main heading and one main content area. |
| 4 | Reduced motion is supported. |
| 5 | Source code is MIT licensed. |

## Terminology

| Concept | Required term |
| --- | --- |
| Try-out mode | demo |
| Seeded contents | sample data |
| Shared identifier | room code |
| Personal evidence view | notebook |
| Timed story stage | round |
| Final group choice | accusation |
| Answer screen | reveal |

Catalog description: “Solve a three-round mystery with 4–8 friends using one synchronized room code.” It is 80 characters and starts with a verb.
