# Handoff — Fer Bittencourt portfolio ("Tenebrae")

**Date:** 2026-08-28 · **Repo:** `~/dev/fernando-portfolio` · **Branch:** `lyra`
**Remote:** https://github.com/fernandolinck3/tenebrae · **Live:** https://fernandolinck3.github.io/tenebrae/
**Language:** Fernando writes EN and PT-BR, often in one message; the *product* is PT-BR.
Reply in whichever he used last (last was mixed, leaning PT-BR).

## Read this first

**Twenty-three ADRs**, several of them reversals. `CONTEXT.md` is the glossary.
`docs/tickets/README.md` is the board. `docs/realism-budget.md` is the plan for adding to the room
without spending the frame. This file does not repeat them.

**There is uncommitted work.** Six modified files and one new directory, all from the 2026-08-28
session and all verified in a browser — see *"What changed on 2026-08-28"* below. It was left
uncommitted deliberately: he was mid-judgement on the Decks when the session ended. Read that
section, then either commit it or take his ruling first.

**T-14 is done.** There is a remote, the work is backed up, and the site is live:

> **https://fernandolinck3.github.io/tenebrae/**

`.github/workflows/pages.yml` builds and deploys on every push to `lyra`, which is the repo's
default branch. The workflow runs `npx vitest run` and `npm run verify:site` before it uploads — the
content tests guard what the site claims about Fernando, and a build that breaks them should not
reach the web. Custom domain when he has one: a `CNAME` file in `dist-site` plus DNS.

The Claude Artifact from earlier the same day is still live at
`https://claude.ai/code/artifact/cc6c648f-de43-4462-b796-0b099d6740f5` and is a **second copy that
can drift**. GitHub Pages is canonical now; if the Artifact is kept, republish it from the same
build (see the packer note below) whenever Pages moves.

## The goal he actually stated

> *"i need a version online of my portfolio asap"*

That is the frame for everything below. It is closer than it has ever been — the build works and
produces a real site — and the only thing left is somewhere to put it.

## What changed on 2026-08-28, afternoon — pages, stars, and a measured jog

All uncommitted, all verified in a real tab.

### Scrolling lasted one build; the Screen pages again (ADR-0025)

**ADR-0024 was superseded the day it was written**, and the file is kept rather than rewritten
because the wrong diagnosis is the useful part. He said the body felt *"cluttered"*; that was read
as *not enough length* and answered with a scrolling column. His next words were *"ele tá em um
espaço muito enclausurado"* — the same complaint, about the same 200px strip.

The constraint was never length. It was **width**: the body has always been what is left beside
LYRA, because every Module until now drew a list next to her.

So: **page 0** is the lead and the item list (where the MOON works); **pages 1..n** are the selected
item's case, one to a screen, in the **full width**, hanging off the header rule. The SUN turns
them; turning back past the first page is the way back to the index, so there is no extra control.

Two things worth not undoing:

- **The renderer paginates, not the content.** A section is up to five 58-character lines, which at
  13px VT323 across the full width wraps to about ten; six rendered lines fit a page. So sections
  flow into as many pages as they measure, a heading always starts a page, and `pageRange()` — the
  count, written by the draw — is what the controller clamps against. Overflow on a case page is now
  structurally impossible.
- **On a page LYRA goes behind a near-solid scrim and her bubble is suppressed.** She is the reason
  the full width exists; bubble text at 12% under body text at 100% is the PROJETOS legibility bug
  again, and a scrim does not save it.

`SCREEN_BUDGET.section` stays a hard cap on the *writing*, and the tests still assert it. It is no
longer a promise that a section fits a screen — the renderer guarantees that — it is a promise that
a section stays a readable unit.

### The ECLIPSE lamps were buried, and the fix is a measurement

They are seven stars now, between the display and the Pad labels. The first cut **did not render at
all**: the Plate's top face is at `y = .352` and the stars topped out at `.3475`. The old slabs got
away with `y: .332` only because bevel plus depth came to `.030` and pushed them proud by accident.
`LED.y` is now the measured face. If a small part vanishes on this object, check it against the
Plate height before checking anything else.

`RESERVES` needs `LED` at module-evaluation time, so the constant lives with `PAD`/`FADER`/`WHEEL`
and only the meshes are built further down.

### The jogs work, and the first test that said otherwise was wrong

Worth recording because it nearly became a bug hunt. A 180° sweep of the MOON changed nothing —
because it was swept in the direction that clamps at item 0. All three SUN inputs and both wheels
verified: MOON selects, SUN turns pages by drag, by wheel over the SUN, and by wheel anywhere on the
object.

`__unit.nav()` was added for this: `{ page, sel, sec, pages }`. Until it existed the only way to see
whether a control had done anything was to read a 320×180 texture out of a screenshot, which is how
a dead wheel could survive a session.

`SUN_NOTCH = 0.68`, nearly double `NOTCH`. One SUN notch used to be 46px of scroll and is now a whole
page; a control should cost about what it moves.

### Smaller, same session

- The footer draws its own cleared band. LYRA stands to the floor of the panel, so on four Modules
  her robe was behind the status line and `CAMADAS 01/04` came out as broken glyphs.
- Page marks live on the footer rule, drawn after the status so its scrim cannot wipe them; the
  `+N` overflow warning shifts left of them.
- The last English LCD strings are Portuguese: `BACK ·` → `VOLTAR ·`, `OPEN ·` → `ABRIR ·`,
  `NIGHT/TWILIGHT/DAY` → `NOITE/CREPÚSCULO/DIA`.
- Turning the SUN in PROJETOS says `APERTE O CENTRO DO SOL PARA ABRIR` instead of `SEM PÁGINAS`,
  because those cases live in the overlay and a reader turning the wheel is reaching for one.

### Two content contradictions found, not touched

- **QUEM has no items**, but LYRA's idle line there is *"A LUA escolhe o item. O SOL revela mais."*
  Both wheels are dead in that Module. `modules.test.ts` asserts every non-CONTATO idle names the
  LUA, so the rule and the content disagree — the test is enforcing the lie.
- The name still differs: the boot screen says **Fernando Bittencourt**, QUEM says **Fernando
  Linck**. Open across several sessions.

## What changed on 2026-08-28, evening — his six-item list

### The wheels have no button, and they have weight (ADR-0026)

Four changes to one control, and they only make sense together.

- **The hub press is gone**, both wheels, and every mention with it — *"remova a necessidade de
  clique das jogs por enquanto e quaisquer menções."* A control that did two unrelated jobs by
  radius is a control you have to be taught. Back is now `Esc`, the touch row, and a click anywhere
  on the Unit while a Work is open; opening is a click on the Screen row, `Enter` on the focused SUN,
  and the touch row.
- **Both platters drift.** They used to drift *against the Vigil* — Sun at `-.04 * (1 - vigil)`,
  Moon at `.04 * vigil` — so the Moon stood perfectly still all day. Exactly what he saw: *"sol está
  certo mas lua não."* Both turn now; the Vigil only decides which leads.
- **A thrown wheel coasts and keeps selecting.** `spin` bleeds off at `FRICTION` per second and
  spends detents the whole way down, so a flick runs a few items on and slows into place.
- **The detent is visible.** Each Deck now holds `turn`, `carry` and `spin`, and the displayed angle
  is `turn - PULL * carry`. Between notches the platter lags the hand and catches up as the notch is
  spent, which is the snap; draining the carry when the coast dies *is* the settle. Nothing else in
  the file writes `group.rotation.y`.

This partly reverses the "detented selector, no coasting" argument that was commented in `scene.js`,
so it is written down: **ADR-0026**. The distinction that survives is *no uncontrolled selection* —
the coast is the hand's own velocity decaying, not a flywheel inventing steps, and the drift never
touches `carry`, so a Unit left alone turns its wheels and selects nothing.

### The ECLIPSE is opened by the light now

The old trigger was a seventh detent past the end of the MOON's list. He could not find it — *"não
consegui fazer o eclipse funcionar"* — and a secret nobody can discover is a bug with a story
attached. The six lamps now only **arm** it; what fires it is taking the fader all the way across,
and the direction picks the face: night → day gives the SUN, day → night gives the MOON. The middle
of the fader is not a band, so drifting around twilight cannot trip it.

The detent going also took its own trap with it: closing ECLIPSE used to leave the cursor on the
position that opened it. `SINAL 07` and `LUA · VOLTAR` are gone from the panel for the same reason —
they named a control that no longer exists.

### QUEM, and the lead as prose

Two fixes to one complaint. `m.lead` now holds **sentences, not lines** — it used to carry text
hand-broken at 58 characters which the Screen then broke again, and two breaks over one paragraph is
what produced *"Experimentos de ponta a ponta: da / pesquisa à / implementação e ao aprendizado."*
`SCREEN_BUDGET.lead.lineChars` became `paraChars: 96`, and a test now rejects a lead entry that
starts mid-sentence.

And **a Module with no items takes the whole panel**, the same treatment as a case page. The strip
beside LYRA exists to leave room for a list; QUEM has no list, so it was spending 120px on nothing
and was both the tightest column on the object and the only one overflowing it (the `+2` in the
corner was real). Paragraphs now have air between them, which is the space he asked for.

### The stars are four-pointed

Five was the wrong reading of the Plate — the artwork's own stars are four-pointed sparks, and a
pentagram in a row of them reads as a different symbol rather than a smaller version of the same one.
`starGeom` takes a point count; `LED.r` went `.0155` → `.0195`.

## What changed on 2026-08-28, morning

Six things he asked for, and three bugs found on the way. All of it is uncommitted.

### The Decks are his artwork now, not a drawing of it

**This is the biggest change in the file and the one most likely to be undone by accident.**

`deck-faces.js` went from 818 lines to 138. It used to draw both wheels procedurally — reeded rim,
medallion band, a rose window for the Sun, pierced tracery for the Moon, all struck onto one void
mask that three maps came off. It is gone. `public/decks/{sun,moon}.png` are crops of
`cross and jogs.png`, and the other two maps are derived from the pixels:

- **height** is luminance. Bone is the brightest thing in the picture, ground the darkest, so
  luminance already *is* the relief.
- **emissive** is derived **differently per wheel**, and this is not an inconsistency. The Sun's is
  `saturation² × value`, because its glass is saturated amber and its stone is near-grey bone — the
  palest pixel on that wheel is bone, which must not glow. The same gate on the Moon returns almost
  nothing, because nothing on it is saturated; the Moon's is `luminance³`, tinted cold by the
  material, because nothing burns *behind* the Moon and what lights is the stone catching what is
  left. Without that split the Moon goes out with the room and `deckGlow` stops meaning anything.

Consequences already handled, listed because each looks like a bug if you meet it cold:

- **The plate carries the whole wheel**, `WHEEL.r * .995`, not `.88`. The crop has its own reeded
  rim; the old inset existed so the metal ring underneath could play that part.
- **The hub mesh is deleted.** The reference draws the boss; a metal cylinder stood on top of it.
- **`bumpScale` 5 → 1.6.** A luminance map off a rendered illustration already contains its own
  shading, and driving it hard doubles every highlight the picture came with.
- **Sun glow gain 0.55 → 2.4.** Only ~1.4% of the new emissive map is strongly lit, against most of
  the old one. That number has now tracked lit area three times and has never been taste.
- **`deckMaps` returns textures immediately and fills them on load.** It is called during module
  evaluation and the scene is built around what it returns, so it cannot await.

**How this happened matters more than the code.** Four passes were spent reproducing the reference in
circle arithmetic — trefoil, then mitsudomoe, then trefoil again — each measurably closer and none of
them his drawing. His verdict: *"its not similar to the design i gave to you at all."* He was right
about the method, not the numbers. **When he gives a reference this specific, use it; do not
reverse-engineer it into geometry.** If a future ticket wants procedural wheels back, that is a real
trade — resolution independence, and tracery that could respond to the Vigil — but it is a decision,
not a cleanup.

### The Vigil no longer stalls, because the shaders are pre-warmed

*"the performance on the vigil (going to night) is affected a lot when one turns the jog."*

`dim()` clears `visible` once a light is dark — ADR-0019, and worth keeping. But the number of
visible lights is part of a material's **program key**, so every Candle going out recompiles every
material in the scene. Measured cold, sweeping the Vigil end to end:

    mean 55.6 ms/frame · worst 963 ms · five rebuilds · 46 → 100 programs

Turning a Deck drives the Vigil, so a jog turn walks straight through all of them. The compiles are
**one-time** — programs are cached by that key — so the whole problem is *when* the bill arrives.
`prewarmStep()` in `scene.js` pays it during the opening, one light configuration per frame. After
it: **mean 0.65 ms, worst 7 ms, no slow frames.**

Two things it got wrong first, both worth not repeating:

- **`renderer.compile()` warms the wrong programs.** It walks the scene against the default
  framebuffer; the frame goes through the composer, into a render target with its own colour space
  and tone mapping, and those are in the key too. It looked like it worked — 128 ms, program count
  up to 98 — and the sweep after it still stalled 4.2 s. The warm has to be a real `post.render()`.
  That is safe: it runs inside the same `frame()` that draws the real one, and the browser
  composites once per frame, so the wrong-Vigil draw is never presented.
- **An even grid of marks misses the thresholds.** Twelve evenly spaced left 875 ms at Vigil .55.
  The marks are found now — walk the Vigil finely with `applyVigil()` alone, which draws nothing,
  and record every distinct set of visible lights. Eight, currently, and it stays right if `RAMPS`
  moves.

`window.__renderer` is exposed for this: `renderer.info.programs.length` is the only way to see a
recompile from outside three. `__unit.prewarm()` runs it to completion by hand, because the frame
loop does not exist in an automated tab.

### The wobble was baked lighting, not the crop

The crop being off centre was real and fixed (below), and it was **not the whole of it** — he said
*"the jog designs are still wobbly"* afterwards. The crops are centred to the pixel and their rims
are round to about two, so the fault was elsewhere.

The reference is a *rendered illustration*. It has a key light from the upper left, a highlight along
that side of the reeding and a cast shadow down the other. Painted into a texture on a platter, that
lighting **turns with the platter** — the light source orbits the wheel once per revolution, and an
object whose highlight orbits it does not read as spinning, it reads as tilting. A photograph of a
lit thing cannot be spun.

`flatten()` in `deck-faces.js` divides it back out: estimate the smooth illumination field with a
wide blur and normalise by it, which is the flat-field correction a telescope does to its own optics.
Measured as the first harmonic of brightness around a ring — literally "which side is brighter" —
at 0.86 and 0.95 of the radius:

| | before | after |
|---|---|---|
| Moon | .189 / .243 | **.060 / .100** |
| Sun | .213 / .385 | **.183 / .171** |

The inner ring barely moves and should not: at 0.72 that is the medallion band, whose asymmetry is
twelve *different* moon phases — real ornament, which is supposed to turn.

Two failed versions, both instructive:

- **Leave the square corners in the blur** and the field near the rim is dragged toward the black
  Plate around the wheel, so the correction divides by far too little exactly where the reeding is.
  The rim came out *more* lopsided than uncorrected.
- **Fill the corners with a flat average** and the opposite happens: a constant dominates a 72px blur
  that close to the edge, the field flattens to it, and the gain lands on 1 — no correction at all
  where it is needed most. The fix is to extend the disc **radially**, each corner pixel taking the
  rim pixel at its own angle.

`bumpScale` was also still being driven to **4 → 9** by `applyVigil`, a line written for the old
drawn height map. On a luminance map off an illustration that doubles every highlight the picture
came with; it is 1.2 → 2.6 now.

### The navigation model was rebuilt (2026-08-28)

    Pads choose the Module. Moon chooses the Item. Sun explores the Item.
    Crossfader changes the light. LCD explains the action.

**The two swaps are the whole change.** The Decks used to drive the Vigil and the Crossfader used to
blend NOW/NEXT's thesis. Freeing the wheels is what let them take *different* jobs — while they were
a matched pair pushing one number in opposite directions, "Moon selects and Sun opens" had nowhere to
live. Freeing NOW/NEXT is what let both its lists be on screen at once, which the brief requires and
a control whose whole job was hiding one of them made impossible.

- **`modules.ts` has one shape now**, not four `kind`s: a `lead` that is always on screen, plus
  `items`, each with `sections`. `SCREEN_BUDGET` was re-cut per-part — the Screen carries a lead and
  at most one section, so ADR-0009 gets easier to keep, not harder.
- **Order is IDENT · WORKS · PATH · METHOD · NOW/NEXT · OUT**, asserted in the tests because
  reordering the array silently rewrites the argument the Unit makes.
- **Decks are detented selectors.** `NOTCH` is 0.35 rad and `jogCarry` holds the remainder; momentum
  and `spin` are gone. Clamped at both ends, not wrapped — a list with no edges cannot be counted.
- **Deck hubs are a radius test**, not a mesh. The boss is painted into the artwork; a hub mesh would
  have been a second boss on the first.
- **The plinth is unreachable.** `summon.js` and the rite still exist and nothing calls them — the
  overlay in `focus.js` is the one way a Work opens. Retiring the code is a separate decision.
- **Ambient has a 6% floor** at full Vigil. This deliberately softens the tenebrism, which argued for
  linear-to-zero; the brief asks for a readability floor and this is a portfolio before it is a
  painting. The room past the Unit still goes to nothing — `skyLight` and `wallWash` have their own
  curves.
- `__unit.paintScreen()` exists for the same reason `render()` does. **Do not inspect the Screen by
  importing `render.js` from the console** — you get a second module instance with its own selection
  state and read it while the scene drives the first. That produced a confident wrong answer once.

**Three bugs the first pass shipped**, all found by him and all worth the shape they took:

- **`pick()` returns the object, not the intersection.** `deckHubHit` reached for `hit.object` on a
  value that already *was* the object, threw on every wheel press, and killed the drag before it
  started — so both Decks did nothing at all. `lastPick` holds the whole intersection now, set where
  the answer is still in hand.
- **`screenRowAt` named a Module by an id that no longer exists** (`project-001`), and the unified
  body never called `drawWorks`, which was the only thing filling `workRows`. Between them the Screen
  went from the most obvious control on the object to inert. Rows are registered where they are
  drawn now, which is the only place that can stay true. Clicking a row selects **and** opens: a
  named project on a screen is a more specific selection than turning a wheel to it.
- **The painting vanished at night.** `E` carried the Print alone, so labels stayed legible on black
  and the artwork did not exist. The whole face goes into the glow map at low alpha now, composited
  `lighter` so the Print stays the brightest thing on it — the painting keeps a little of the light
  it was given, which is what the rest of the Print already did. Fixing this with room light instead
  would have flattened the tenebrism and lit the Altar with it.

**Content Fernando still owes**, structured and visibly empty rather than invented:

- WORKS: `CHALLENGE`, `DECISIONS`, `RESULT` per project. Declared as gaps; the tests assert they stay
  declared, so filling one is a content edit and deleting one is deliberate.
- PATH: `DETAIL` per role, and dates. **The order is his, not sorted** — the rows carry no dates, and
  sorting would mean deciding which of his jobs came last.
- METHOD: the six steps are the generic process the brief says to avoid. He was asked twice and said
  it does not matter; they stand in, with an empty `WHY` on each.
- `NOW_NEXT_UPDATED` is `null` and renders as a "set in modules.ts" state.

### There is a freecam in the workbench

`?debug` → **FREECAM**. Drag to orbit, wheel to dolly, shift-drag to pan the pivot, click again to
put the camera back. The readout beside it prints the angle in a form that pastes straight into
`__unit.setCam({...})`, which is the point as much as the flying is — the reason to fly the camera in
here is almost always to *find* a framing, and one you cannot read off has to be found again next
session.

`ORBIT` is still `const false` and still means what it meant: the shipped Unit has one angle, and
that is a decision. Freecam is a separate flag that only widens the clamps while it is on, so the
visitor's camera is untouched — verified: with it off, dragging empty space still skips the opening
and leaves yaw at 0. Enabling it skips the opening first, because two things steering one transform
is not a camera, and turning it off returns to the resting view rather than to a half-played flight.

### The faceplate painting is flat

*"remove the bevel and depthness of the faceplat painting."*

`ornamentMask()` used to push `ART` through as a shallow height field, on the argument that the
painting should read as printed on metal that has texture rather than as a flat sticker. What it
produced was every edge in the picture bevelled and every mass standing proud of its background — a
mountain range in embossed tin. The `useArt()` branch draws nothing now, so in art mode the mask is
empty and the derived normal map is flat.

The reference agrees: on the Old Blood pedal the artwork is **screen-printed**, dead flat, and the
only things with edges you can feel are the parts. Depth belongs to the machining, not the picture.

The Plate is not featureless — `roughnessMap` still carries the handled finish, `metalnessMap` still
drops the ink to a dielectric so its colour reads as colour rather than as a tint on a reflection,
and the clearcoat is still lacquer over metal. `reliefMaps()` and the `bevel`/`depth` dials are all
still wired, and the engraved band comes back with its relief the moment the painting is switched
off.

### The Unit lights itself at night

*"on vigil things are too dark. i feel the display could have some light (projecting to the cdj) and
the buttons and crossfader aswell."*

The Screen's `glow` already grew with the Vigil, but only the Plate, Chassis and rim had opted into
its layer — all that light was landing on three surfaces. The Decks, Pads and Crossfader opt in now,
which costs **no new light**: `glow` is one point light already in the scene, so the light count and
every program key are unchanged, which after the pre-warm business is the property that matters.
ADR-0020's discipline holds — it reaches the Unit's own top surface and nothing else.

The Pads' lamps and the Crossfader's now scale by `1 + vigil * 2.6`. A lit control is only lit
*relative to* what is around it, and at the end of the rite there is nothing around it; real ones do
the opposite, and the darker the booth the more the panel is the only thing you can see. The fader
cap also has its own emissive off its own map, so the bone lights and the groove stays dark.

### Wobble, third pass — and the fix was not the crop

*"the jog designs arent centered ... when the user spins de jog, it feels wobbly."* Two separate
causes, and the second is the one that mattered.

**The crop was out, and the tool was part of why.** `sips --cropOffset` semantics had been *assumed*
rather than verified across several passes. `scratchpad/crop.py` does it with explicit arithmetic —
decode, crop a square about a given centre, box-filter, encode — so the centre is a number in the
call rather than an argument order to be right about. Re-fitted **over the whole wheel** rather than
the rim band alone, because whole-wheel agreement is what perceived wobble actually is: the Moon was
3px out and **the Sun was 8px**. Residual after re-cutting is 2–3px of a 256px radius, where the
metric's minimum is shallow enough that further iteration just chases noise.

**But the larger cause was that the flat-field had been switched off.** It divides the picture's own
baked lighting back out, and without it a painted highlight orbits the wheel once per revolution —
which reads as wobbling rather than spinning. It had been disabled on a measurement that was real and
answered the wrong question: correcting the whole image made the **outermost** ring more lopsided, so
it looked like a net loss. That ring is the reeding — two hundred identical teeth, where a first
harmonic is mostly aliasing and nothing is legible enough to read as wobble anyway.

It now applies at 0.75 through the ornament and fades to nothing across `FADE` before the reeding.
Measured on the rings the eye tracks: Sun 0.183 → 0.061 and 0.275 → 0.101; Moon 0.117 → 0.058.

**Some residual is the artwork and always will be.** The Moon's medallion band carries twelve
*different* phase discs, so it is not rotationally symmetric by design; it measures 0.70 raw at that
ring and correction cannot help, because there is nothing wrong with it.

**The lesson worth keeping: optimising one number over the whole image hid this.** The wheel is not
one surface, and the ring that measures loudest is not the ring anyone looks at.

### New wheel art (2026-08-28, second pass)

`moonjog.png` and `sunjog.png` replace the crops taken out of `cross and jogs.png`. They are rendered
square, one wheel each, flat on, under light with almost no direction in it — and that single
property invalidated two corrections that had been earning their keep:

- **`RECENTRE` is zero on both.** The old Moon's triskele sat 5px off the centre its own rim wanted.
  Fitting the rim band and the inner figure separately on the new art puts them **1px apart on the
  Moon and 4px on the Sun**, out of a 590px radius — the Sun's is a third of a pixel at render size,
  and correcting it would cost more in resampling softness than it buys.
- **The flat-field is off.** It halved the outer ring's lopsidedness on the old plate crop, where a
  baked highlight turned with the platter. On the new renders there is no gradient to divide out, and
  measured it makes the **outermost ring worse** — 0.257 → 0.414 on the Moon, 0.210 → 0.367 on the
  Sun — because a 72px blur and a polar edge-clamp invent a slope near the rim where the picture had
  none. Both are kept in the code with the numbers written down, because they are the fix if the art
  is ever re-lit or re-cropped from a plate again. **A correction left switched on because it once
  helped is how a pipeline fills up with them.**

Fitting the rim: brightness does not find the edge on these (the reeded rim is *darker* than the
interior). Detail density does — angular standard deviation per radius collapses where the wheel
stops. Both come out at r = 590, identical, which is the check.

Relief was halved throughout on *"two much bevel and depth"*: normal strength 3.4 → 1.7, `normalScale`
0.75–1.5 → 0.45–0.85, `DISH` 0.006 → 0.0025, chamfer softened. The trap is setting a normal map by
whether the relief is *visible*: these are photographs of carved stone and **the carving is already in
the albedo**. The map's only job is to make it answer the room's light as the platter turns. Doubling
up reads as wax.

Load cost per deck is ~290ms — fetch 45, derive 79, blur 75, Sobel ~75 — about where it was, since
the flat-field's six blur passes came out as the normal map's two went in.

### The Decks are turned parts now, and the Moon's art was re-centred

Two asks: *"still not perfectly centered. is this a problem with the image ive gave you"* and
*"a little bit of bevel or indentation so they dont feel too flat or just a baked texture."*

**Yes, it was the image — on the Moon only.** Measuring each zone's own best centre separately: the
rim is dead centre, and the triskele inside it wants to sit **5px higher** — 2% of the radius. They
are not concentric in the drawing, so no crop can satisfy both, and the crop is fitted to the *rim*
because that is the longest, highest-contrast, most rotationally symmetric feature and the one whose
eccentricity shows most. `RECENTRE` in `deck-faces.js` slides the inner content back, on a smoothstep
falloff that reaches zero at r = 0.72 — so the reeding and the medallion band are untouched **by
construction**, not by luck. Measured after: the core's best offset went from (0, −5) to (2, 0). The
Sun disagrees by 2px, which is the limit of the measurement, and is left alone.

**Flatness had two causes, both fixed.**

- `bumpMap` derives its slope from screen-space derivatives, so the carving got vaguer the further
  away the wheel was — which is exactly the distance it is normally seen from. `normalFrom()` builds
  a real tangent-space normal map by Sobel over the height, blurred one pixel first because the
  source is a *photograph* and un-blurred grain becomes facets: hammered rather than carved.
- The face was a `CylinderGeometry` cap — one plane, one normal, identical light everywhere.
  `latheDeck()` gives it a profile: a chamfer round the rim, a step, and a 0.6% dish. The chamfer is
  what pays, being a ring of surface at a different angle that catches a highlight the flat cap could
  not — and one that *moves* as the platter turns.

Two traps in that, both already paid for:

- **`LatheGeometry` takes its profile's winding as its triangles' winding.** Written the natural way —
  face first, then down the side — the whole thing comes out inside-out and the face is
  backface-culled. It does not look missing when that happens, which is what makes it slow to spot:
  the polished ring underneath shows through and a Deck reads as a blank chrome disc with a specular
  dot. Same class as the Plate's `rotateX(-90)`.
- **A lathe generates its own UVs from arc length**, which smears the artwork into a bullseye. They
  are rewritten from each vertex's own x/z — the cylinder-cap mapping — which is what keeps the
  image's inscribed circle on the platter.

`applyVigil` was also still writing `bumpScale` after the material moved to `normalMap`. Setting a
property a material does not read costs nothing and reports nothing, so the Vigil had quietly stopped
deepening the carving at all. It drives `normalScale` now, 0.75 → 1.5.

### The Deck crops had to be fitted, not eyeballed

*"the arts are not centered on the circle of the jogs, causing them do wobble."* The first cut was
placed by eye and the Moon's was **20px out — 8% of the radius**: invisible in a still, unmistakable
once the platter turns.

Reading the edge off a screenshot cannot do better, and edge-detection is worse — it locks onto the
Plate's ornament outside the wheel. What works is minimising the complaint itself: every ring on the
wheel is rotationally symmetric about the true centre, so search for the centre that minimises
mean |I(p) − I(rot(p))|. Both wheels then measure **r = 253**, identical to the pixel, which is the
check — they are the same object drawn twice, and any fit returning two different radii has found
something else. Source centres: Moon (348, 421), Sun (1420, 422), in `cross and jogs.png` at its
native 1774×887.

### The Crossfader tracks the hand

It had mass: a spring to the pointer, momentum on release, a periodic detent well, a lean. Every part
was real physics and the whole was wrong — *"the crossfade sucks, it just should be a real crossfader
physic feeling, not bounce"* — because **a fader is not a free body**. Your fingers are on it the
whole time it moves. It now follows 1:1, the six beads capture it within 4.5% of the travel, and
letting go leaves it exactly where you left it.

The follow is a **time constant** (`FOLLOW_TAU`, 20ms), not a per-second survival fraction. The
fraction form reads as though small means fast: `1e-7` sounds instantaneous and is 24% of the gap per
frame, which is four frames of lag on something under your finger.

### The Pads stay black

All six keys wear one face in every state. The bone selected-face is gone; the state is in the lamp,
which changes **hue** — cold ember to gold — not just brightness. Two things that were not obvious:

- The LED texture is painted **white**. It is an emissive *map*, multiplied by the material's colour,
  so any hue baked in is a hue the material can only darken — which is why the old selected Pad had
  to go *dim*.
- The ring round the Pad's foot is deliberately quieter than the bar in its head. At equal intensity
  it is a cream halo the width of the key, and a black key inside a pale outline reads as a pale key,
  which is the exact thing he asked to remove.

`HOT CUE` and `CROSSFADE` are gone with their Print reserve; Pad labels have 15px of air under the
baseline instead of 6, and the reserve grew with it or the ornament fills the padding back in.

### Two bugs found on the way

- **`public/` had never resolved in the dev server.** `npm run prototype` was a bare
  `vite prototype` with no config, so Vite took `publicDir` to be `prototype/public`, which does not
  exist. Every Work still on the Screen was 404ing to the SPA fallback and coming back as
  `index.html` wearing a `.png` name. It went unnoticed because the *built* site has the override.
  The script now runs `vite --config vite.site.config.ts`, so dev and the build cannot disagree.
- **`deck-fit/index.html` asked for `pm.lit`**, which no longer exists, and threw.

### Still open from this session

- **He has not seen the image-based Decks.** Everything above was verified in an automated tab; his
  judgement is the thing missing. Show him first.
- The Sun's rosette and the Moon's triskele are now exactly his reference, which also means the
  wheels no longer change with the Vigil beyond glowing — the tracery cannot open or close.

## The build ships the prototype now

This changed on 2026-08-27 and it is the thing most likely to surprise you.

- `npm run build:site` → `dist-site/`, via `vite.site.config.ts`. **This is the real site.**
- `npm run preview:site` serves the built output.
- `npm run build` still builds the root `index.html` → `src/App.tsx`, which is **eleven lines and
  renders an empty `<main>`**. Every production build before this one was a blank page.

Three things that config needs, each of which fails *only in a deployed build*:

- `publicDir: '../public'` — Vite would look in `prototype/public`; the Works live at the repo root.
- `base: './'` — so the output runs from a subdirectory as well as a domain root.
- Work stills resolve through `BASE_URL` in `focus.js`, because `modules.ts` stores them as
  root-absolute `/works/…`, which would resolve past that subdirectory.

The workbench dials are hidden behind **`?debug`**. They stay in the DOM because `scene.js` binds to
each one by id and throws on the first missing element — do not delete them.

**This contradicts ADR-0002 and T-02**, which say `src/` owns the DOM truth layer. It was flagged to
Fernando and he has not ruled. **No ADR is written.** If he blesses it, write one; if he wants `src/`
to own it, T-02 is the ticket and the prototype is the reference implementation.

## What you can actually verify with

The Chrome extension is connected. **The single most expensive lesson of the last session is here.**

### rAF is dead in an automated tab

An automated tab is a *hidden* tab. `document.visibilityState === 'hidden'` and
**`requestAnimationFrame` fires 0 times per second.** Measured, not assumed.

This means the scene renders a few frames at load and then freezes. A screenshot will show a Unit
that looks basically right with a **blank Screen**, and it is very tempting to read that as a bug. It
is not. Half a session went into chasing it before `visibilityState` was checked.

**Do not debug a frozen scene. Drive it by hand instead:**

```js
const u = window.__unit
u.introStep(1)            // land the opening without waiting for it
u.setBoot(1)              // finish the Screen's power-on
u.setCam({ tilt: 4, dist: 4.0 })
u.render()                // draws exactly one frame — no rAF involved
```

`__unit.render()` exists for precisely this and updates the matrices first, because the last frame's
matrices cannot be trusted in a throttled tab.

### Canvas work needs no scene at all

`prototype/deck-fit/` draws the Deck and control maps straight onto a plain page. Canvas draws
**synchronously**, so throttling is irrelevant and you see the actual texture at full resolution
rather than a 190px disc on a Plate. Every proportion in the last session was fitted there. It is the
same instinct as `prototype/light-fit/`; use it, and extend it when you add a new drawn part.

### Everything else still true

- **`npm run check`** bundles both entry points through esbuild in about a second. Run it before
  handing anything over. It has caught duplicate declarations that would have killed the scene.
- **It will not catch anything geometric.** A mesh facing the wrong way is valid code.
- **`npx vitest run`** — 41 tests, ~17s.
- **Arithmetic is verification.** The opening tilt was found by projecting the candlestick's top into
  NDC, not by looking at it.

## State of the object

- **Plate** 5.94 × 3.26. **Decks** r .93 at x ±1.99. **Screen opening** 1.84 × 1.035.
  **Pads** .23 at .28 pitch. All in the `PROPORTIONS` block near the top of `scene.js`.
- **The room is hidden.** `setRoom(false)` hides room *meshes only, never the Group* — hiding the
  Group would kill the lights inside it. Target was 60fps; measured ~90 with the room off.
- **Lights are not culled by three.** Every visible light compiles into the shader and is evaluated by
  every lit fragment regardless of intensity. `dim(light, 0)` sets `visible = false` for this reason.
  A light at intensity 0 costs full price. This was the whole of ADR-0019.
- **Post is `RenderPass → OutputPass → grade`.** GTAO and bloom are **out of the chain**, not turned
  down — a pass costs what it costs whether or not its output is used. `lift` is `0x000000`; any lift
  at all is a raised black point, which is what "the fog" was, twice.
- **The opening** (`intro.js`): `OPEN` tilt 18 / dist 6.4, `REST` tilt 6 / dist 5.6, straight on
  (yaw 0). `TRAVEL` 3.0, `BOOT` 5.2, `HOLD` 0.7 — camera and boot run on separate clocks so changing
  one does not change the other. Plays every load; a click skips it.
- **Focus** (`focus.js`): clicking a Work zooms the camera until the Screen fills the frame, then a
  DOM panel cross-fades over it. **This reverses ADR-0017** (the plinth). The Screen is 320×180 and
  photographs of posters turn to mush upscaled 4.7×; the DOM holds the content instead, which is
  ADR-0002 and also makes the Works indexable and readable on a phone.
- **Content** is real: `src/content/modules.ts` holds six Modules (IDENT, NOW/NEXT, WORKS, PATH,
  METHOD, OUT) and six real Works with stills in `public/works/`.
- **The Decks are `cross and jogs.png` itself**, cropped — see the 2026-08-28 section. The
  descriptions of drawn rims, medallion bands and phase discs that used to sit here describe code
  that no longer exists. `control-faces.js` still draws the Pads and Crossfader.

## Bugs worth remembering, because this class recurs

*(The first four are from the drawn Deck faces, which no longer exist. They are kept because the
**class** of each recurs and three of them have already recurred elsewhere in this object.)*

- **A drawing function named for what it is not.** `sunVoids`/`moonVoids` drew the tracery and the
  code treated those shapes as the *holes*, so the wheel came out pale with petal-shaped bites in it
  for months. When a name and a use disagree, the use is usually the bug.
- **A geometry change is a lighting change.** Correcting that polarity quadrupled the lit area, and
  the Sun washed out to flat cream. The emissive gain had to drop 1.5 → 0.55. Same light,
  redistributed — not a taste adjustment.
- **`slab()` is an `ExtrudeGeometry`**, and its UV generator emits **shape coordinates in world
  units**, not 0..1. Map a texture naively onto a 0.23-wide Pad and it samples a 0.23-wide sliver and
  comes out one flat colour. `fit()` in `control-faces.js` remaps it.
- **A shape that shears is invisible as a void and obvious as a bar.** `petal()`'s flanks are offset
  by a fraction that grows with radius. Fine as a hole; eight of them as *bars* around a hub read as
  a turbine, because every blade leans the same way. `leaf()` is mirrored by construction.
- **A mesh can be perfect and invisible.** `plateGeom()` bakes its own `rotateX(-90°)`; a leftover
  `face.rotation.x` faced the printed layer at the floor, where it was backface-culled.
- **`metalness: .85` makes albedo a reflection tint, not colour.** Printed colour needed a
  `metalnessMap` dropping the ink to a dielectric before it appeared at all.

## Open

1. **T-14, publish.** A single-file Artifact was published on 2026-08-28 so he had a link to share
   the same day. That is not T-14: it does not back the work up and it is not his domain. Netlify or
   Cloudflare Pages will take `dist-site/` as a drag-and-drop; a GitHub remote first is the version
   that also protects the work. Offer both, do the setup.
2. **Write the ADR for shipping `prototype/`** — or unpick it into `src/` (T-02). Needs his ruling.
3. **`src/App.tsx` is still eleven lines.** T-02 has not moved in three sessions.
4. **One gap left against `cross and jogs.png`**: the Pad row is six separate wells where the
   reference has one continuous brass tray with dividers. The other two closed themselves — the
   Sun's petal ribs came with the artwork, and `HOT CUE` / `CROSSFADE` were removed at his ask, so
   the arrow glyphs that flanked them are moot.
5. **The clipped back candlestick** at the tight framing. Three options were offered, none chosen.
6. **Two models undecided.** He said Grimoire and Cracktro "should be two different models, cause I
   really love them both." The Unit is pinned to Grimoire; Cracktro is unwired but intact in
   `render.js`. **No ADR** — it would reverse 0012, 0015 and 0016 and needs his decision, not a guess.
   Suggestion on the table: ship Tenebrae as Grimoire, make Cracktro Project 002.
7. **Lyra's bubble** is plain. He asked for ornamental, and for it to stop covering text. The covering
   is fixed; the ornament is not.

## Blocked on Fernando

- **The LinkedIn URL.** `modules.ts` has the name "Fernando Linck" and no link. Instagram has both.
- **The PATH glossary rename** — needs his word, and a `CONTEXT.md` entry when it lands.
- **RACK contents** (T-13) — slot 4 still lists influences, not tools. Blocked four sessions.
- **His own voice.** Ident, Method and Lyra's lines are mine. They are honest and they are not his.

## Cautions

- **Build and show. Descriptions do not land.** Every decision that stuck was settled by a render or a
  reference image, never by a paragraph. He said *"i dont understand"* to a wall of text, once.
- **He answers with images.** Check `~/Downloads` when he mentions a reference. Verify the file is
  what it claims — a `.png` was a GIF once — and read the whole thing before assuming which parts
  apply.
- **His references carry more than he asks for.** The faceplate's 1.82 aspect answered a proportions
  problem he had not raised. `cross and jogs.png` was given for three controls and also settled the
  Decks' whole palette. Measure them; crop them with `sips` and look properly.
- **Do not open his browser without asking** — but *do* ask. Four rounds of blind performance fixes
  achieved nothing; twenty minutes of measuring in a real tab found the cause.
- **Give him the thing, not a toggle.** Confirmed three times now.
- **Do not add dependencies** (ADR-0004). When Node could not decode a PNG the answer was 120 lines of
  `zlib`, not a package.
- **He moves fast and reverses himself.** When he changes direction, write the ADR — do not just
  change the code, and do not re-litigate the old one.
- **When he says something is broken, believe him and go find the mechanism.** Every "it's missing"
  and "it's black" has been a real, specific, findable bug — never a taste disagreement. The one
  exception is worth knowing: *"the hover is slow"* was not lag, it was a change of 0.048 in lightness
  on a near-black pad. A response you cannot see and a response that has not happened look identical.
- **The disk.** It has hit 100% before and produced `ENOSPC` with a twenty-minute window where every
  tool call failed. `~/Library/Caches` is the first place to look.
