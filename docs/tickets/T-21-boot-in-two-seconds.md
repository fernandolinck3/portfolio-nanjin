# T-21 — The ritual costs the pitch, and it costs it every time

**Track B · Open item 4 · no dependency · `prototype/intro.js`**

## Goal

The first legible word arrives inside 2.5 seconds instead of 5.9, and the ritual survives.

## The measurement

`intro.js:73-74`:

```js
const BOOT = 5.2
const HOLD = 0.7
```

Content is legible at **~5.9s** on every load. `PRODUCT.md` names the audience as recruiters and
prospective clients — people with ten to thirty seconds. Between 20% and 59% of that budget is spent
watching a percentage counter. Open item 4 has asked for 2–2.5s since 2026-08-28 and nothing moved.

The skip exists and nothing says so. A click ends the opening; no affordance tells anyone that.

## Build

1. **`BOOT` to ~1.8s, keep `HOLD`.** Camera and boot run on separate clocks (see *State of the
   object*), so this changes the Screen's power-on without touching the camera travel.
2. **Type the Module in behind the boot, not after it.** The boot percentage and the first Module's
   text should overlap rather than queue. This is where the time actually is.
3. **A faint `TOQUE PARA PULAR` on the Plate after 1.2s**, in the Print's own vocabulary — not a
   browser-styled button.
4. **Run the full opening once per session.** `sessionStorage`, not `localStorage`: a returning
   visitor in a new session should still get the ritual. This logic existed once and was removed;
   check `docs/log/2026-08.md` before rewriting it from scratch.

## Done when

- A cold load puts a legible Module on the Screen in under 2.5s, measured.
- The second load in the same session is faster still.
- Someone who has never seen the object can tell that it can be skipped.

## Traps

- **This cannot be verified in an automated tab.** `rAF` fires zero times there, so the opening
  cannot be observed at all — see `CLAUDE.md`. Drive `__unit.step(t)` / `__unit.render()` to check
  the *states*, and hand the felt timing to Fernando. Do not claim the pacing is right from a tab.
- **Do not cut `TRAVEL`.** The camera move is the part that reads as craft; the boot is the part
  that reads as waiting.
- Keep the ritual. The instruction is to make the content arrive sooner, not to delete the opening.
