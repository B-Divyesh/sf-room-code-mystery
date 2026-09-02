# Adversarial first-read review 1 — FAIL

**Product:** Room Code Mystery  
**Live URL:** <https://room-code-mystery.sociobot.in/>  
**Reviewed:** 2026-09-02 UTC  
**Work order:** `room-code-mystery-review-1`  
**Verdict:** **FAIL** — 19 findings remain: 2 blocking, 7 high, 4 medium, and 6 minor.

The cold first screen is clear and the sample is immediately playable. The
product still fails because a “room” does not synchronize its players, the
brief's paid-case requirement was removed rather than completed, and the
claim, route, structure, and copy contracts are not yet clean.

## 1. Cold first read

Fresh contexts were opened without prior storage at 390 × 844 and 1440 × 900.
Nothing was scrolled before recording the first viewport.

My first-read answers were:

- **What does this do?** It is a three-round browser mystery in which friends
  compare different clues and make one accusation.
- **For whom?** It is for 4–8 friends playing together on a call.
- **What should I click first?** **Try it with sample data**.

The exact copy supporting those answers was “A browser game for 4–8 players,”
“Solve a mystery with your friends,” “Compare private clues on a call and make
one group accusation,” and “Try it with sample data.” The mobile viewport also
showed room `C7K2M`, round 1 of 3, the `3:00` timer, the clue heading, and **Open
round 2**. The desktop viewport showed the same active game. No console errors
occurred. This part is not blocking.

The first screen does not contain the mandatory three plain facts about price,
privacy, and offline use; see F-1-10.

## 2. Demo and sandbox

Selecting **Try it with sample data** changed the URL to `/demo` and immediately
showed room `C7K2M`, round 1, “Notebook 1: Pressed leaflet,” a realistic clue,
the timer, and the next-round control. The persistent banner read “Demo —
sample data, nothing is saved” and included **Reset demo** and **Start for
real**.

Independent live checks confirmed:

- advancing to round 2 then selecting **Reset demo** restored round 1;
- a real four-player room in `rcm:game` was byte-for-byte unchanged by the
  demo flow;
- demo state used `demo:rcm:game`;
- **Start for real** deleted only `demo:rcm:game`, opened `/setup`, and retained
  the real room;
- the complete observed demo flow made requests only to
  `https://room-code-mystery.sociobot.in` and logged no console errors; and
- after service-worker activation, `/demo` reloaded offline with HTTP 200,
  the demo banner, round 1, and the offline notice.

The behavior passes. The declared automated isolation and privacy tests do not
fully prove their wording; see F-1-4 and F-1-5.

## 3. Copy audit

Counts treat a hyphenated term, path, code token, or URL as one word. The cold
root is the landing page. Interface fragments and actions are separated from
sentences so none are silently omitted. Repeated identical strings are listed
once.

### Landing-page sentences and headings

| Copy | Words | Result |
| --- | ---: | --- |
| Demo — sample data, nothing is saved | 7 | Pass; required demo wording |
| A browser game for 4–8 players | 6 | Pass |
| Solve a mystery with your friends | 6 | Pass; headline is under 9 words |
| Compare private clues on a call and make one group accusation. | 11 | Pass |
| Round one is ready below. | 5 | Pass |
| The Glasshouse Lantern | 3 | Pass; case name |
| Notebook 1: Pressed leaflet | 4 | Pass; current clue heading |
| A fresh fern leaflet lies inside the empty display. | 9 | Pass |
| Its underside carries a thin stripe of cobalt chalk. | 9 | Pass |
| Read both lines aloud. | 4 | Pass |
| Then compare what each notebook shows. | 6 | Pass |
| Three evidence rounds for 4–8 friends. | 6 | Pass |
| Original generated field-guide art | 4 | Pass; provenance disclosure |

### Landing-page actions, navigation, and fragments

| Copy | Words | Result |
| --- | ---: | --- |
| Skip to main content | 4 | Pass |
| Room Code Mystery | 3 | Pass; wordmark |
| Demo | 1 | Pass; navigation |
| Privacy | 1 | Pass; navigation |
| Reset demo | 2 | Pass |
| Start for real | 3 | Pass; required demo action |
| Try it with sample data | 5 | Pass; required primary action |
| Start a private room | 4 | Pass |
| Room C7K2M | 2 | Pass; state label |
| Round 1 of 3 | 4 | Pass; state label |
| Discuss | 1 | Pass; timer state |
| 3:00 | 1 | Pass; timer value |
| Sound off | 2 | **Flag; see F-1-14** |
| Pause timer | 2 | Pass |
| Open round 2 | 3 | Pass |
| Leave room | 2 | Pass |
| Terms | 1 | Pass; navigation |
| Built by Param Factory | 4 | Pass; external attribution |
| v1.0 | 1 | Pass; build label |

### README headings and link labels

All headings name their sections without relying on mood copy: “Room Code
Mystery” (3), “Try the sample room” (4), “Run locally” (2), “Test and build”
(3), “How room codes work” (4), “Deployment” (1), “Privacy and accessibility”
(3), and “Project notes” (2). The list labels are “Visual thesis and asset
provenance” (5), “Demo contract” (2), “Claims and their tests” (4), “Copy
audit” (2), and “Build handoff” (2). Terminology is inconsistent around the
demo; see F-1-18.

### README sentences

| # | Sentence | Words | Result |
| ---: | --- | ---: | --- |
| 1 | Solve a three-round browser mystery with 4–8 friends and one shared room code. | 13 | Pass |
| 2 | Each player opens a different private notebook, reads one clue per round, and helps the host make one accusation. | 19 | Pass |
| 3 | The Glasshouse Lantern and The Orchid Ledger are fully playable for free. | 12 | Pass |
| 4 | The game has no checkout, accounts, public matchmaking, voice, video, or automated judgments. | 13 | Unlisted claims; F-1-6 |
| 5 | Live site: https://room-code-mystery.sociobot.in | 3 | Pass |
| 6 | Open / or /demo to start round one with room C7K2M, six player notebooks, and the free case. | 18 | Pass |
| 7 | The root route is an active game screen for a quick first play. | 13 | Pass |
| 8 | The banner can reset the sample or leave for a real room. | 12 | Pass |
| 9 | Demo state uses demo:rcm:game. | 4 | Pass |
| 10 | Real state uses rcm:game. | 4 | Pass |
| 11 | Resetting or leaving the demo removes only its sample state. | 10 | Pass |
| 12 | See .factory/demo.md for the verifier flow. | 6 | Pass |
| 13 | Requirements: Node.js 20 or newer and npm. | 7 | Pass |
| 14 | Vite prints the local URL. | 5 | Pass |
| 15 | Open /demo for the seeded game. | 6 | Pass |
| 16 | npm test runs deterministic core tests and Chromium browser tests. | 10 | Pass; developer-specific terms are useful here |
| 17 | Claim tests use the tags recorded in .factory/claims.json. | 8 | Pass |
| 18 | The production build writes index.html and all static assets to dist/. | 11 | Pass |
| 19 | An opened room reloads offline after its first visit. | 9 | Pass; `offline-reload` |
| 20 | The service worker caches the app shell and visited assets. | 10 | Unlisted claim; F-1-7 |
| 21 | Room progress and the sound choice persist in browser local storage. | 11 | Partly unlisted claim; F-1-8 |
| 22 | The five-character room code deterministically identifies the case, player count, and clue arrangement. | 13 | Jargon and incomplete proof; F-1-3 and F-1-16 |
| 23 | It does not connect browsers. | 5 | Unlisted limitation and product gap; F-1-1 |
| 24 | Friends stay together on their existing call, advance when the host says so, and read their private clues aloud. | 19 | Pass |
| 25 | This matches the static deployment without sending room activity to a server. | 12 | Pass; explains the limitation |
| 26 | Choose either free case at /setup. | 6 | Pass; `additional-case` |
| 27 | The five-character code records the chosen case and player count locally. | 11 | Covered in part by `room-code` and `local-privacy`; proof gap in F-1-3 |
| 28 | The site has no checkout or payment provider. | 8 | Pass for the current build; `additional-case` |
| 29 | The deployment type is static. | 5 | Pass |
| 30 | Use this exact command: | 4 | Pass |
| 31 | Publish dist/ as the site root. | 6 | Pass |
| 32 | staticwebapp.config.json supplies SPA fallback, security headers, and cache-safe content types. | 10 | Jargon; F-1-17 |
| 33 | The factory owns DNS and infrastructure. | 6 | Pass |
| 34 | Room codes, notebook choices, timers, and accusations stay on the device. | 11 | Pass in behavior; `local-privacy` has the proof gap in F-1-5 |
| 35 | /privacy and /terms contain the complete product text. | 8 | Pass |
| 36 | The interface includes stable keyboard focus, 44 px touch targets, one heading and main landmark per route, reduced motion, mobile layouts, and explicit timer controls. | 25 | Over 22 words and partly unlisted; F-1-9 and F-1-15 |
| 37 | Tests cover the full game, offline reload, local privacy, mobile actions, and serious accessibility findings. | 15 | Pass; confirmed by the full suite |
| 38 | Original generated art is disclosed in the site footer and documented in the visual thesis. | 15 | Pass; provenance is present |
| 39 | Source code is MIT licensed; see LICENSE. | 7 | Pass; `LICENSE` is present |

No banned marketing word from the supplied plain-words list appears in the
landing page or README.

## 4. Claim test results

All 15 exact commands in `.factory/claims.json` were run after `npm ci`. Each
claim id appears exactly once in `tests/e2e/game.spec.ts`.

| Claim | Exact command | Result |
| --- | --- | --- |
| `complete-case` | `npm test -- --grep @claim:complete-case` | PASS |
| `room-code` | `npm test -- --grep @claim:room-code` | PASS; coverage gap F-1-3 |
| `demo-sandbox` | `npm test -- --grep @claim:demo-sandbox` | PASS; coverage gap F-1-4 |
| `local-privacy` | `npm test -- --grep @claim:local-privacy` | PASS; coverage gap F-1-5 |
| `offline-reload` | `npm test -- --grep @claim:offline-reload` | PASS |
| `additional-case` | `npm test -- --grep @claim:additional-case` | PASS |
| `settings-persist` | `npm test -- --grep @claim:settings-persist` | PASS |
| `restart` | `npm test -- --grep @claim:restart` | PASS |
| `render-rate` | `npm test -- --grep @claim:render-rate` | PASS |
| `timer-focus` | `npm test -- --grep @claim:timer-focus` | PASS |
| `focus-contrast` | `npm test -- --grep @claim:focus-contrast` | PASS |
| `mobile-actions` | `npm test -- --grep @claim:mobile-actions` | PASS |
| `not-found-status` | `npm test -- --grep @claim:not-found-status` | PASS |
| `cold-root-game` | `npm test -- --grep @claim:cold-root-game` | PASS |
| `link-crawl` | `npm test -- --grep @claim:link-crawl` | PASS |

No declared test failed. Passing commands do not remove the manifest and test
scope findings below.

## 5. History check

There are no earlier `.factory/review-*.md` or `.factory/polish-*.md` files.
The earlier handoff and all three verification reports were read. The earlier
defects were checked again on the live site and in code.

| Earlier defect | Current result |
| --- | --- |
| Paid case could not be purchased | **Not fixed to the brief.** The checkout was removed and the second case made free; F-1-2 repeats this as blocking. |
| Timer updates removed keyboard focus | Fixed. Focus stayed on Pause, Space paused, and `timer-focus` passed. |
| Focus ring was below 3:1 | Fixed. `focus-contrast` passed against both paper colors. |
| Demo/game targets were below 44 px | Fixed. `mobile-actions` passed. |
| Mobile next-round action was below the fold | Fixed. The action was visible at 390 × 844 and the claim passed. |
| Unknown routes returned 200 | Fixed. A missing live route returned HTTP 404. |
| `complete-case` claimed 20 minutes without testing it | Fixed by removing the 20-minute claim and testing all three 3:00 rounds plus reveal. |
| `local-privacy` stopped before accusation | Fixed for accusation coverage, but same-origin upload detection remains incomplete; F-1-5. |
| Cold root was a menu wall | Fixed. The root opens an active round with a timer and next action. |
| Additional paid case was unavailable | **Half-fixed.** It is free, but the brief still requires a paid additional case; F-1-2. |
| Footer destination had invalid TLS | Fixed. `https://hello-factory.sociobot.in/` returned 200. |

## 6. Structure, routing, accessibility, and visual identity

Live `/`, `/demo`, `/setup`, `/privacy`, and `/terms` returned 200. The missing
route returned 404. All six pages had `lang="en"`, one `<h1>`, one `<main>`,
and route-appropriate titles. Browser Back restored `/setup`, focused its h1,
and the in-app navigation likewise focused and announced the new h1. A room
deep link opened `/play` with six notebook choices. Every crawled HTTP link
returned below 400; the mail link and in-page skip links were valid exceptions.

Live Axe scans at desktop and 390 px found zero serious or critical findings
on all six routes. The worker URL check found a title, language, one h1, main,
no missing image alt, no unlabelled button, and no console errors. The full
local suite passed 5 unit tests and 18 browser tests. `npm run build` passed and
produced `dist/`; initial JS was 29.93 kB raw / 10.87 kB gzip and CSS was 15.57
kB raw / 4.44 kB gzip.

The botanical field-guide identity is distinct rather than a generic SaaS
template: cream specimen paper, dark greenhouse green, sealing-wax controls,
brass markers, authored clue drawings, and generated herbarium artwork match
the recorded design thesis. Reduced motion is implemented.

Metadata, the root information order, the actual 404 shell, and the sitemap
still have findings below.

## 7. Findings

### Blocking

#### F-1-1 — A room code does not create a shared or synchronized room

- **Exact quote/location:** `/setup`: “One friend creates the code. Everyone
  else joins with it.” The actions are **Create room code** and **Open player
  notebooks**. README later says, “It does not connect browsers.”
- **Evidence:** With live code `APW2J`, the host opened “Notebook 1: Floor
  print” and entered phase `clue`; a second fresh browser that joined the same
  code remained at “Choose your private notebook” in phase `lobby`. The host's
  timer, rounds, and accusation never reach the guest.
- **Why this fails a first-time visitor:** “Create,” “join,” and “room” normally
  describe a shared session. The important no-sync limitation is absent from
  the live first-run flow. It also misses the obvious sync implied by the brief's
  host and personal-view job.
- **Concrete fix:** Implement an ephemeral synchronized room: host round/timer
  state and the final reveal propagate to joined browsers, while private clues
  stay private and accusations are deleted with a short TTL. Store server state
  only in product-owned SQLite under `/data`. Add a two-context claim test that
  joins by the generated code and observes host advances. The demo must use a
  canned isolated room and spend no external service. If synchronization is
  intentionally out of scope, change “room,” “join,” and the brief before
  release, and disclose “Browsers do not connect; the host tells everyone when
  to advance” beside the create action.

#### F-1-2 — The earlier paid-case requirement was removed, not completed

- **Exact quote/location:** `.factory/brief.json`: “one-time — sell additional
  handcrafted cases to the host, with the starter case fully playable free.”
  `/setup` now says “Two handcrafted cases are free to play” and “No checkout
  or license is required.”
- **History:** This repeats the earlier verification-2 P1 finding, “the
  researched paid-case offer is unavailable.” Removing the broken checkout
  made the live copy honest, but it did not satisfy the source-of-truth brief.
- **Why this remains blocking:** The prior finding explicitly required a
  working Sociobot checkout or an approved brief change. The brief still names
  the paid model, so the handoff's assertion of an availability change is not a
  source-of-truth update.
- **Concrete fix:** Keep one starter case free and add a separate handcrafted
  paid case with an exact price through the Sociobot billing API only. Verify a
  real hosted checkout and license/return flow, add a recorded sandbox claim,
  and keep demo mode spend-free. Alternatively, record the authorized scope
  change in `.factory/brief.json` before claiming this is resolved.

### High

#### F-1-3 — The room-code claim test never uses the code in another browser

- **Exact claim:** “One room code gives 4–8 players different private
  notebooks.”
- **Location:** `tests/e2e/game.spec.ts`, `@claim:room-code`.
- **Why incomplete:** The test creates an eight-player room and selects
  Notebook 8 in the creator's browser. It never enters the generated code in a
  fresh context, proves that it resolves to the same case/player count, or
  compares two players' clues. The more detailed README claim that the code
  identifies the case, player count, and clue arrangement is therefore not
  fully tested.
- **Concrete fix:** Create the room in context A, enter its generated code in
  context B, assert the same case and eight seats, then open two seat numbers
  and assert different expected clue text. If F-1-1 is implemented, assert
  synchronized round state in the same test.

#### F-1-4 — The demo-sandbox test protects an unused marker, not real room data

- **Exact claim:** “Demo sample data does not change real room data and can be
  reset.”
- **Location:** `@claim:demo-sandbox` writes `rcm:proof`, but production reads
  and writes `rcm:game`.
- **Why incomplete:** The test would still pass if demo reset accidentally
  erased or changed the actual `rcm:game` key. Independent live review confirms
  the current code behaves correctly, but the regression test does not prove
  the claim it names.
- **Concrete fix:** Create a real room through `/setup`, retain the exact
  `rcm:game` value, enter and change `/demo`, reset and leave, then assert the
  real value is unchanged and the demo key alone is removed or reseeded.

#### F-1-5 — The privacy test would allow same-origin uploads

- **Exact claim:** “Room codes, notebook choices, timers, and accusations stay
  on the device.”
- **Location:** `@claim:local-privacy` records only request origins.
- **Why incomplete:** A same-origin `POST` containing the room or accusation
  would satisfy the current assertion. The test checks only the accusation in
  local storage, not the room code, seat, and timer.
- **Concrete fix:** Assert that the full flow makes only the expected static
  `GET` requests, that no request body contains game state, and that code,
  notebook, timer, and accusation values exist only in the demo namespace.

#### F-1-6 — README account and media claims are unlisted

- **Exact quote:** “The game has no checkout, accounts, public matchmaking,
  voice, video, or automated judgments.”
- **Why incomplete:** `additional-case` covers no checkout. No manifest entry
  tests the remaining absence of accounts, public rooms, media capture, or
  automated judging.
- **Concrete fix:** Add one narrowly worded claim and browser/network test for
  the listed absence guarantees, or reduce the sentence to the tested checkout
  statement.

#### F-1-7 — The service-worker cache claim is unlisted

- **Exact quote:** “The service worker caches the app shell and visited
  assets.”
- **Why incomplete:** `offline-reload` proves one opened demo route reloads; it
  does not assert the promised shell and visited-asset cache behavior.
- **Concrete fix:** Rewrite this as the listed claim, “An opened room reloads
  offline after its first visit,” or add a cache inventory and offline asset
  test with a matching manifest entry.

#### F-1-8 — Room-progress persistence is unlisted

- **Exact quote:** “Room progress and the sound choice persist in browser local
  storage.”
- **Why incomplete:** `settings-persist` tests sound only. No listed test
  reloads an advanced normal room and checks its round, seat, timer, and role.
- **Concrete fix:** Add a `room-progress-persist` claim and reload test, or
  rewrite the sentence to the tested sound preference only.

#### F-1-9 — The broad accessibility sentence contains unlisted claims

- **Exact quote:** “The interface includes stable keyboard focus, 44 px touch
  targets, one heading and main landmark per route, reduced motion, mobile
  layouts, and explicit timer controls.”
- **Why incomplete:** The manifest covers timer focus, focus contrast, and
  demo-route mobile actions. It does not list reduced-motion behavior, all-route
  heading/landmark coverage, or the general mobile-layout claim.
- **Concrete fix:** Split this into short sentences. Keep only claims mapped to
  existing entries, and add narrowly scoped entries/tests for reduced motion
  and route semantics if those statements remain.

### Medium

#### F-1-10 — The root omits the required facts and landing-page sections

- **Exact location:** `/` shows the intro, active round, and footer. It does not
  show three plain price/privacy/offline facts, “How it works,” privacy limits,
  or case availability. Those sections exist only on `/setup`.
- **Why this matters:** The active game makes the product tryable, but the root
  no longer follows the standard landing information order. A cold visitor
  cannot confirm price, storage, or offline behavior in the first screen.
- **Concrete fix:** Keep the active sample above the fold. Add three visible
  facts beside the CTA — “Both cases are free,” “Room data stays on this
  device,” and “Opened rooms work offline” — then place the existing how-it-
  works, privacy, and availability sections below the live game on `/`.

#### F-1-11 — Non-root routes publish the root canonical and social metadata

- **Exact evidence:** `/demo`, `/setup`, `/privacy`, and `/terms` all retain
  canonical `https://room-code-mystery.sociobot.in/`, root OG title “Room Code
  Mystery — Play a three-round mystery,” and the root description. The 404 has
  no description, canonical, OG metadata, or favicon.
- **Why this matters:** Route titles update correctly, but crawlers and shared
  links are told that every route is the home page.
- **Concrete fix:** Update canonical, description, OG, and Twitter title/
  description on every navigation and initial deep link. Give the standalone
  404 its favicon and suitable non-indexed metadata.

#### F-1-12 — The real 404 drops the site shell and uses metaphor as its h1

- **Exact quote/location:** `public/404.html` uses “SPECIMEN NOT FOUND” and h1
  “This page is not in the notebook.” It has no skip link, header, nav, footer,
  Privacy, Terms, build id, or attribution.
- **Why this matters:** The route is visually styled and returns 404, but it is
  inconsistent with every other route and its heading does not plainly name
  the error.
- **Concrete fix:** Use the standard shell on the static 404. Set h1 to “Page
  not found,” retain “The address may be old or incomplete,” and keep **Return
  to the game**. Remove the decorative specimen label or make it nonessential.

#### F-1-13 — The sitemap omits a real route

- **Exact location:** `public/sitemap.xml` lists `/`, `/demo`, `/setup`,
  `/privacy`, and `/terms`, but not `/play`; `staticwebapp.config.json` and the
  app both define `/play`.
- **Why this matters:** The route inventory is inconsistent and does not meet
  the requirement to list every real route.
- **Concrete fix:** Add `/play` to the sitemap, or make it a non-indexable state
  route and document that exception while ensuring shared room links still
  open correctly.

### Minor

#### F-1-14 — The sound button names state, not the result

- **Exact quote/location:** Active game button: “Sound off.”
- **Why this matters:** It can be read as either current state or the action
  that will occur.
- **Concrete fix:** When sound is off, label the button **Turn sound on**. When
  sound is on, label it **Turn sound off**; keep `aria-pressed`.

#### F-1-15 — One README sentence exceeds 22 words

- **Exact quote:** “The interface includes stable keyboard focus, 44 px touch
  targets, one heading and main landmark per route, reduced motion, mobile
  layouts, and explicit timer controls.” (25 words)
- **Why this matters:** Six assurances in one sentence are difficult to scan
  and obscure which behaviors are actually tested.
- **Concrete rewrite:** “Keyboard focus stays visible, and timer updates do not
  move it. Actions are at least 44 pixels tall at 390 pixels wide. Each route
  has one main heading and one main content area. Reduced motion is supported.”

#### F-1-16 — “Deterministically” is avoidable jargon

- **Exact quote:** “The five-character room code deterministically identifies
  the case, player count, and clue arrangement.”
- **Why this matters:** A player should not need a software term to understand
  that the same code produces the same setup.
- **Concrete rewrite:** “The five-character room code always maps to the same
  case, player count, and clue order.” Add the test in F-1-3 before keeping it.

#### F-1-17 — The deployment sentence uses unexplained platform jargon

- **Exact quote:** “staticwebapp.config.json supplies SPA fallback, security
  headers, and cache-safe content types.”
- **Why this matters:** “SPA fallback” and “cache-safe content types” do not
  tell a new contributor what behavior the file provides.
- **Concrete rewrite:** “The config keeps deep links working, adds browser
  security rules, and serves each file with the correct type.”

#### F-1-18 — Demo terminology is inconsistent

- **Exact locations:** README heading “Try the sample room,” body “seeded game,”
  UI “sample data,” and navigation “Demo.”
- **Why this matters:** Four terms name the same try-out path.
- **Concrete fix:** Use **demo** for the mode and **sample data** only for its
  contents: heading “Try the demo,” sentence “Open `/demo` to load the demo
  room,” and retain the required CTA “Try it with sample data.”

#### F-1-19 — The existing copy-audit artifact is inaccurate and incomplete

- **Exact location:** `.factory/copy-audit.md` counts “Solve a mystery with your
  friends” as 7 words; it has 6. It omits the live clue/footer sentences,
  action-label audit, and all README sentences.
- **Why this matters:** A repairer relying on the artifact could repeat the
  same omissions and incorrectly report that the plain-words gate is complete.
- **Concrete fix:** Regenerate the artifact from the shipped root and README,
  use the counting rule stated in this review, and include every flagged action
  and term.

## 8. Missed leverage

Synchronization is the obvious missing feature and is blocking in F-1-1. A
normal group expects the host's round, timer, and reveal to reach every browser
that joined the room code. Export/import is not useful for a short social game.
An AI feature would conflict with the brief's preference for handcrafted cases
and no automated judgments, so no AI addition is recommended.

The other brief-level leverage is a genuinely purchasable additional
handcrafted case through the Sociobot billing API, covered by F-1-2. No raw
provider key or direct payment-provider integration is present.

## 9. What would make this perfect

Resolve every finding above. In particular: synchronize real rooms without
retaining accusations, restore the brief's paid additional-case path through
Sociobot billing, make every claim exact and fully tested, put the required
facts and sections on `/`, publish route-correct metadata and sitemap entries,
use the full shell and plain heading on the 404, and clear the remaining copy
flags. Re-run every claim command, the full suite/build, live two-browser flow,
offline request audit, link crawl, URL verifier, and desktop/mobile Axe scans.
At that point there should be no remaining finding of any severity.
