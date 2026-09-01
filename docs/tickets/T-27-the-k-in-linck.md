# T-27 — His name is the one word that must be legible, and the k is not

**Track B · `prototype/screen/render.js` · no dependency · small**

## Goal

"Fernando Linck" reads as his name at a glance, on the Screen, at render size.

## What is wrong

Fernando's report: **the letter k in Linck is weird.** He is right, and the code already knows why.

The name is drawn in **UnifrakturMaguntia at 21px** (`render.js:1888`) onto a **320×180** buffer,
then mapped onto an angled, colour-graded Plate. Blackletter's lowercase `k` has a bowed, looped
shoulder that does not resemble a modern `k`, and in the `ck` pair it collides with the `c` and reads
as a single unfamiliar glyph.

The file says this about the same face, sixteen hundred lines earlier (`render.js:241`):

> "CRITÉRIOS" set in UnifrakturMaguntia is a row of shapes.

The reasoning for blackletter is sound and recorded at `render.js:1874` — the name is the one line on
the boot Screen that is not machine output. The face is right for the *idea*. It is wrong for **this
surname at this size**, and a surname that has to be guessed at is worse than a plain one.

## Build

Try these in order and keep the first that reads, judged at render size in a real browser:

1. **Set the name in `Grenze Gotisch`** — already loaded, already the face the Modules title
   themselves with (`focus.js:339`), and a far more modern `k`. Smallest possible change.
2. **Keep UnifrakturMaguntia and raise the size** so the `ck` separates at the Plate's scale.
3. **Blackletter initials, roman lowercase** — `F` and `L` in Unifraktur, the rest in Archivo. This is
   what the tradition actually does and what the comment at `render.js:1878` already argues for.

## Done when

- Someone who has never seen the name reads "Linck" correctly from the resting framing.
- The boot Screen still reads as the Unit's own hand, not as a web page.

## Traps

- **Judge it at render size in a real browser**, not in the source and not in a headless still — the
  Screen is a 320×180 buffer drawn small, angled and graded, and a glyph that is fine in a font
  preview can be mush there. `prototype/deck-fit/` draws straight to a plain canvas synchronously and
  is the right bench for this.
- **The name appears in more than one place.** `render.js:1864` (`const NAME`), `modules.ts:404` and
  `:710`. Changing the *face* is presentation and belongs in `render.js` only — do not touch the
  content source.
- This is his name. Show him before committing to a face.
