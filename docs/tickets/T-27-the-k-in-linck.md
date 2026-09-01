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

**Keep UnifrakturMaguntia. Fernando likes the face; only the `k` is wrong.** An earlier draft of this
ticket proposed swapping the whole face — that was taste overriding a clear brief, and it is wrong.

Draw the name in two runs instead of one. `render.js:1890` is currently a single call:

```js
g.fillText(shown, 20, 88)                       // draws "Lincf"
```

Split it so the `k` comes from **Grenze Gotisch**, which is already loaded (`focus.js:339`) and whose
`k` is unambiguous:

```js
g.font = '21px UnifrakturMaguntia, serif'
g.fillText('Fernando Linc', x, y)
const w = g.measureText('Fernando Linc').width
g.font = '19px "Grenze Gotisch", serif'         // ~0.92x, matched by eye
g.fillText('k', x + w, y)
```

Both faces are blackletter, so the substituted glyph does not read as a foreign letter — verified
side by side at 21px, 63px and 150px.

**The type-in cursor must keep working.** The name is typed in one character at a time
(`NAME.slice(0, …)`) with a cursor drawn at the measured width, so the split has to handle the
partial string — while `typeIn` is still short of the `k`, there is no second run to draw.

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
