# T-22 — The content region is five percent of the screen

**Track B · `prototype/scene.js` (the resting framing) · no dependency**

## Goal

The Screen reads at roughly twice its buffer scale at rest, so the only informative surface on the
Unit is also a legible one.

## The measurement

At the resting framing (dist 6.04, tilt 12.6) in a 1680×952 window, the Screen opening draws
**~405 CSS px wide**. The buffer is 320×180 (`prototype/screen/render.js:6`), so content renders at
**1.27×**, non-integer, angled and colour-graded. The 8px Silkscreen labels land at about 10 CSS px.

Meanwhile the two Decks are ~300px each and carry **no information at all**.

Measured alternative: **tilt ~4 / dist ~4.6 gives a 676px Screen** — a little over 2× buffer scale,
where the phosphor grid lands on whole pixels.

The narrow layout already solves this and is more legible than the desktop one. This ticket brings
the desktop composition toward what the phone composition already proves.

## Build

Move the `REST` framing in and **let the Decks crop**. The Unit does not need to be whole in frame to
be believed — the reference photographs that started this project are all crops.

## Done when

- The Screen measures ≥ 640px wide at rest at 1680×952.
- The Silkscreen labels land on whole pixels.
- The Decks may leave the frame; the Plate's engraved edge must still read somewhere.

## Traps

- **`REST` is shared with the opening.** `intro.js` lands on it. Changing it changes where the
  opening ends — check both, and check T-21 has not moved the same numbers.
- **Arithmetic is verification.** The opening tilt was originally found by projecting the
  candlestick's top into NDC, not by looking at it. Do the same here rather than eyeballing.
- **The clipped back candlestick** (Open item 14) gets worse at a tighter framing. Three options were
  offered and none chosen — this ticket will force that decision. Surface it, do not silently pick.
- Do not scale the Screen texture up to compensate. The buffer is 320×180 on purpose (ADR-0022).
