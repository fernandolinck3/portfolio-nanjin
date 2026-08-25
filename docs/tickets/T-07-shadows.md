# T-07 — Shadows

**Track B · depends on nothing · the biggest single realism win available**

## Goal

The Unit casts a shadow on the linen. The candlesticks cast shadows across the Altar and up the wall.
Things stop sitting flat on the desk.

## Why

There are no shadows anywhere in the scene right now, and it is the loudest remaining reason the room
reads as assembled rather than photographed. The lighting model is tenebrism — Baroque light against
deep shadow (ADR-0010) — and half of that is currently missing.

## Build

- Shadow maps on the three Candle lights and the window's `skyLight`. Those four are the sources with
  bodies; the ambient rig lights should not cast.
- `PCFSoftShadowMap`. A candle is a small source seen close — the penumbra is wide, and a hard-edged
  candle shadow will look worse than none.
- Cast/receive flags per Part, not globally: the Unit, the candlesticks and the table cast; the
  linen, the mensa, the floor and the walls receive.
- Shadow intensity has to survive the Vigil. As each Candle dies its shadow must go with it — the
  ramp in `applyVigil()` already has the per-candle factor to hang this on.

## Done when

- The Unit is visibly seated on the cloth at every camera angle in the clamp.
- Raising the Vigil to 1 leaves only the Screen's own light and its shadow, and nothing pops.
- Frame time is still comfortable. Measure it; four shadow-casting lights is not free.

## Traps

- Shadow acne on the Plate will destroy the engraving. Bias per light, and check at full Vigil where
  the rake light grazes.
- The flames are billboards. They must not cast.
