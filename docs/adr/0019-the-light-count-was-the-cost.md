# The light count was the cost

The scene was rendering a frame in **108ms**. It now renders the same frame in **7.4ms** — a
**14.6x** speed-up, measured at the same buffer size on the same machine. Nothing was removed from
the room. What changed was the **number of lights the shader loops over**, and two material features
that multiply that loop.

Everything ADR-0018 and the session before it did for performance — the Screen's frame rate, the
pixel ratio, the shadow map, restricting shadow casters — addressed real waste and **none of it was
the problem.**

## How this was found, after four rounds of not finding it

Fernando, four times, in escalating words: *"its very heavy its getting stuck a lot"*, then *"its very
heavy still, everything is laggy"*, then *"i dont understand"*.

That last one is the important one. Four rounds of confident, plausible, source-read diagnosis had
produced four fixes and no improvement, and the explanations had got longer each time. The loop only
broke when the guessing stopped and the scene was measured in a real browser.

**Every measurement contradicted the guess:**

| what was assumed | what the machine said |
|---|---|
| retina panel, `devicePixelRatio` 2, so fragments are 4x | dpr is **0.667** — the browser is zoomed out. The pixel-ratio cap did nothing. |
| the scene is geometrically heavy | **150 draw calls, 77k triangles.** Trivial. An M1 Pro draws that in 1–3ms. |
| shadows are expensive | switching them off made it **slower** (shader recompile), and they were never significant |
| the Screen's blur and upload dominate | real, worth fixing, and a small fraction of the frame |

The decisive test was scaling the drawing buffer: 1.29 Mpix cost 37ms, 0.02 Mpix cost 15.6ms. Sixty
four times fewer pixels and it barely moved — so there was a large fixed cost per frame *and* a
per-pixel cost of ~83ms/Mpix, on a GPU that should manage about 1.

## What it actually was

Reading the scene graph rather than the source:

```
15 lights   ·   161 MeshPhysicalMaterial   ·   36 meshes with clearcoat   ·   3 transmissive
```

Toggling each live, against a re-measured baseline every time:

| change | frame time | saved |
|---|---|---|
| baseline | 108ms | — |
| hide the 3 lights already at intensity 0 | 71.7ms | **34%** |
| transmission off (3 candle stubs) | 65.2ms | **41%** |
| clearcoat off (36 meshes) | 40.2ms | **66%** |
| 15 lights down to 3 | 13.9ms | **87%** |
| all of the above | 13.4ms | **88%** |

**The light count was the whole story.** three.js does not cull lights per object or per fragment.
Every visible light is packed into the uniform arrays, `NUM_POINT_LIGHTS` is compiled into the
shader, and every lit fragment loops over all of them — whatever their intensity, however far away
they are. Fifteen lights across 161 physical materials at 1.3 million pixels is tens of millions of
BRDF evaluations a frame.

Clearcoat multiplies that loop by adding a **second specular lobe per light**. Transmission is worse
than a material property: it makes three render **the entire scene again** into a transmission buffer
so the surface has something to refract.

## The three fixes

**1. A light at intensity 0 is not a light that is off.** It costs exactly what a lit one costs.
Three lights sat parked at 0 for most of the piece — the Moon Deck's lamp before the Vigil turns, the
phosphor rake until the last Candle dies, the summoning light while the Plinth is empty. They were a
third of the frame and **not one pixel on screen**. Intensity now goes through `dim(light, v)`, which
sets `visible` with the value and takes the light out of the shader rather than multiplying by zero
fifteen times per pixel.

**2. Clearcoat survives only on the Plate.** It was on eleven materials and thirty-six meshes, and on
a metal it was buying nothing to begin with — metals have no dielectric coat unless lacquered, and
every one of these already ran `metalness` near 1. The two worst were the **floor and the Altar top**,
which between them are most of the screen. Slightly lower roughness reads the same. The Plate keeps
its, because lacquer over engraved metal is the reason it reads as a faceplate.

**3. The candle wax is a `MeshStandardMaterial`.** `transmission: .35` on three stubs a few pixels
wide was charging a whole extra scene pass for translucency nobody can see at that size.

## What did not change

The room. Every object, every texture, every shadow, the whole furnishing — untouched. Screenshots
before and after are indistinguishable. This was pure waste, not a quality trade.

## Consequences

- **Adding a light is the most expensive thing anyone can do to this scene**, and the cost is paid by
  every lit pixel whether or not that light reaches it. Before adding one, ask whether an existing
  one can move.
- Never set a light to intensity 0 and leave it in. Use `dim()`.
- `MeshPhysicalMaterial` is the default here out of habit — 161 of them against 3
  `MeshStandardMaterial`. Physical is materially heavier even with every extra feature switched off.
  Converting the ones that use no physical feature is the next win, and it is a large one.
- **Measure in the browser before optimising.** Four rounds of source-reading produced four correct
  observations about waste and zero improvement, because none of them was ranked. Twenty minutes of
  `renderer` instrumentation ranked all of it in one pass.

## Note on the harness

`__unit.perf()` from ADR-0018 could not produce any of this: it is driven by `requestAnimationFrame`,
and Chrome throttles rAF to nothing in a **hidden** tab — which is what an automated tab is. It never
completed. What worked was calling `renderer.render()` in a tight loop and forcing GPU completion
with a 1-pixel `readPixels`, which needs no frames at all and has no vsync quantisation. Any future
measurement here should do the same.
