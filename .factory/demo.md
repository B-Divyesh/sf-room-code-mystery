# Demo sandbox

## Entry point

- Local: `http://127.0.0.1:5173/` or `http://127.0.0.1:5173/demo`
- Production: `https://room-code-mystery.sociobot.in/demo`
- Query fallback: `/?demo=1`

Both routes open directly in round one. The cold root is the factory capture route, so it shows active playable content before private-room setup. No account or room setup is required.

## Sample data

The demo uses room `C7K2M`, six players, notebook 1, and The Glasshouse Lantern. Its three rounds include the complete authored clue set, accusation screen, solution, and replay action.

## Isolation and reset

Demo state uses the `demo:rcm:game` local-storage key. Real rooms use `rcm:game` and the product-owned room service; sound settings use `rcm:settings`. The demo never reads or writes the real room key and never contacts the room service. “Reset demo” deletes only the demo key and reseeds round one. “Start for real” deletes demo state before opening `/setup`.

## Verification path

1. Open `/demo` in a fresh browser context.
2. Confirm the persistent demo banner and round-one clue.
3. Advance through rounds two and three.
4. Accuse Celia Finch and open the correct reveal.
5. Start a second case or reset the demo.
6. Set the context offline and reload after the service worker takes control.

The browser suite follows this path and records each public claim in `.factory/claims.json`.
