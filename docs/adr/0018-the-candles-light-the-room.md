# The Candles light the room

The room's light is **four pools in the dark**, not a three-point studio rig with candles drawn on
top. The key is a **SpotLight standing where the Candles stand**; `fill` is gone; the cold rim
became **the moon**, which does not go out. The Candles, the two globe lamps and one picture light
carry the room, and the numbers behind all of them were **fitted against measurements taken off
Fernando's reference image**, not chosen by eye.

This reverses the rig ADR-0010 and ADR-0011 assumed and that T-07 built shadows on. It does not
touch ADR-0006: the lights still go out one at a time, on the same ramps, in the same order.

## The brief

Fernando, sending `roomexample.png` and then: *"the img is just a reference of how to populate the
room and how it should look like (the models more quality wise and realistic)."*

So: not a shot to copy. A fidelity bar.

## What the reference actually is

Measured, not described:

- **Mean luminance 21/255.** The whole frame averages 8% grey.
- **81.9% of its pixels sit below 32.** Four fifths of it is functionally black.
- **p50 15 · p90 43 · p99 120.** One pixel in a hundred is above mid-grey; 255 appears only in the
  candle flames.
- **Centre-to-corner falloff of roughly 30:1** — centre cell 58, top-right corner 1.9, ceiling 6.5.

A 16x9 cell map of it shows the structure plainly: a bright core on the Altar (cells at 71, 95, 80),
a pool at the credenza lamp (66, 56), a pool at the pedal-cabinet lamp (41, 34), the cold window, and
between them nothing above 20. Four pools in a black room.

## What we had

The same measurement, run against our own rig at eight sample points around the room, decomposed by
source:

| sample | ambient | environment | key | fill | rim | candles | globes |
|---|---|---|---|---|---|---|---|
| Altar top | 3% | 31% | 32% | 15% | 16% | **2%** | 0% |
| far wall | 4% | 39% | 46% | 10% | 0% | 2% | 0% |
| panels | 3% | 33% | 39% | 8% | 0% | 0% | 17% |

**The Candles were contributing 2% of the light falling on the Altar they stand on.** Environment
plus key plus fill carried 94%, and not one of those three falls off with distance. The consequence
shows up in the totals: every sample in the room, from the Unit's face to the far wall eleven units
back, landed within **1.5x** of every other.

A room lit to within 50% of itself everywhere is the definition of flat. That is the "CG look", and
it is why no amount of ornament, roughness variation or shadow work was going to fix it — those were
all being applied to a surface already flooded with even light.

The first read of this was wrong and worth recording: comparing our sRGB pixel values against the
reference's *looked* like the falloff was wrong too. It is not. Inverting both back through ACES and
sRGB to linear shows our **distribution** was within 1.0–1.7x of the reference nearly everywhere. The
fault was never the shape of the light. It was that the shape was being drawn by the wrong
instruments — ones with no falloff — and at four times the level.

## Why a spot and not a point

The comment that put three directionals here was right about the cost: three point lights would need
three **cube** maps, six renders each, on a machine that is already struggling.

A **SpotLight** settles it. Three.js gives it one 2D shadow map — exactly what a DirectionalLight
costs — so the perf argument is satisfied either way. What the cone buys is **confinement**. A
directional key bright enough to model the Unit necessarily lights every square metre of floor behind
it at the same intensity, because parallel rays do not attenuate. The fit could not get the room's
corners below 15/255 while a directional key was in it, at any intensity. With the cone they land at
4, against the reference's 1.9–6.

The moon goes the other way and stays directional, because that is what it physically is: parallel
rays from 384,000km, and the one source in the room that is not a flame. It no longer rides a Candle
ramp. The room ending on the moon and the Screen is the point of the rite.

## The rite is performed by the Candles now

Previously `rim` died on the first ramp, `fill` on the second, `key` on the third — three lights the
visitor cannot see, standing in for three she can. The Candles were along for the ride at 2%.

Now the Candles carry 54% of the Altar and the staging is theirs. `key` rides the last ramp with the
last Candle because that is the Candle it stands for. Same ramps, same order, same `light.js` — so
the Screen still travels on exactly the schedule the room darkens on (ADR-0016).

## The numbers are fitted, and that is not the same as right

`exposure .46 · env .31 · key 10.6 · moon .08 · candle 2.52 · globe 1.29 · picture 14` came out of a
coordinate-descent fit against twelve sampled luminances, with the environment capped (it stands in
for bounce, and a uniform term cannot fall off into a corner the way real bounce does) and a penalty
forcing the Candles to carry the Altar.

They have arithmetic behind them. They have **nobody's eyes** behind them, and the model is
diffuse-only — it knows nothing about the specular highlights that are most of why the reference's
monitors read at 28. Two samples it cannot reach honestly are recorded here so they are not
rediscovered: **monitor fronts 6 against 28**, and **far wall centre 5 against 13**. The picture
light is level with the monitors in z, so a front-facing surface takes nothing from it; that is
placement, not intensity, and no amount of turning it up moves it.

`__unit.setLight({ exposure, env, key, moon, candle, globe, picture })` is how these get judged.
`exposure` is the one to move first if the room is simply too dark on his display — it does not
disturb the balance underneath it.

## Consequences

- Anything added to the room from here has to bring **its own light** or sit near something that
  has one. There is no longer an ambient floor that makes new geometry visible for free. That is the
  point, and it will feel like a cost the first few times.
- The far corners are now genuinely dark. Detail built there is detail nobody sees — the
  `ornamentMask()` lesson, one room larger.
- `env` at 0.31 is still a uniform term standing in for GI, and it is the remaining flatness. If the
  room ever reads *almost* right but slightly lifeless in the corners, that is what to cut.

## Amendment, same day: the fitted level was wrong

Fernando, on the first build: *"its too dark, the vigil is too dark and its very heavy its getting
stuck a lot, also the result of the room isnt satisfying."*

He is right, and the fault is in the target, not the fit. **The reference is a path-traced still.**
It can sit at mean 21/255 and still read because it has global illumination filling its shadows,
bloom spreading every practical, and a static frame's full dynamic range. Our renderer has none of
those three. Matching that histogram in a real-time forward renderer does not produce tenebrism, it
produces mud: the shadows have nothing in them, the sources do not glow, and everything between 4
and 15/255 collapses into one flat black.

A reference image's **structure** transfers. Its **absolute levels do not**, unless the renderer
producing them can do what the reference's renderer did.

So the structure stands — the spot, the Candles carrying the Altar, the moon that does not go out,
the confinement — and the level came back up:

`exposure .85 · env .40 · key 17 · moon .42 · candle 4.4 · globe 1.7 · picture 11`

The Altar now sits at roughly 147/255 with the Candles carrying 59% of it, the panels at ~105, the
far wall at 15 and the dead corners at 12. Brighter than the reference everywhere, deliberately, and
still ordered the way the reference is ordered — the Altar is the brightest thing in the room and
the corners are the darkest.

The moon went from 0.08 to 0.42 and turned colder. That is what fixes "the vigil is too dark": when
every flame is out, the moon and the Screen are all that is left, and at 0.08 that was nearly
nothing. A night room lit by a full moon is *readable*, and his reference's window says so.

## Amendment: what was actually heavy

Not the lights. The **Screen**, and by a wide margin. Every frame it redrew its 320x180 buffer,
upscaled to 960x540, ran a `blur(4.8px)` across the whole of that for the phosphor bloom,
composited three more full-canvas layers, and re-uploaded a 2MB texture — a software gaussian and
~120MB/s of upload, every second, underneath the scene.

It is a CRT. It runs at **24fps** now, independently of the room, and gives back better than half
the frame budget for nothing visible.

The second cost was `devicePixelRatio` at 2.0, which is **four times the fragments** of 1.0 — every
shadow lookup and PBR evaluation, four times over — on a scene that is dark, soft and largely
textureless, which is where supersampling shows least. Capped at 1.5.

`setQuality` is rebuilt around these two rather than around shadows, which were never the expensive
part: `2` crisp (ratio 1.5, Screen 24), `1` cheap (ratio 1.0, Screen 15), `0` survive (ratio 0.75,
Screen 10, no shadows).

## Correction: the decomposition above omitted the two largest lights

The table earlier in this ADR — the one showing the Candles at 2% and blaming `environment`, `key`
and `fill` — is **wrong**, and the way it is wrong matters more than the number it got right.

The scene contains two directional lights that the analysis never enumerated:

```
skyLight   DirectionalLight(0xFFE4BC, 3.2)   window → room, vigil 3.2 → 1.1
wallWash   DirectionalLight(0xC8B79A, 0.5)   room → far wall, vigil 0.5 → 0.3
```

`skyLight` at 3.2 was the **largest single light in the scene** and is nowhere in the fit. Both are
declared six hundred lines below the rig, next to the window they belong to rather than next to the
lights they are, which is how they were missed — and neither goes out with the Vigil.

Re-run with them included, they carry **38–74% of every surface in the room**:

| sample | candles | skyLight + wallWash |
|---|---|---|
| Altar, by the Candles | 35% | 41% |
| Altar, far corner | 4% | 70% |
| far wall centre | 4% | 50% |
| floor, front corner | 1% | 74% |

So the diagnosis was right and the treatment missed. The room **is** flooded with falloff-free
light — more of it than was claimed — but `fill`, `rim` and `ambient` were the small ones. Removing
them changed little, and the two that actually do the flooding were never touched. The Candles are
carrying 4–35%, not the 54–59% recorded above.

The remaining flatness has a name now and it is `skyLight`. Nothing in this file should be trusted
over `prototype/light-fit/verify.mjs`, which now reads both of them out of the source.

**The lesson worth keeping:** the fit was precise, reproducible, reported confident numbers, and was
answering a question about a scene that did not exist — because its inventory of lights came from
reading the rig block instead of from grepping for every `Light(` in the project. A model is only
ever as honest as its inventory, and an incomplete one fails loudly in the wrong direction: it looked
*more* rigorous, not less.
