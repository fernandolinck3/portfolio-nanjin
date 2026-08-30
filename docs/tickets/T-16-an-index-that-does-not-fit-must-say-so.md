# T-16 — An index that does not fit has to say so

**Track B · absorbed by whichever Module grows first**

## Goal

Nothing on the Screen can be silently missing.

## What a review found

`overflow` is incremented in exactly one place — `flow()` in `prototype/screen/render.js` — which
draws only the `lead`, the `dim` line, and the identity prose. **None of the four index renderers
touch it**, and two of them truncate outright:

```js
items.slice(0, 4).forEach(…)      // drawGrid
const n = Math.min(items.length, 3)  // drawNodes
```

A fifth skill or a third TRAJETO node is drawn nowhere and reported nowhere, while `moveSelection`
still lands the cursor on it: the reader turns the wheel onto a row that does not exist.

Fernando's own line, quoted in the renderer: *"Nenhum item pode parecer cortado ou oculto."*
ADR-0025: *"the `+N` warning in the corner only ever reports a Module whose index does not fit —
which is what it was for."* It cannot, today.

## Why it is not urgent

HABILIDADES has exactly four groups and TRAJETO exactly two nodes, so nothing is hidden right now.
It bites the moment content grows — which is also the moment someone is editing that renderer.

## When it lands

Each index renderer counts what it could not draw into `overflow`, and the budget test asserts the
counts a Module's `items` can reach against what its `layout` can show.
