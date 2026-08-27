# Handoff — Fer Bittencourt portfolio ("Tenebrae")

**Date:** 2026-08-27 · **Repo:** `~/Documents/fernando-portfolio` · **Branch:** `lyra`
**Language:** Fernando writes EN and PT-BR; reply in whichever he used last (last was EN).

## Read this first

**Seventeen ADRs**, five of them reversals. `CONTEXT.md` is the glossary and it is current as of the
last commit. `docs/tickets/README.md` is the board. This file does not repeat them.

**Everything from this session is committed** — seven commits, `45be78c` through `b25d416`, working
tree clean, `npm run check` clean, 41 tests passing. Read the tree; it is HEAD.

Nothing is pushed. T-14 is still Fernando's call.

## TWO THINGS THAT WILL WASTE YOUR DAY

**1. The repo lives in `~/Documents`, which is iCloud-synced, on a disk at 98% with 9.1Gi free.**

macOS evicts file *contents* to iCloud when the disk is low, leaving `dataless` stubs. Every read then
faults over the network. Yesterday that meant `vite` and `esbuild` hanging with no output at all,
`npx vitest run` taking 833 seconds, a twenty-minute window where every file returned
`Operation timed out`, and eventually `ENOSPC` — which makes *every* tool call fail.

Today it was quieter, but a `vitest` run still took **268 seconds of pure jsdom setup** on one
occasion and **445ms** on another, with no change to the code between them. That is the disk, not the
tests.

**Do not run `brctl download .` on this repo.** It queues `node_modules`, saturates the `bird` daemon,
and fills the disk. It turns a slow repo into an unusable one.

Mitigation in place: **both** test files now carry `@vitest-environment node`
(`prototype/screen/reaction.test.js` and `src/content/modules.test.ts`). The repo default is jsdom.
Add the pragma to any new test that does not touch the DOM — it is the difference between 400ms and
four minutes.

**The real fix is to move the repo out of `~/Documents`** — `~/dev/fernando-portfolio`. It has now
been raised four times across three sessions. It is his call and he has not made it.

**2. Do not open the browser yourself.**

`open http://localhost:5174/` spawns a tab rendering a heavy WebGL scene and **lags his machine** —
he said so directly on 2026-08-27. Start the vite server if it is not running, verify with
`npm run check` and `npx vitest run`, then *tell him what to reload*. Do not open it.

## What you actually have to verify with

You cannot see. The Chrome extension is **not connected** — `tabs_context_mcp` returns
"Browser extension is not connected" and every browser tool with it. Fernando is the only pair of
eyes on this project. Three things follow:

- **`npm run check`** bundles both entry points through esbuild. It catches syntax errors, duplicate
  declarations and broken imports across the whole graph in about a second. Run it before handing
  anything over. It caught a duplicate `const glass` that would have killed the entire scene.
- **It will not catch anything geometric.** A mesh facing the wrong way, an occluded panel, a wheel
  overhanging the Plate — all valid code. Two full rounds were lost to exactly this today.
- **Build the geometry in Node and print it.** `three` is in `node_modules`; a ten-line script that
  constructs a geometry and prints its UV range, normal directions and bounding box is the closest
  thing to eyes available. That is how the missing faceplate was found. It only works from inside the
  repo — Node will not resolve `three` from the scratchpad.

**Arithmetic is verification.** Every proportion problem today was found by computing clearances
before touching the file, not by looking.

## What happened this session

Long session, almost all of it on the Unit and the room.

1. **The light travels.** The Screen no longer flips at Vigil 0.94 — palette, a celestial gauge and
   Lyra's own tones move continuously from Vigil 0, driven by `dusk()` off the Candles' own ramps.
   The *layout* still swaps at the threshold, which is what keeps a Face a Face and not a palette.
   `prototype/light.js` owns the ramps; `scene.js` and the Screen both import it (ADR-0016).
2. **The two Screens became one.** `prototype/screen/render.js` is the Screen; `screen.js` is only a
   bench. The Unit renders the same 320x180 buffer through `display.js` and uploads it. This was the
   Screen half of T-04.
3. **Works are summoned to a plinth** (ADR-0017). Click a row on the Screen, the room puts itself out,
   a Work assembles on a plinth beside the Altar, and the Screen becomes its plaque. Sun or a second
   click sends it back and hands the Vigil to the visitor.
4. **Lyra hangs on the wall** — gilt frame, engraved plaque, faintly self-lit so she survives full
   Vigil. A fixture, deliberately not where Works go.
5. **Fernando's faceplate went on** (`prototype/ornament/plate.png`). The Plate took the artwork's own
   1.82 aspect, which is also what bought the width for bigger Decks *and* a bigger Screen.
6. **The Screen is set into the Chassis** — a real aperture through Chassis and Plate, walls, a milled
   and beaded rim, glass.
7. **Proportions are one block.** The Decks were overhanging the Plate and 24% larger than the circles
   drawn for them; the Pad row was wider than the Screen.
8. **The Decks are pierced Gothic tracery** lit from behind, from his `circle` are.na channel.
9. **The room is a studio, not a chapel** — acoustic panels, monitors, credenza of records, pedal
   cabinet, two globe lamps that die with the Vigil (from his `roomexample.png`).
10. **Shadows** (T-07). Only the key casts, framed tightly on the Unit.

## Four bugs worth remembering, because they will recur

- **A mesh can be perfect and invisible.** `plateGeom()` bakes its own `rotateX(-90°)`; the old
  `face.rotation.x` was left in place, so the Plate's printed layer faced the floor and was
  backface-culled. Symptom: "the faceplate design is missing."
- **Recessing a thing without cutting a hole for it hides it.** The Screen went to `y=.272` under a
  solid Chassis (top `.340`) and a solid Plate (`.353`). Symptom: "the display is just black."
- **`metalness: .85` makes albedo a reflection tint, not colour.** Printed colour on the Plate was
  invisible until it got a `metalnessMap` dropping the ink to a dielectric.
- **`ornamentMask()` is the only source of relief.** `faceMaps()` also builds a height canvas that
  **nothing reads**. Ornament drawn only there is ornament nobody sees.

## State of the Unit

- Plate 5.94 x 3.26 (the artwork's aspect, no stretch). Decks r .93 at x ±1.99. Screen opening
  1.84 x 1.035, 31% of the Plate. Pads 89% of the Screen's width. All in the `PROPORTIONS` block near
  the top of `scene.js`, with the reserves derived from it.
- Live dials on `window.__unit`: `setEng` (`print`, `scrim`, `art`, `artFit`, `foliate`, `invert`),
  `setDisplay` (`scan`, `comb`, `bloom`, `vignette`, `sheen`), `setScreen` (`emissive`, `roughness`,
  `glass`), `setQuality` (2 crisp / 1 cheap / 0 shadows off). They exist because nothing here can be
  set without eyes, and they let Fernando answer instead of describing.

## Open, in rough order

1. **Nothing since the shadows pass has been seen by anyone.** The whole room — panels, monitors,
   credenza, lamps, shadows, roughness variation — was built blind. Get him to look before building
   more on it. If shadows landed, bloom and the window compound; if not, more effects make it worse.
2. **The Decks are rejected.** "the wheels are not nice" (2026-08-27), parked at his request. Unknown
   whether the *idea* is wrong (pierced stone) or the *execution* (too fine at ~190px, wrong
   material, wrong motif). Render four variants side by side rather than iterating one at a time.
3. **The window is still a Gothic lancet** with tracery and velvet curtains. His reference has a
   round-arched one with a muntin grid, a full moon and bare branches. Big read at the top of frame.
4. **Bloom.** `three/examples/jsm/postprocessing` ships inside the `three` package, so it is not a new
   dependency under ADR-0004. Candles, phosphor and Deck tracery all want it. Costs a full-screen pass
   on a machine that is already struggling.
5. **Two models is undecided.** He said Grimoire and Cracktro "should be two different models, cause I
   really love them both." The Unit is pinned to Grimoire and Cracktro is unwired but intact in
   `render.js`. **No ADR written** — it would reverse 0012, 0015 and 0016, and that needs his
   decision, not my guess. My suggestion on the table: ship Tenebrae as the Grimoire model and make
   the Cracktro instrument Project 002, which turns scope into content.
6. **Lyra's bubble** is plain and occludes the Module. He asked for it to be ornamental and to stop
   covering things. Not done — it was about to move files, and now it has.
7. **The Crossfader is idle inside PROJECTS.** It carries Now/Next and nothing else (ADR-0005).
   Leaving it idle is defensible; giving it a job is a decision, not an implementation.
8. **`src/App.tsx` is still 11 lines.** Two full sessions in the prototype. T-02 has not moved.

## Blocked on Fernando

- **The real Works** (T-13-adjacent). He has "some websites and some posters"; `WORKS` holds four
  stamped PLACEHOLDER stand-ins. They must be replaced before publishing, not quietly kept.
- **RACK contents** (T-13) — slot 4 still lists influences, not tools. Blocked three sessions.
- **Publishing the repo** (T-14).
- **Moving out of iCloud.** Highest-value item on the list and still unmade.
- **His own voice.** Ident, Method, and Lyra's six lines are mine. They are honest and they are not
  his.

## Cautions

- **Build and show. Descriptions do not land.** Confirmed again, all session. Every decision that
  stuck was settled by a render or a reference image, never by a paragraph.
- **He answers with images.** Three arrived in one session — a full CDJ render, a flat faceplate, a
  room. Check `~/Downloads` when he says "I have a reference"; verify the file is what it claims
  (a `.png` was a GIF once), and read the whole thing before assuming which parts apply. He will say
  which — "it should be considered just the faceplate."
- **His references carry more than he asks for.** The faceplate's 1.82 aspect was the answer to a
  proportions problem he had not asked about. Measure them.
- **Give him the thing, not a toggle.** Confirmed twice now.
- **Do not add dependencies** (ADR-0004). When Node could not decode a PNG the answer was 120 lines on
  `zlib`, not a package.
- **He moves fast and reverses himself.** Five ADRs are reversals. When he changes direction, write
  the ADR — do not just change the code, and do not re-litigate the old one.
- **When he says something is broken, believe him and go find the mechanism.** Every "it's missing" or
  "it's black" this session was a real, specific, findable bug — never a taste disagreement.
