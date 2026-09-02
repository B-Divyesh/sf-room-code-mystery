# Room Code Mystery — visual thesis

## Direction

**Botanical field guide after dusk.** The game looks like a working naturalist’s folio: cream specimen paper, pressed-leaf silhouettes, ink annotations, brass specimen numbers, and deep greenhouse green. The mystery stays warm and social rather than grim. Evidence is arranged like collected plant samples, which makes private clues feel tangible and easy to discuss over a call.

The landing page is deliberately asymmetric. A large field-guide illustration occupies one side while the working join/create controls sit on a pinned paper panel. Game screens keep the same desk surface, but reduce decoration so clues and the timer remain clear at 390 px.

## Tokens

- Background — `#17251f` greenhouse green.
- Background deep — `#0f1915` for the footer and modal scrim.
- Paper — `#f3edda` warm herbarium stock.
- Paper raised — `#fffaf0` for active clue sheets.
- Text on paper — `#19241f` iron-gall ink.
- Muted on paper — `#46534b` (tested above 4.5:1 on paper).
- Accent — `#b84a2f` sealing-wax red.
- Accent dark — `#873420` for hover/focus contrast.
- Brass — `#d7b665` for small markers on dark surfaces.
- Success — `#23633f`; warning — `#8a5713`; danger — `#9b3028`.

The product has one explicit treatment: a dark green desk holding light paper. This single-mode choice supports the field-guide metaphor and avoids a second theme that would weaken the authored clue art.

## Type and spacing

- Display: Georgia, Cambria, `Times New Roman`, serif. The high-contrast forms resemble historic field-guide titles without a font download.
- Body: ui-sans-serif, system-ui, -apple-system, `Segoe UI`, sans-serif. It stays quiet for rules and controls.
- Scale: 16, 18, 22, 30, and `clamp(40, 7vw, 76)` px.
- Spacing uses an 8 px base: 8, 16, 24, 32, 48, 64, and 96 px.
- Reading measure is 64 characters. Controls are at least 44 px high.

## Shape and interaction grammar

Panels use clipped paper corners, thin ink rules, and a small pin or specimen number. Buttons resemble painted index tabs: square corners with one clipped edge. Dashed borders mean an item has not been chosen; solid red borders mark the current choice. Links stay underlined.

Every action changes a visible noun: create a room, join a room, start a round, reveal the answer. Keyboard focus uses a 3 px brass outline on green and a 3 px sealing-wax outline on paper. Both have a 3 px offset and at least 3:1 contrast. Touch and keyboard use the same controls. Private notebook state persists locally; shared room phase and timer state synchronize through the product room service.

Connection status uses a small field-station lamp: solid green means connected and an outlined circle means reconnecting. It is always paired with text, so color never carries the state alone.

## Motion

The signature motion is a single 220 ms “paper settle”: new clue sheets rise 8 px and settle while their shadow softens. The hero leaves drift no more than 12 px on pointer movement. Timers do not pulse or flash. Under `prefers-reduced-motion: reduce`, transforms and transitions are removed and state changes are immediate.

## Game rhythm and difficulty

The starter case runs in three rounds. Round one establishes people and place; round two introduces contradictions; round three supplies the decisive physical trace. Each round defaults to three minutes, but the host can pause or advance, so timing never blocks accessibility. Four to eight players receive different clues in every round. The accusation offers four suspects, one correct answer, and a compact explanation. A second authored case gives the gathering a reason to replay. Both cases are free until product-scoped checkout exists.

## Asset plan and provenance

The hero is one original generated editorial still life, cropped responsively and compressed to WebP under 300 KB. Clue specimens and interface marks are hand-authored CSS/SVG shapes so clue meaning never depends on generated imagery.

### Prompt sheet

- Subject: an open nineteenth-century botanical field notebook containing pressed fern fronds, labeled specimen envelopes without readable writing, a brass magnifying lens, one dark red wax seal, and a greenhouse key.
- World: a nocturnal greenhouse worktable, mysterious but safe and welcoming.
- Materials: fibrous cream paper, graphite, dried leaves, tarnished brass, dark walnut.
- Light: soft moonlight through greenhouse glass plus warm desk-lamp edge light.
- Lens/composition: editorial overhead still life, landscape, objects concentrated on the right and upper edges, generous calm dark-green negative space on the left, no people.
- Palette words: greenhouse green, herbarium cream, sealing-wax red, aged brass, iron ink.
- Negative list: no text, no letters, no logos, no watermark, no hands, no skulls, no weapons, no horror, no modern electronics, no bright cyan or purple.

Generated with the factory image model (`factory-image`) on 2026-09-02. The generated source and prompt sidecar live in `assets/src/`; shipped WebP derivatives live in `public/art/`. Generated imagery is disclosed in the site footer.

## Accessibility and responsive intent

At 390 px the illustration becomes a shallow backdrop above the room controls; secondary botanical decorations disappear. The clue sheet, timer, and next action stay above the fold. No clue relies on color alone: every mark has text, shape, or pattern. All body text is at least 16 px, contrast targets 4.5:1, zoom to 200% remains usable, and status changes are announced.
