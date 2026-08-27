# Handoff — Fer Bittencourt portfolio ("Tenebrae")

**Date:** 2026-08-27 · **Repo:** `~/dev/fernando-portfolio` · **Branch:** `lyra` · **HEAD:** `2683835`
**Language:** Fernando writes EN and PT-BR; reply in whichever he used last (last was EN).

## Read this first

**Twenty-three ADRs**, several of them reversals. `CONTEXT.md` is the glossary.
`docs/tickets/README.md` is the board. `docs/realism-budget.md` is the plan for adding to the room
without spending the frame. This file does not repeat them.

**The working tree is clean and 54 commits deep.** Unlike every previous handoff, there is no pile of
uncommitted work to worry about.

**There is still no remote.** `git remote -v` is empty. Fifty-four commits and about a week of work
exist as **one copy on one disk**, now that the repo is out of iCloud. T-14 is his call and has been
raised in four consecutive sessions; raise it again, early, and offer to do the whole setup.

## The goal he actually stated

> *"i need a version online of my portfolio asap"*

That is the frame for everything below. It is closer than it has ever been — the build works and
produces a real site — and the only thing left is somewhere to put it.

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
- **The Decks and controls follow `cross and jogs.png`** (2026-08-27): reeded rim, medallion band,
  tracery field, a boss at the hub. Sun counts in stars, Moon in phases. `control-faces.js` draws the
  Pads and Crossfader.

## Bugs worth remembering, because this class recurs

- **A drawing function named for what it is not.** `sunVoids`/`moonVoids` drew the tracery and the
  code treated those shapes as the *holes*, so the wheel came out pale with petal-shaped bites in it
  for months. They are `sunBars`/`moonBars` now. When a name and a use disagree, the use is usually
  the bug.
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

1. **T-14, publish.** Blocked on him, and now the only thing between him and his stated goal. Netlify
   or Cloudflare Pages will take `dist-site/` as a drag-and-drop; a GitHub remote first is the version
   that also protects the work. Offer both, do the setup.
2. **Write the ADR for shipping `prototype/`** — or unpick it into `src/` (T-02). Needs his ruling.
3. **`src/App.tsx` is still eleven lines.** T-02 has not moved in three sessions.
4. **Three deliberate gaps against `cross and jogs.png`**, all offered and none taken: the Pad row is
   six separate wells where the reference has one continuous brass tray with dividers; the Sun's
   petals are flat where the reference carves a rib down each; `HOT CUE` / `CROSSFADE` lack the arrow
   glyphs flanking them.
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
