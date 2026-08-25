# T-08 — The window reads rectangular, and one curtain is missing

**Track B · depends on nothing · two small, unrelated bugs in one ticket**

## Goal

1. The lancet window reads as an arch, not a rectangle.
2. Both curtains show.

## Why

The window earns its place twice (ADR-0011): it gives the Moon deck a referent and it gives the Vigil
its second act. Right now the arch sits above frame at most camera angles inside the clamp, so what
the visitor actually sees is a rectangle of sky — which is a plain window in a plain room, and the
referent is lost.

## Build

- **The arch.** `WIN = { x, y0, spring, y1 }` and the wall's `ExtrudeGeometry` hole in
  `prototype/scene.js`. Either lower the springing line and the head so the arch falls inside the
  frame across the whole tilt range `[4°, 74°]`, or raise the sill and shorten the opening. Check at
  both clamp ends — a fix that works at 28° and fails at 70° is not a fix.
- **The left curtain.** Its rotation is wrong. Most likely a mirrored transform that flips it out of
  view rather than reflecting it; compare against the right one rather than nudging values.

## Done when

- The arch is visible at 4°, 28° and 74° tilt and across the full yaw range.
- Both curtains hang, and the left is a mirror of the right rather than a copy of it.

## Traps

- Verify in a browser at each clamp end. This is precisely the class of bug a single headless still
  hides.
