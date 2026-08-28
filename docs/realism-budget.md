# Spending on realism without spending the frame

A working document, not an ADR. ADR-0019 established what this scene actually costs. This is how to
use that when adding to the room.

## The cost model, measured

| | cost |
|---|---|
| 150 draw calls, 77k triangles | **~free.** An M1 Pro does not notice this. |
| 15 lights | **87% of the frame** |
| clearcoat on 36 meshes | **66%** |
| transmission on 3 tiny meshes | **41%** |
| 1.3 → 5.2 megapixels | scales linearly, ~4 ms/Mpix |

**Geometry is paid for once. Per-pixel lighting is paid for by every lit pixel, every frame,
forever.** That one sentence decides everything below.

## Spend freely

- **Bevels and chamfers on every edge.** Triangles are free here and nothing real has a razor edge.
  A chamfer is what catches the highlight that reads as "solid object". Biggest single realism win
  available, at almost no cost.
- **More objects, more props, more detail.** 150 draw calls could triple before it matters.
- **Baked contact shadows and ambient occlusion, painted into the maps.** Zero runtime cost, and it
  is what stops things floating — cheaper *and* better than more shadow-casting lights.
- **Roughness, normal and bump maps.** Per-pixel but cheap, and they do most of the work of
  "material" that people credit to lighting.

## Spend only with a measurement

- **Any new light.** Twelve are active. three.js culls none of them: every visible light is compiled
  into the shader and evaluated by every lit fragment, whatever its intensity or distance. If
  something needs to glow, make it **emissive and let bloom carry it** — do not add a light.
- **clearcoat, transmission, sheen, iridescence, anisotropy.** Each one multiplies the light loop, or
  in transmission's case renders the whole scene again.
- **Real-time shadows from anything but the key.**

## The rule

Measure after every phase, with the harness in ADR-0019 — `renderer.render()` in a tight loop,
`readPixels` of one pixel to force GPU completion. Not `requestAnimationFrame`; see the note at the
end of ADR-0019 for why that cannot work in an automated tab.

**Budget: stay under 8 ms at 1512x856.** A change that costs more than it is visually worth goes back.

## Phases

**Phase 0 — convert `MeshPhysicalMaterial` to `MeshStandardMaterial`. DONE, and it bought nothing.**

39 of 40 declarations converted; only the Plate still needs Physical, for its clearcoat. Frame time
went 4.00 → 4.17 ms/Mpix — **no change, within noise.**

The prediction was that this would be a large win, and it was wrong for an instructive reason: the
clearcoat and transmission had *already* been removed in ADR-0019. A `MeshPhysicalMaterial` with no
physical feature enabled compiles behind the same `#ifdef`s as a Standard one, so the class name was
never the cost — **the features were.** Worth keeping for hygiene: it makes the expensive path
something you have to opt into by hand, rather than the default that 161 materials fell into.

This is the first thing the measure-every-phase rule caught, and it caught it on the very first
phase. Keep the rule.

**Phase 0.5 — the Candles, 2026-08-28. Flicker done. Flame model deferred, and measured why.**

Before modelling anything, the flames were measured on screen. **They are never in frame.** They sit
above the top edge until roughly 46 degrees of tilt, and `CAM_LIMITS` stops the visitor at 74 while
`ORBIT` stops them at the resting 6 — so on the shipped Unit the visitor sees part of a *candlestick*
and no flame at all. A teardrop profile, a blue base, a hot core, a wick, drips: all of it would have
been invisible.

So the whole of a candle's contribution, as shipped, is **the light it throws** — and that is where
the work went. The old flicker was `.86 + .14 · sin · sin`: smooth, periodic, symmetric, identical on
all three but phase-shifted, which reads as a slow pulse. A candle is mostly still and then gutters.
It is now a slow two-sine gate, clamped at zero, which spends most of its time closed and
occasionally opens onto a faster wobble — quiet, quiet, flutter, quiet. Measured over 60s: mean 3.30,
range 2.20–3.60, in gutter 11–22% of the time, and the three candles differ in *shape* rather than
only in phase.

The light also **moves with the flame** now, up to 6.6mm with a 3.4-degree lean. That is the part
that pays at the shipped framing: the Plate has a clearcoat, and a source that drifts drags its
highlight across the lacquer where a better-shaped flame would do nothing.

Floored at 0.35 so a gutter can never take a light under `dim()`'s visibility threshold. That is not
cosmetic — light *count* is part of every program key, so a flicker that crossed it would rebuild
every shader in the scene mid-gutter.

**Whether to model the flame at all is a framing question, not a modelling one.** It is worth doing
the moment the candles are brought into view, and worth nothing until then.

**Phase 1 — bevels.** Every box in the room: credenza, records, pedals, monitor cabinets, Altar,
drawers. Expected cost: near zero. Expected gain: the largest of anything here.

**Phase 2 — baked AO.** Contact darkening painted into the existing texture maps. Free at runtime.

**Phase 3 — one bloom pass.** Affordable now. It is what makes a candle read as a source of light
rather than a bright shape, and a large part of why the reference image feels real.

**Phase 4 — reconsider `skyLight`.** ADR-0018's correction identified it as the remaining flatness:
a falloff-free directional at 3.2 carrying 38–74% of every surface. It is a *look* decision, not a
performance one, and it needs eyes on it.

## Startup, and the loading screen

Measured census of canvas drawn before anything appears:

| | megapixels | MB (RGBA) |
|---|---|---|
| Plate maps (6 canvases @ 2048x1124) | 13.8 | 55 |
| everything else — walls, floor, sky, decks, panels, rug, portrait | 20.8 | 84 |
| **the Plate again**, rebuilt when the webfonts land | +13.8 | +55 |
| **total** | **~48** | **~194** |

Roughly seven seconds before the first frame. Three things, in this order:

1. **Stop building the Plate twice.** `regenFace()` runs at init and again from
   `document.fonts.ready`. That is 40% of the load for nothing — await the fonts first.
2. **The Plate is probably oversized.** Six canvases at 2048x1124 for something that renders around
   900px wide. Halving it is another ~10 Mpix, and it is the largest texture in the project.
3. **Chunk the work — this one gates the loading screen.** All of the above runs *synchronously*, so
   the browser is frozen while it happens and **a loading screen cannot draw at all**. It would be a
   spinner that never spins. Yield a frame between texture builds and the screen can animate and
   report real progress.

Only then design the screen. And it should not be an apology for the wait: this object is a **Vigil**,
so load it as Candles lighting one at a time, or the room rising out of black as each map lands. The
wait becomes part of the piece.

Expected: ~7s down to ~2s, with the remainder made into something worth watching.
