# T-18 — The accessible mirror of the LCD

**Track A · no dependency · branch `espelho` · Open item 2, and the biggest real gap in the project**

## Goal

Everything the Screen displays is also in the DOM, as semantic HTML, kept in step with the canvas —
so the object can be read by a screen reader, found by find-in-page, and operated without a pointer.

**The canvas stays visually sovereign.** This is not a fallback and not a second design. It is the
same state, expressed twice: once as pixels for the eye, once as markup for everything else.

## Why this is the biggest gap

`ADR-0002` is the project's founding decision: *"Content that exists only as pixels on a canvas
texture is invisible to all of that."* The controls have accessible names. **The content does not
exist.** Today a screen reader meets six buttons named after Modules and then silence — no name, no
role, no case, no project list, no contact route. The primary audience is recruiters, and the object
tells them nothing unless they can see it.

## What exists today, and what does not

In `prototype/index.html`:

- `nav.sr` — six `<button data-act="0..5">`, one per Module. Real, wired to `pressPad`.
- `div.touch` — four `<button data-nav="prev|next|open|back">`. Real, wired.
- `p#turn[role=status]` — a rotate-your-phone message. The only live region in the document.

That is all of it. There is **no** representation of: the live Module's title, its lead, its item
list, which item is selected, the case sections the SUN pages through, the page position, the
footer status line, LYRA's line, or the Vigil's hour.

## Build

**Where: `prototype/`.** That is what ships and what `nanj.in` serves. `T-02` builds the same idea in
`src/`, but `src/App.tsx` is eleven lines and the scene has not been ported (`T-04`), so a mirror
built there helps nobody until it is. This does not foreclose `T-02` — it makes its content
requirements concrete, in the one place a visitor can benefit from them today.

**A single source, read not duplicated.** The Screen renderer already knows all of this; the mirror
must derive from the same state, never from a second copy of the content. `__unit.nav()` returns
`{ page, sel, sec, pages }` and is the shape to start from — extend it rather than reaching into the
renderer's internals. **If the mirror and the Screen can ever disagree, the ticket is not done.**

**The markup.** A `<main>` alongside the canvas, visually hidden but *present*:

- the live Module's title and lead
- its item list as a real list, with the selected item carrying `aria-current`
- the selected item's case sections as headings and paragraphs
- the page position, as text, not as marks

Every Module's text must be in the document **at all times**, not only the live one — find-in-page and
crawlers do not fire your events. `clip-path`/offscreen, **never `display:none`, never `hidden`**,
either of which removes it from find-in-page. See `T-02`'s traps.

**The announcements.** One polite live region that reports *changes*, not the world: "PROJETOS",
"Graecus, item 2 de 3", "página 2 de 6". Re-reading the whole screen on every detent is worse than
silence — a wheel crossing a list would produce a paragraph per step. The renderer already solved the
same problem for events with a settle guard (`trackSettled` in `prototype/track.js`); the same
instinct applies here.

**The controls that have no twin — `T-15`, absorbed here.** Three controls exist only as boxes the
draw hit-tests (the `screenPoint`/`inBox` block in `scene.js`): `◂ VOLTAR` on a detail page, the sky
mark that reopens ECLIPSE, and `ABRIR O INSTAGRAM · @NAN._.JIN` on the seventh screen. **The Instagram
one is the one that matters** — it is the prize for finding the secret and it is unreachable without a
pointer. Do not let this ship without them.

## Done when

- A screen reader, with the canvas ignored, can learn who Fernando is, list the projects, read a case,
  and reach the contact routes.
- Find-in-page finds a string from every Module, including the five that are not live.
- Every control the Screen paints is reachable by Tab and Enter.
- Changing Module, item or page announces the change — once, and only the part that changed.
- Tests cover: all six Modules' text present at all times, `aria-current` follows the selection, the
  mirror's title matches `__unit.nav()` after a Pad press.

## Traps

- **`visibility:hidden` and `display:none` both hide content from find-in-page.** Use the
  visually-hidden pattern (clip + 1px), not either of those, and not `hidden`.
- **`aria-live` re-reads what changed inside it.** Swapping the whole region's text re-announces
  everything. Put only the announcement in the live region; keep the content itself outside it.
- **The focus trap in `focus.js` filters on `offsetParent !== null` and `tabIndex >= 0`.** A visually
  hidden mirror has `offsetParent`, so anything focusable you add becomes a tab stop *inside the work
  overlay* as well. Check the panel's tab order after adding controls — it was 9 stops, went to 18 when
  a thumbnail strip landed, and is 11 now.
- **`rAF` fires zero times in an automated tab.** Drive with `__unit.step(t)` then `__unit.render()`,
  read state with `__unit.nav()`. Anything you verify by watching an animation cannot be verified here.
- **The build is not the dev server.** Three separate bugs shipped that were invisible in `npm run
  prototype`. Run `npm run build:site` and `npm run verify:site` before believing anything.
- **Do not add dependencies** (`ADR-0004`).

## Verify

`npm run prototype`, then a real browser. `npx vitest run`, `npm run typecheck`, `npm run check`,
`npm run build:site`, `npm run verify:site` all pass before this is called done.

## Out of scope

The case prose itself. It is in Claude's voice and sits under *Blocked on Fernando* — the mirror
presents whatever `modules.ts` holds and does not rewrite a word of it.
