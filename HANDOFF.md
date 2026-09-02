# Handoff — Fernando Linck portfolio ("Tenebrae")

**Date:** 2026-08-31 · **Repo:** `~/dev/fernando-portfolio` · **Branch:** `lyra`
**Remote:** https://github.com/fernandolinck3/tenebrae · **Live:** https://nanj.in
**Language:** Fernando writes EN and PT-BR, often in one message; the *product* is PT-BR.
Reply in whichever he used last (last was mixed, leaning PT-BR).

## Read this first

**Twenty-six ADRs**, several of them reversals. `CONTEXT.md` is the glossary.
`docs/tickets/README.md` is the board. `docs/realism-budget.md` is the plan for adding to the room
without spending the frame. This file does not repeat them.

**Everything is committed and deployed.** Sixteen commits on 2026-08-28, working tree clean, and
`origin/lyra` is level with local. Nothing is waiting on a ruling.

**The site is live on his own domain, over HTTPS.**

> **https://nanj.in**

`.github/workflows/pages.yml` builds and deploys on every push to `lyra`, the repo's default branch.
It runs `npx vitest run` and `npm run verify:site` before uploading — the content tests guard what
the site claims about Fernando, and `verify:site` catches a class of build-only failure described
below. **`public/CNAME` holds the domain**: a deploy that arrives without that file clears the custom
domain silently, so never move or drop it.

DNS is at **Hostinger** (nameservers `dns-parking.com`), four `A` and four `AAAA` records on `@`
pointing at GitHub Pages. `www.nanj.in` resolves and redirects over plain HTTP but **has no
certificate** — GitHub issued one for the apex only. Left alone deliberately; covering `www` means
making it canonical, which is ugly on a four-letter domain. See *Open*.

The Claude Artifact from 2026-08-28 is still live at
`https://claude.ai/code/artifact/cc6c648f-de43-4462-b796-0b099d6740f5` and is a **second copy that
can drift**. `nanj.in` is canonical; if the Artifact is kept, republish it from the same build whenever Pages moves.

## The goal he actually stated

> *"i need a version online of my portfolio asap"*

**That is done.** It is on his domain, over HTTPS, rebuilt on every push. What the work is *about*
now is the object itself, and the standing brief for that is the long list under *Open*.

## The diary lives in `docs/log/`

Every dated *"What changed on …"* section is in **`docs/log/2026-08.md`**, newest first, moved
verbatim. Read it when you need to know why something is the way it is, or when a change you are
about to make looks like one that was already tried. You do not need it to start working.

This file keeps **state and decisions**. Reasoning goes in the commit message — `git log --oneline`
is cheap and nobody loads a commit body into context. Do not write it in both places.

## Where this was left on 2026-09-02, and how to pick it up

**Everything below is committed and deployed.** `origin/lyra` is the live branch; a push to it
builds, tests and deploys to `nanj.in` in about a minute. The working tree is clean and the main
checkout is current — the `explode.js` lines an older session left uncommitted went in as `276c561`.

**The site is now two pages.**

> **https://nanj.in** · **https://nanj.in/en/**

One source produces both. `src/content/page.ts` turns `prototype/index.html` into the page for a
locale; the Vite plugin emits them in `generateBundle`. There is no second `index.html` on disk and
there must never be. `verify:site` asserts both pages on every deploy.

**To read what happened rather than take it on trust**, the commit bodies are long on purpose:

```
git log --oneline -40          the two days, one line each
git show <sha>                 any commit, with the reasoning
```

**What shipped on 2026-09-01**, in order: the handoff split (T-19), the accessible mirror merged and
then pre-rendered (T-18, T-26), the `k` in Linck (T-27), three holes in the overlay (T-23), a contact
form with its ADR (T-28, ADR-0027), a no-GPU fallback, the boot cut to 2,42s (T-21), a consent gate,
the LinkedIn URL, the documents corrected (T-25), and a `schema.org` block.

**What shipped on 2026-09-02**: the candle favicon, the resting framing (T-22), and the English
portfolio (T-31) — machine, chrome and content, in three commits, now indexable.

**One thing wants his eyes**: the consent bar on a phone. It only appears where no answer is stored,
so it takes a private window. The Chrome extension has been down since 2026-09-01 and nothing
automated can reach it.

**Two commands to see it locally:**

```
npm run build:site && npm run preview:site     the real site
                    /en/                        the English page
                    ?flat                       the no-GPU version
                    ?turned                     the phone's rotated frame, on a desktop
                    ?debug                      the workbench dials
                    ?track                      dataLayer pushes on any host
```

## Two agents, two worktrees — read this before editing content

Since 2026-09-02 the work is split, because it collided once: two sessions wrote
`src/content/modules.ts` in the same checkout, one of them mid-flight with five red
tests, and neither could commit without shipping or clobbering the other.

| Where | Branch | Whose |
|---|---|---|
| `~/dev/fernando-portfolio` | `lyra` | SEO, GEO, the build, the mirror, the languages |
| `~/dev/tenebrae-telas` | `telas` | the project screens and the copy |

**Only `lyra` deploys.** `pages.yml` fires on pushes to it and nothing else, so work
on `telas` reaches the site by merge and not by accident. That is the protection: on
2026-09-02 it is what kept a `modules.ts` with seven projects and five failing tests
off the live site.

**Pending, and waiting on him:** he is finishing a pass on the copy with the other
agent. When it lands, this side picks it up for the SEO reading — better search terms
in `description`, in each Module's `hint` and in `llms.txt`. Nothing here should touch
`modules.ts` until that merge.

**One thing needed from him:** a GitHub URL, if he has one. `sameAs` carries Instagram
and LinkedIn; for someone who writes code, GitHub is the strongest signal tying the
identity together — and nobody here invents a profile URL, for the same reason the
LinkedIn row stayed inert for four sessions.

## The two languages, in one paragraph

Content lives in `src/content/modules.ts`, in Portuguese, and **is not translated in place**.
`src/content/en.ts` maps Portuguese to English and `translate()` swaps the leaves. `modules.ts`
resolves the page's language on import off `<html lang>`, so every consumer — `scene.js`,
`render.js`, `flat.js`, `focus.js`, `mirror.js` — keeps importing `MODULES` and gets the right
language without knowing a second one exists. The chrome is different: `src/content/strings.ts`
holds it as `t(pt, en)` pairs, where a missing translation is a compile error. Content has no such
guarantee, so `modules.test.ts` supplies it — a Portuguese sentence with no entry in `en.ts` fails
the suite. **LUA and SOL are deliberately untranslated**: they are the names engraved on the
controls, and T-30 is where that gets revisited.

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
each one by id and throws on the first missing element — do not delete them. Since **T-26** they also
carry `hidden` + `aria-hidden`, because `.ctl{display:none}` hid them from the eye and from nothing
else: `BEVEL 10 / TILE 1.00 / SEED 25` was the built page's entire readable content. The `?debug`
script lifts `aria-hidden` when it opens the row.

**The mirror is pre-rendered into `dist-site/index.html`** (T-26). `vite.site.config.ts` calls
`mirrorIntoPage` from `src/content/mirror.ts` through `transformIndexHtml` — the *same* renderer the
browser uses, run in node — and `prototype/mirror.js` adopts the `<main id="mirror">` it finds instead
of building one. So the static HTML carries the portfolio for everything that runs no JavaScript (an
ATS, a link unfurler, `curl`), and the runtime mirror still follows navigation. The page's only
`<h1>` comes from there. Measured: **469 readable characters before, 5,675 after**; `npm run
verify:site` now asserts six Modules, seventeen rows, one heading and the hidden workbench, because
the property is build-only by construction and no test of the source can see it.

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
- **The Decks are `cross and jogs.png` itself**, cropped — see `docs/log/2026-08.md`. The
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

### The build is not the dev server, and it bit three times in one day

This is now the most productive place to look when something is wrong only in production:

- **The built page loaded nothing.** Vite injects the module script immediately after the first
  *literal* occurrence of the root element's tag in the source — and the comment above it contained
  that tag, so the script was injected **inside the comment**. No console error, no build warning,
  invisible in development because the dev server injects nothing. The first Pages deploy was blank.
  `npm run verify:site` now strips comments from `dist-site/index.html` and asserts a module script
  survives, and checks the charset is inside the first 1024 bytes. It runs in the workflow.
- **The Plate artwork never shipped.** `prototype/ornament/plate.png` sat under Vite's `root` but
  `publicDir` is `../public`, so the dev server served it and `dist-site/` never contained it. Every
  build fell back to the procedural vine, and *the console said so on every load* —
  `no ornament artwork; using the procedural vine`. It was read past.
- **The page had no `<meta name="viewport">` at all.** A phone laid it out at a 980px virtual width
  and scaled down, which is most of "tudo muito pequeno" on mobile, and fed the rotated frame a
  width that was not the device's.

Two more from the same day, different class:

- **A TDZ in a module-scope list.** The glow-layer array reached forward to `ledMeshes`, declared
  1200 lines later. `ReferenceError` before the first frame, whole scene dead. Module-scope arrays
  that name things run at import time.
- **`fetch` is blocked under an Artifact's CSP**, and `scene.js` probes for the faceplate with a
  `HEAD` request before touching the image — right against a real server, fatal there. If something
  works on Pages and not in the Artifact, look for a probe.

## Open

**His standing brief, given 2026-08-28 and mostly not started.** It is long and specific; this is the
part to work from, not from taste.

1. ~~**The project overlay's architecture.**~~ **Done 2026-08-31** — see `docs/log/2026-08.md`. Every
   part of the brief is built and measured: 60/40, the fixed header, three sections in the first
   fold, the drawn indicator, and his mobile order. The one thing it does not close is item 7
   below: the phone layout was verified in a 402px iframe, not in a hand.
2. ~~**The accessible mirror of the LCD.**~~ **Done 2026-09-01** (T-18, then T-26). Every word is
   real HTML, built from `modules.ts` by one renderer run at build time and adopted at runtime — not
   a second copy. Written into `dist-site/index.html` before any script runs, so it reaches a reader
   that never executes JavaScript. **465 readable characters became 5.827**, there is one `<h1>`, and
   a `schema.org` `Person` block says who he is rather than leaving Google to guess. `verify:site`
   asserts the structure on every deploy, so this cannot silently regress.
3. **Per-project case content.** Portfolio should present the system as the project — boot, modules,
   decks, LYRA, interactions, ECLIPSE, and **it has no images at all**, so the overlay opens it on an
   empty media column. Graecus should tie the eight captures to the WordPress build. ~~Miscelânea
   must stop saying the content is coming "em breve"~~ — done 2026-08-31, along with the same promise
   under every other case. The prose itself is still mine, which is why it is still under *Blocked on
   Fernando* rather than here.
4. ~~**Boot in 2–2.5s.**~~ **Done 2026-09-01** (T-21). **5,90s → 2,42s**, measured by driving the
   opening a frame at a time in `intro.test.js`, because `rAF` cannot be used to time anything here.
   The four beats are untouched — only the dwell went. A repeat load in the same session plays at
   0.42x rather than skipping, so whoever is building this still sees it. `TOQUE PARA PULAR` appears
   after ~1.2s, because a click always ended the opening and nothing ever said so.
5. **PROJETOS: the SUN should reveal a short preview** of the selected project — one factual line,
   optionally a small monochrome image — with pressing the Screen opening the full case. Today the
   SUN just moves the cursor there, because those items have no pages.
6. **CONTATO — half done.** A form is built and live (T-28, ADR-0027), the LinkedIn URL arrived on
   2026-09-01 and the row acts, and both addresses are real `<a href>` in the static HTML. **What is
   left is discovery, not hierarchy:** nothing at rest says the route exists, and a visitor can spend
   thirty seconds and leave with no way to reach him. His own suggestion, to build: a slow pulse on
   the CONTATO lamp after ~20s of it not having been opened, stopping for good once it is. A breath,
   not a blink — a blink reads as an alarm and nothing here is urgent. **The order stays**: CONTATO
   closing the six is right, and moving it was never the ask.
7. **Mobile, on a real device — and it has now found its first bug.** He held a phone on
   2026-09-01 and the form came up sideways: it was mounted inside `#frame`, which a portrait phone
   rotates 90°, and a transformed element is the containing block for everything in it, fixed
   overlays included. Looking at a turned object is the design; typing into one is not, because the
   keyboard arrives in the device's orientation. Fixed — the form, the mirror and the consent bar all
   live on `document.body` now. **Still unseen on a phone:** the consent bar,
   and whether the case overlay reads well turned (left alone deliberately — it is reading, not
   typing, so rotating with the object is coherent).
8. **Record the film.** `?film` is built and never run. It needs a visible window; the framing
   numbers come from geometry, not from watching it.

**Older, still open:**

9. ~~**Two names on one object.**~~ **Ruled 2026-08-31: Fernando Linck, everywhere.** He was asked
   directly and chose the name the domain, the email and the metadata already used. Applied in the
   four places that disagreed: `modules.ts` (QUEM), `prototype/screen/render.js` (the boot screen's
   `NAME`), and the root `index.html`'s title and description — that last one is the dormant `src/`
   entry, changed so it cannot ship the old name if `T-04` ever lands. `prototype/index.html` already
   said Linck in every tag and was not touched. **Nothing on the object says Bittencourt any more.**

   Still open beside it: the LinkedIn row has a label and **no URL**, so it does not act. And the
   root `index.html` positions him as *"frontend developer with a marketing perspective"* while the
   shipped page says *"growth, CRO e experiências digitais"* — two different self-descriptions in one
   repo. Only one of them ships today. Not touched: it is positioning, which is his.
10. **`www.nanj.in` has no certificate.** It resolves and redirects over plain HTTP; over HTTPS it
    hits GitHub's `*.github.io` cert and warns. Covering it means making `www` canonical, which is
    ugly on a four-letter domain. Deliberate, and his call.
11. **Write the ADR for shipping `prototype/`** — or unpick it into `src/` (T-02). Needs his ruling.
12. **`src/App.tsx` is still eleven lines.** T-02 has not moved in four sessions.
13. **One gap left against `cross and jogs.png`**: the Pad row is six separate wells where the
    reference has one continuous brass tray with dividers.
14. **The clipped back candlestick** at the tight framing. Three options were offered, none chosen.
15. **Two models undecided.** He said Grimoire and Cracktro "should be two different models, cause I
    really love them both." The Unit is pinned to Grimoire; Cracktro is unwired but intact in
    `render.js`. **No ADR** — it would reverse 0012, 0015 and 0016 and needs his decision, not a
    guess. Suggestion on the table: ship Tenebrae as Grimoire, make Cracktro Project 002.
16. **Lyra's bubble** is plain. He asked for ornamental. The covering-text half is fixed.

## Blocked on Fernando

- **The GTM container is still not imported.** The corrected export is
  `docs/analytics/gtm-nanj-in.json` and nothing blocks it. Four things are his alone: import it
  (*Merge*, and **Overwrite** while the container holds nothing but the failed import of this same
  file), confirm one hit in GA4 Realtime, register the six custom dimensions (`module`, `item`,
  `work`, `image`, `route`, `face`), and rule on consent. Detail in `docs/log/2026-08.md`.
- **He has not seen the image-based Decks**, nor the project overlay built on 2026-08-31. Both were
  verified in an automated tab; his judgement is the thing missing.
- ~~**The LinkedIn URL.**~~ **Given 2026-09-01** — `https://www.linkedin.com/in/fernandolinck/`. The row acts now; it had stayed inert rather than guess a slug, which is why there was nothing to unpick when the address arrived.
- **The PATH glossary rename** — needs his word, and a `CONTEXT.md` entry when it lands.
- **RACK contents** (T-13) — slot 4 still lists influences, not tools. Blocked four sessions.
- **His own voice.** QUEM, CRITÉRIOS and Lyra's lines are mine. They are honest and they are not his.
  The ECLIPSE copy is mine too, and it is the most *written* thing on the object.
- **The Graecus captures are in** (six site screenshots, `public/works/graecus-*.jpg`), and the case
  section describes them. That one is closed.

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
- **The Chrome extension gives out.** Screenshots start timing out, then `javascript_tool` loses the
  tab, and creating a fresh tab is what recovers it. It happened perhaps a dozen times on
  2026-08-28. Budget for it: prefer one probe that returns numbers over five that return pictures,
  and never let a verification plan depend on a long sequence of screenshots.
- **rAF fires zero times in an automated tab.** Drive the scene with `__unit.step(t)` then
  `__unit.render()`, and read state with `__unit.nav()`. Anything timing-based — the opening, the
  ECLIPSE transition, the film — cannot be observed here at all and has to be handed to him.
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
