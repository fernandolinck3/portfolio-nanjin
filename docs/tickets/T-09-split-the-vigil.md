# T-09 — Split the Vigil into `rite` and `hour`

**Track B · depends on nothing · small, and cheap only if done now**

## Goal

`vigil` stays one authored value. Consumers stop reading it directly and read one of two derived
channels instead:

```js
const rite = vigil   // interior: the three Candles go out, one at a time
const hour = vigil   // exterior: the sky turns from afternoon to night
```

Identical values, different names, one seam.

## Why

The Vigil is doing two jobs on one control. It reads correctly today and nobody should change how it
looks. But the two jobs answer to different things — the rite is a liturgy performed on the Altar,
the hour is the world outside the window — and someone will want dusk with the candles still lit, or
a dark room at noon. Doing that later, when a dozen consumers all read `vigil`, is a scene-wide edit.
Doing it now, when they read `rite` or `hour`, is one line.

This is `SPEC.md §2.1`, and it is the one structural thing the 2026-08-25 handoff flagged as
undecided. It is decided: split the names, keep the behaviour.

## Build

In `applyVigil()`:

- **`rite`** drives: the three rig lights, the Candle flames, halos and lights, `scene.environmentIntensity`,
  the Screen `glow`, the `rake` light, `faceMat.emissiveIntensity`, and the Nightwork normal scale.
- **`hour`** drives: `nightSky.material.opacity`, `skyLight` intensity and colour, `wallWash`
  intensity and colour.
- The slow counter-rotation of the two Decks in `frame()` is the rite — the visitor's hands are on
  those wheels.

## Done when

- No consumer outside the derivation reads `vigil`.
- Every render is pixel-identical to before. This ticket changes nothing visible; if it does, it has
  gone wrong.
- Temporarily setting `hour = 0` with `rite = 1` produces a dark room in daylight and does not throw.
  Prove the seam works, then put it back.

## Traps

- Do not add a second control, a second slider or a `?hour=` parameter. This is naming, not a feature.
