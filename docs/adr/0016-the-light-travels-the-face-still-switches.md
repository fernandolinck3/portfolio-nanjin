# The light travels; the Face still switches

The Screen's **colour, celestial gauge and character tones now move continuously** with the Vigil,
from first light to the moment the last Candle dies. The **Face still changes at a threshold**, and
that threshold is still `LAST_CANDLE_OUT`.

This amends ADR-0015 rather than reversing it. The Vigil still chooses the Face, and the visitor still
has no switch. What changes is that the Vigil stops being the *only* thing that happens at 0.94.

## The complaint

Fernando, looking at the Screen: *"the progression from the grimoire to the other version needs to be
a little bit more smooth, maybe we can have a sun on the display going to the moon and the character
can slowly change colors and stuff."*

He is describing a real fault that ADR-0015 predicted and under-weighted. That ADR flagged Cracktro
occupying the top 6% of the Vigil as a *rarity* problem. It is worse than rare: for 94% of the
Vigil's travel the Screen does not acknowledge the Vigil at all, and then it replaces itself in one
frame. The room outside has been getting darker the whole time — three Candles dying on overlapping
ramps — and the Screen sat there at full brightness ignoring it, because nothing on it read the Vigil
except a `>=` comparison.

So the transition read as a glitch rather than as nightfall, and the night Face arrived without
having been announced.

## Why not simply crossfade the two Faces

Because `CONTEXT.md` defines a Face as *"a complete visual treatment — the same six Modules, a
different visual language throughout. A Face is authored per Module, not applied as a palette."*

Grimoire and Cracktro are not two palettes over one layout. Grimoire is a bordered folio page with a
blackletter header, an emblem, a body column and a figure in a niche. Cracktro is a centre-aligned
demo screen with copper bars, a bobbing logo and a credits roll. There is no meaningful interpolation
between "left-aligned body column" and "centred credits roll" — attempting one would have forced both
Faces toward whatever shape could be tweened, which is the definition of applying a palette.

## The decision

Split what was one event into two, on different schedules.

**Continuous, across the whole Vigil** — everything that is not layout:

- the palette, `DAY` → `DARK`, driven by `dusk()`
- Lyra's four tones, because she is drawn with `ink/mid/dim/bg` like the chrome and was never tinted
  as a special case
- the celestial gauge: a rayed sun that climbs its track, loses its rays and arrives as a crescent
  moon exactly as the last Candle goes out

**At the threshold, unchanged** — the authored layout, and only that.

By the time the Face flips, the Screen has already been night for a while: the palette has arrived,
the moon is at the end of its track. What switches is the composition, and it switches onto ground
that has already been prepared. That is the smoothness Fernando asked for without dissolving the
thing that makes a Face a Face.

## `light.js`, and why the ramps moved

`dusk()` cannot be a curve someone liked the shape of. It is `1 - candlelight(v)`, where
`candlelight` is the mean of the three Candles' own ramps — so the Screen darkens on exactly the
schedule the Altar darkens on, and no separate easing exists to drift out of sync.

That required the ramps to have one home. They were written twice: `RAMPS` in `scene.js`, which dims
the rig and the flames, and the literal `0.94` in `screen.js`, which chose the Face. ADR-0015 named
that duplication and asked future editors to keep the two in step by hand. They now both import
`prototype/light.js`, and `LAST_CANDLE_OUT` is `RAMPS[2][1]` — derived, not typed.

## Consequences

- **ADR-0015's "move the ramp in `scene.js`, do not pick a prettier number" instruction is now
  enforced by the module graph** rather than by a comment asking nicely.
- **The Vigil's top 6% is a smaller problem than it was.** The *transition* now occupies the entire
  travel; only the layout change is rare. Whether Cracktro's layout is still too rare to be worth
  drawing is a separate question and remains open.
- **`scene.js` was touched** — its local `candle()` and `RAMPS` are gone in favour of the import. This
  is the first edit to that file in this stretch of work and it is deliberately a two-line one:
  constants moving to a shared module is not the track A/track B merge that T-04 describes.
- **The night end of the palette is a judgement call, not a derivation.** `DARK` aims Grimoire's
  colours at Cracktro's family (`gold` → `RED`, `dim` → `DEEP`) so the two Faces meet rather than
  collide, but the specific hues are taste and can move without anything else moving.
- The gauge is drawn in both Faces. In Cracktro it is always at the end of its track by definition,
  which is what makes it read as the same object that has been crossing all along.
